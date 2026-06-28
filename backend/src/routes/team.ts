import { Router, Request, Response } from "express";
import multer from "multer";
import { randomUUID } from "node:crypto";
import { supabase } from "../db/supabase.js";
import { authenticateAdmin } from "../middleware/auth.js";
import { TeamMember } from "../types.js";

const teamRouter = Router();

const BUCKET = "photos";

// In-memory upload; compressed client-side, well under Vercel's 4.5 MB limit.
const upload = multer({ storage: multer.memoryStorage() });
const uploadFields = upload.fields([
  { name: "photo", maxCount: 1 },
  { name: "badge", maxCount: 1 },
]);

type MulterFiles = { [field: string]: Express.Multer.File[] } | undefined;

/**
 * Derive the in-bucket storage path from a public URL so we can delete the
 * underlying object. Public URLs look like:
 *   {SUPABASE_URL}/storage/v1/object/public/photos/{path}
 */
function storagePathFromPublicUrl(url: string): string | null {
  const marker = `/storage/v1/object/public/${BUCKET}/`;
  const idx = url.indexOf(marker);
  if (idx === -1) return null;
  return url.slice(idx + marker.length);
}

// Upload a single file to storage and return its public URL.
async function uploadToStorage(
  file: Express.Multer.File,
): Promise<string | null> {
  const ext = file.originalname.split(".").pop() ?? "jpg";
  const path = `team/${randomUUID()}.${ext}`;

  const { error } = await supabase.storage
    .from(BUCKET)
    .upload(path, file.buffer, { contentType: file.mimetype, upsert: false });

  if (error) return null;

  const {
    data: { publicUrl },
  } = supabase.storage.from(BUCKET).getPublicUrl(path);
  return publicUrl;
}

// GET /api/team  (public)
teamRouter.get("/", async (_req: Request, res: Response) => {
  const { data, error } = await supabase
    .from("team_members")
    .select("*")
    .order("sort_order", { ascending: true });

  if (error) {
    res.status(500).json({ message: "Failed to fetch team" });
    return;
  }
  res.json(data);
});

// POST /api/team  (admin) - create a member with photo (+ optional badge)
teamRouter.post(
  "/",
  authenticateAdmin,
  uploadFields,
  async (
    req: Request<{}, {}, { name: string; title: string; linkedin_url?: string; github_url?: string; sort_order?: number }>,
    res: Response,
  ) => {
    const { name, title } = req.body;
    const files = req.files as MulterFiles;
    const photoFile = files?.photo?.[0];

    if (!name || !title) {
      res.status(422).json({ message: "Name and title are required" });
      return;
    }
    if (!photoFile) {
      res.status(422).json({ message: "Photo is required" });
      return;
    }

    const photoUrl = await uploadToStorage(photoFile);
    if (!photoUrl) {
      res.status(500).json({ message: "Photo upload failed" });
      return;
    }

    let badgeUrl: string | null = null;
    const badgeFile = files?.badge?.[0];
    if (badgeFile) {
      badgeUrl = await uploadToStorage(badgeFile);
      if (!badgeUrl) {
        // Roll back the orphaned photo.
        const path = storagePathFromPublicUrl(photoUrl);
        if (path) await supabase.storage.from(BUCKET).remove([path]);
        res.status(500).json({ message: "Badge upload failed" });
        return;
      }
    }

    const { data, error } = await supabase
      .from("team_members")
      .insert({
        name,
        title,
        photo_url: photoUrl,
        badge_url: badgeUrl,
        linkedin_url: req.body.linkedin_url || null,
        github_url: req.body.github_url || null,
        sort_order: req.body.sort_order ?? 0,
      })
      .select()
      .single();

    if (error) {
      // Roll back orphaned storage objects.
      for (const url of [photoUrl, badgeUrl]) {
        if (!url) continue;
        const path = storagePathFromPublicUrl(url);
        if (path) await supabase.storage.from(BUCKET).remove([path]);
      }
      res.status(500).json({ message: "Server error" });
      return;
    }
    res.status(201).json(data);
  },
);

// PUT /api/team/:id  (admin) - update info, optionally replace photo/badge
teamRouter.put(
  "/:id",
  authenticateAdmin,
  uploadFields,
  async (
    req: Request<
      { id: string },
      {},
      { name?: string; title?: string; linkedin_url?: string; github_url?: string; sort_order?: number }
    >,
    res: Response,
  ) => {
    const { data: existing, error: fetchError } = await supabase
      .from("team_members")
      .select("*")
      .eq("id", req.params.id)
      .maybeSingle();

    if (fetchError) {
      res.status(500).json({ message: "Server error" });
      return;
    }
    if (!existing) {
      res.status(404).json({ message: "Member not found" });
      return;
    }
    const member = existing as TeamMember;

    const updates: Partial<TeamMember> = {};
    if (req.body.name !== undefined) updates.name = req.body.name;
    if (req.body.title !== undefined) updates.title = req.body.title;
    if (req.body.sort_order !== undefined)
      updates.sort_order = req.body.sort_order;
    if (req.body.linkedin_url !== undefined)
      updates.linkedin_url = req.body.linkedin_url || null;
    if (req.body.github_url !== undefined)
      updates.github_url = req.body.github_url || null;

    const files = req.files as MulterFiles;
    const oldPaths: string[] = [];

    const photoFile = files?.photo?.[0];
    if (photoFile) {
      const url = await uploadToStorage(photoFile);
      if (!url) {
        res.status(500).json({ message: "Photo upload failed" });
        return;
      }
      updates.photo_url = url;
      const old = storagePathFromPublicUrl(member.photo_url);
      if (old) oldPaths.push(old);
    }

    const badgeFile = files?.badge?.[0];
    if (badgeFile) {
      const url = await uploadToStorage(badgeFile);
      if (!url) {
        res.status(500).json({ message: "Badge upload failed" });
        return;
      }
      updates.badge_url = url;
      if (member.badge_url) {
        const old = storagePathFromPublicUrl(member.badge_url);
        if (old) oldPaths.push(old);
      }
    }

    if (Object.keys(updates).length === 0) {
      res.status(422).json({ message: "No fields to update" });
      return;
    }

    const { data, error } = await supabase
      .from("team_members")
      .update(updates)
      .eq("id", req.params.id)
      .select()
      .single();

    if (error) {
      res.status(500).json({ message: "Server error" });
      return;
    }

    // Clean up replaced storage objects after a successful update.
    if (oldPaths.length > 0) {
      await supabase.storage.from(BUCKET).remove(oldPaths);
    }

    res.json(data);
  },
);

// DELETE /api/team/:id  (admin) - remove member + their storage objects
teamRouter.delete(
  "/:id",
  authenticateAdmin,
  async (req: Request<{ id: string }>, res: Response) => {
    const { data: member, error: fetchError } = await supabase
      .from("team_members")
      .select("photo_url, badge_url")
      .eq("id", req.params.id)
      .maybeSingle();

    if (fetchError) {
      res.status(500).json({ message: "Server error" });
      return;
    }
    if (!member) {
      res.status(404).json({ message: "Member not found" });
      return;
    }

    const m = member as Pick<TeamMember, "photo_url" | "badge_url">;
    const paths = [m.photo_url, m.badge_url]
      .filter((u): u is string => !!u)
      .map((u) => storagePathFromPublicUrl(u))
      .filter((p): p is string => p !== null);

    if (paths.length > 0) {
      await supabase.storage.from(BUCKET).remove(paths);
    }

    const { error } = await supabase
      .from("team_members")
      .delete()
      .eq("id", req.params.id);

    if (error) {
      res.status(500).json({ message: "Server error" });
      return;
    }
    res.status(204).send();
  },
);

export default teamRouter;
