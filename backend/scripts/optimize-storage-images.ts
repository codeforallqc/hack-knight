// One-time migration: shrink every image in the photos bucket and give it a
// long cacheControl. Public images are served straight from Supabase storage,
// so their size and cacheability decide how much egress the site burns.
//
// For each object:
//   - Raster images larger than their display size (see MAX_EDGE) are
//     resized and re-encoded as WebP, the same as the admin uploader does
//     (frontend/src/lib/api.ts). The result is kept only if it's smaller.
//   - Everything is re-uploaded with a one-year cacheControl. Objects
//     uploaded before the routes passed cacheControl (or through the
//     dashboard) were stored with `no-cache`.
//
// Objects are overwritten at the same path, so DB URLs stay valid. The
// extension may then disagree with the content (x.png serving WebP), which
// is harmless: browsers go by the Content-Type header. Rewriting a URL's
// content is only safe here because the old objects were `no-cache`.
// Already-optimized WebPs keep their bytes, so re-running never changes
// content behind an immutable URL.
//
// Storage metadata can't be edited in place; the only way to change it is to
// upload again with `upsert: true`.
//
// Run against the environment in backend/.env:
//   npx tsx scripts/optimize-storage-images.ts --dry-run   # report only
//   npx tsx scripts/optimize-storage-images.ts
// For production, run with the production SUPABASE_URL / SUPABASE_SECRET_KEY.

import "dotenv/config";
import sharp from "sharp";
import { IMMUTABLE_CACHE, supabase } from "../src/db/supabase.js";

const BUCKET = "photos";
const DRY_RUN = process.argv.includes("--dry-run");

// Longest edge by top-level folder; keep in sync with frontend/src/lib/api.ts.
const GALLERY_EDGE = 1600;
const THUMB_EDGE = 512;

function maxEdgeFor(path: string): number {
  return path.startsWith("gallery/") ? GALLERY_EDGE : THUMB_EDGE;
}

// storage.list() is per-folder, so walk the tree.
async function listFiles(prefix: string): Promise<string[]> {
  const { data, error } = await supabase.storage.from(BUCKET).list(prefix, {
    limit: 1000,
  });
  if (error) throw new Error(`list("${prefix}") failed: ${error.message}`);

  const files: string[] = [];
  for (const entry of data ?? []) {
    const path = prefix ? `${prefix}/${entry.name}` : entry.name;
    // Folders come back with a null id; files have one.
    if (entry.id) files.push(path);
    else files.push(...(await listFiles(path)));
  }
  return files;
}

// Returns the bytes and type to store: a resized WebP when that's smaller,
// otherwise the original.
async function optimize(
  path: string,
  original: Buffer,
  type: string,
): Promise<{ body: Buffer; type: string }> {
  const keep = { body: original, type };
  if (!type.startsWith("image/") || type === "image/svg+xml") return keep;

  const maxEdge = maxEdgeFor(path);
  let meta: sharp.Metadata;
  try {
    meta = await sharp(original).metadata();
  } catch {
    return keep; // not a format sharp can read
  }
  // Animated images would lose their frames.
  if ((meta.pages ?? 1) > 1) return keep;

  const longest = Math.max(meta.width ?? 0, meta.height ?? 0);
  if (meta.format === "webp" && longest <= maxEdge) return keep;

  const body = await sharp(original)
    .rotate() // apply EXIF orientation before it's stripped
    .resize({
      width: maxEdge,
      height: maxEdge,
      fit: "inside",
      withoutEnlargement: true,
    })
    .webp({ quality: 80 })
    .toBuffer();
  return body.length < original.length ? { body, type: "image/webp" } : keep;
}

const kb = (n: number) => `${(n / 1024).toFixed(0)} KB`;

async function main() {
  const files = await listFiles("");
  console.log(`${files.length} objects in "${BUCKET}"${DRY_RUN ? " (dry run)" : ""}`);

  let migrated = 0;
  let before = 0;
  let after = 0;
  for (const path of files) {
    const { data, error: downloadError } = await supabase.storage
      .from(BUCKET)
      .download(path);
    if (downloadError || !data) {
      console.error(`SKIP ${path}: download failed (${downloadError?.message})`);
      continue;
    }

    const original = Buffer.from(await data.arrayBuffer());
    const { body, type } = await optimize(path, original, data.type);
    before += original.length;
    after += body.length;

    if (!DRY_RUN) {
      const { error: uploadError } = await supabase.storage
        .from(BUCKET)
        .upload(path, body, {
          contentType: type || undefined,
          cacheControl: IMMUTABLE_CACHE,
          upsert: true,
        });
      if (uploadError) {
        console.error(`SKIP ${path}: upload failed (${uploadError.message})`);
        continue;
      }
    }

    migrated += 1;
    const change =
      body === original
        ? `${kb(original.length)} (kept)`
        : `${kb(original.length)} -> ${kb(body.length)}`;
    console.log(`OK   ${path}  ${change}`);
  }

  console.log(
    `Done: ${migrated}/${files.length} ${DRY_RUN ? "checked" : "migrated"}, ` +
      `${kb(before)} -> ${kb(after)}`,
  );
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
