import { Router, Request, Response } from "express";
import multer from "multer";
import { randomUUID } from "node:crypto";
import { supabase } from "../db/supabase.js";
import { authenticateAdmin } from "../middleware/auth.js";
import {
  GalleryPhoto,
  GalleryYear,
  GalleryYearWithPhotos,
  ReorderBody,
} from "../types.js";

const galleryRouter = Router();

const BUCKET = "photos";

// In-memory upload; compressed client-side, well under Vercel's 4.5 MB limit.
const upload = multer({ storage: multer.memoryStorage() });

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

// GET /api/gallery  (public) all - years, each with their photos
galleryRouter.get("/", async (_req: Request, res: Response) => {
  const { data: years, error: yearsError } = await supabase
    .from("gallery_years")
    .select("*")
    .order("sort_order", { ascending: true });

  if (yearsError) {
    res.status(500).json({ message: "Failed to fetch gallery" });
    return;
  }

  const { data: photos, error: photosError } = await supabase
    .from("gallery_photos")
    .select("*")
    .order("sort_order", { ascending: true });

  if (photosError) {
    res.status(500).json({ message: "Failed to fetch gallery" });
    return;
  }

  const result: GalleryYearWithPhotos[] = (years as GalleryYear[]).map(
    (year) => ({
      ...year,
      photos: (photos as GalleryPhoto[]).filter((p) => p.year_id === year.id),
    }),
  );

  res.json(result);
});

// POST /api/gallery/years  (admin)
galleryRouter.post(
  "/years",
  authenticateAdmin,
  async (
    req: Request<{}, {}, { year: string; sort_order?: number }>,
    res: Response,
  ) => {
    const { year } = req.body;
    if (!year) {
      res.status(422).json({ message: "Year is required" });
      return;
    }

    const { data, error } = await supabase
      .from("gallery_years")
      .insert({ year, sort_order: req.body.sort_order ?? 0 })
      .select()
      .single();

    if (error) {
      // 23505 = unique_violation (duplicate year)
      if (error.code === "23505") {
        res.status(409).json({ message: "Year already exists" });
        return;
      }
      res.status(500).json({ message: "Server error" });
      return;
    }
    res.status(201).json(data);
  },
);

// DELETE /api/gallery/years/:id  (admin) - removes year, its DB photos, and storage objects
galleryRouter.delete(
  "/years/:id",
  authenticateAdmin,
  async (req: Request<{ id: string }>, res: Response) => {
    // Remove the underlying storage objects first.
    const { data: photos, error: fetchError } = await supabase
      .from("gallery_photos")
      .select("src")
      .eq("year_id", req.params.id);

    if (fetchError) {
      res.status(500).json({ message: "Server error" });
      return;
    }

    const paths = (photos as { src: string }[])
      .map((p) => storagePathFromPublicUrl(p.src))
      .filter((p): p is string => p !== null);

    if (paths.length > 0) {
      await supabase.storage.from(BUCKET).remove(paths);
    }

    // Photos rows cascade-delete via the year FK.
    const { error } = await supabase
      .from("gallery_years")
      .delete()
      .eq("id", req.params.id);

    if (error) {
      res.status(500).json({ message: "Server error" });
      return;
    }
    res.status(204).send();
  },
);

// POST /api/gallery/years/:yearId/photos  (admin) — upload one or more photos
galleryRouter.post(
  "/years/:yearId/photos",
  authenticateAdmin,
  upload.array("photos"),
  async (req: Request<{ yearId: string }>, res: Response) => {
    const files = req.files as Express.Multer.File[] | undefined;
    if (!files || files.length === 0) {
      res.status(422).json({ message: "No files uploaded" });
      return;
    }

    // Ensure the year exists before uploading.
    const { data: year, error: yearError } = await supabase
      .from("gallery_years")
      .select("id")
      .eq("id", req.params.yearId)
      .maybeSingle();

    if (yearError) {
      res.status(500).json({ message: "Server error" });
      return;
    }
    if (!year) {
      res.status(404).json({ message: "Year not found" });
      return;
    }

    // Append new photos after the year's current highest sort_order.
    const { data: maxRow } = await supabase
      .from("gallery_photos")
      .select("sort_order")
      .eq("year_id", req.params.yearId)
      .order("sort_order", { ascending: false })
      .limit(1)
      .maybeSingle();
    let nextOrder = ((maxRow as { sort_order: number } | null)?.sort_order ?? -1) + 1;

    const created: GalleryPhoto[] = [];

    for (const file of files) {
      const ext = file.originalname.split(".").pop() ?? "jpg";
      const path = `gallery/${req.params.yearId}/${randomUUID()}.${ext}`;

      const { error: uploadError } = await supabase.storage
        .from(BUCKET)
        .upload(path, file.buffer, {
          contentType: file.mimetype,
          upsert: false,
        });

      if (uploadError) {
        res.status(500).json({ message: "Upload failed" });
        return;
      }

      const {
        data: { publicUrl },
      } = supabase.storage.from(BUCKET).getPublicUrl(path);

      const { data: photo, error: insertError } = await supabase
        .from("gallery_photos")
        .insert({
          year_id: req.params.yearId,
          src: publicUrl,
          alt: file.originalname,
          sort_order: nextOrder++,
        })
        .select()
        .single();

      if (insertError) {
        // Roll back the orphaned storage object.
        await supabase.storage.from(BUCKET).remove([path]);
        res.status(500).json({ message: "Server error" });
        return;
      }
      created.push(photo as GalleryPhoto);
    }

    res.status(201).json(created);
  },
);

// PUT /api/gallery/photos/reorder  (admin) - batch-update sort orders after a drag.
// Registered before /photos/:id so Express doesn't treat "reorder" as a photo id.
galleryRouter.put(
  "/photos/reorder",
  authenticateAdmin,
  async (req: Request<{}, {}, ReorderBody>, res: Response) => {
    const { order } = req.body;
    if (!Array.isArray(order) || order.length === 0) {
      res.status(422).json({ message: "Order is required" });
      return;
    }

    const results = await Promise.all(
      order.map((o) =>
        supabase
          .from("gallery_photos")
          .update({ sort_order: o.sort_order })
          .eq("id", o.id),
      ),
    );

    if (results.some((r) => r.error)) {
      res.status(500).json({ message: "Server error" });
      return;
    }
    res.status(204).send();
  },
);

// PUT /api/gallery/photos/:id/replace  (admin) - swap the underlying image,
// keeping the photo row (and its position) intact.
galleryRouter.put(
  "/photos/:id/replace",
  authenticateAdmin,
  upload.single("photo"),
  async (req: Request<{ id: string }>, res: Response) => {
    if (!req.file) {
      res.status(422).json({ message: "Photo file is required" });
      return;
    }

    const { data: existing, error: fetchError } = await supabase
      .from("gallery_photos")
      .select("*")
      .eq("id", req.params.id)
      .maybeSingle();

    if (fetchError) {
      res.status(500).json({ message: "Server error" });
      return;
    }
    if (!existing) {
      res.status(404).json({ message: "Photo not found" });
      return;
    }
    const photo = existing as GalleryPhoto;

    const ext = req.file.originalname.split(".").pop() ?? "jpg";
    const path = `gallery/${photo.year_id}/${randomUUID()}.${ext}`;

    const { error: uploadError } = await supabase.storage
      .from(BUCKET)
      .upload(path, req.file.buffer, {
        contentType: req.file.mimetype,
        upsert: false,
      });

    if (uploadError) {
      res.status(500).json({ message: "Upload failed" });
      return;
    }

    const {
      data: { publicUrl },
    } = supabase.storage.from(BUCKET).getPublicUrl(path);

    const { data, error } = await supabase
      .from("gallery_photos")
      .update({ src: publicUrl, alt: req.file.originalname })
      .eq("id", req.params.id)
      .select()
      .single();

    if (error) {
      // Roll back the orphaned storage object.
      await supabase.storage.from(BUCKET).remove([path]);
      res.status(500).json({ message: "Server error" });
      return;
    }

    // Clean up the replaced storage object.
    const oldPath = storagePathFromPublicUrl(photo.src);
    if (oldPath) {
      await supabase.storage.from(BUCKET).remove([oldPath]);
    }

    res.json(data);
  },
);

// PUT /api/gallery/photos/:id  (admin) - update alt text / sort order
galleryRouter.put(
  "/photos/:id",
  authenticateAdmin,
  async (
    req: Request<{ id: string }, {}, { alt?: string; sort_order?: number }>,
    res: Response,
  ) => {
    const updates: { alt?: string; sort_order?: number } = {};
    if (req.body.alt !== undefined) updates.alt = req.body.alt;
    if (req.body.sort_order !== undefined)
      updates.sort_order = req.body.sort_order;

    if (Object.keys(updates).length === 0) {
      res.status(422).json({ message: "No fields to update" });
      return;
    }

    const { data, error } = await supabase
      .from("gallery_photos")
      .update(updates)
      .eq("id", req.params.id)
      .select()
      .maybeSingle();

    if (error) {
      res.status(500).json({ message: "Server error" });
      return;
    }
    if (!data) {
      res.status(404).json({ message: "Photo not found" });
      return;
    }
    res.json(data);
  },
);

// DELETE /api/gallery/photos/:id  (admin) - remove from Storage + DB
galleryRouter.delete(
  "/photos/:id",
  authenticateAdmin,
  async (req: Request<{ id: string }>, res: Response) => {
    const { data: photo, error: fetchError } = await supabase
      .from("gallery_photos")
      .select("src")
      .eq("id", req.params.id)
      .maybeSingle();

    if (fetchError) {
      res.status(500).json({ message: "Server error" });
      return;
    }
    if (!photo) {
      res.status(404).json({ message: "Photo not found" });
      return;
    }

    const path = storagePathFromPublicUrl((photo as { src: string }).src);
    if (path) {
      await supabase.storage.from(BUCKET).remove([path]);
    }

    const { error } = await supabase
      .from("gallery_photos")
      .delete()
      .eq("id", req.params.id);

    if (error) {
      res.status(500).json({ message: "Server error" });
      return;
    }
    res.status(204).send();
  },
);

export default galleryRouter;
