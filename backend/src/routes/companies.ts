import { Router, Request, Response } from "express";
import multer from "multer";
import { randomUUID } from "node:crypto";
import { supabase } from "../db/supabase.js";
import { authenticateAdmin } from "../middleware/auth.js";
import { Company } from "../types.js";

const companiesRouter = Router();

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

async function uploadToStorage(
  file: Express.Multer.File,
): Promise<string | null> {
  const ext = file.originalname.split(".").pop() ?? "png";
  const path = `companies/${randomUUID()}.${ext}`;

  const { error } = await supabase.storage
    .from(BUCKET)
    .upload(path, file.buffer, { contentType: file.mimetype, upsert: false });

  if (error) return null;

  const {
    data: { publicUrl },
  } = supabase.storage.from(BUCKET).getPublicUrl(path);
  return publicUrl;
}

// GET /api/companies  (public) — logos are rendered on the team section
companiesRouter.get("/", async (_req: Request, res: Response) => {
  const { data, error } = await supabase
    .from("companies")
    .select("*")
    .order("sort_order", { ascending: true })
    .order("name", { ascending: true });

  if (error) {
    res.status(500).json({ message: "Failed to fetch companies" });
    return;
  }
  res.json(data);
});

// POST /api/companies  (admin) — create a company with its logo
companiesRouter.post(
  "/",
  authenticateAdmin,
  upload.single("logo"),
  async (req: Request<{}, {}, { name: string }>, res: Response) => {
    const { name } = req.body;
    if (!name) {
      res.status(422).json({ message: "Name is required" });
      return;
    }
    if (!req.file) {
      res.status(422).json({ message: "Logo is required" });
      return;
    }

    const logoUrl = await uploadToStorage(req.file);
    if (!logoUrl) {
      res.status(500).json({ message: "Logo upload failed" });
      return;
    }

    const { data, error } = await supabase
      .from("companies")
      .insert({ name, logo_url: logoUrl })
      .select()
      .single();

    if (error) {
      // Roll back the orphaned logo.
      const path = storagePathFromPublicUrl(logoUrl);
      if (path) await supabase.storage.from(BUCKET).remove([path]);
      if (error.code === "23505") {
        res.status(409).json({ message: "Company already exists" });
        return;
      }
      res.status(500).json({ message: "Server error" });
      return;
    }
    res.status(201).json(data);
  },
);

// PUT /api/companies/:id  (admin) — rename and/or replace the logo
companiesRouter.put(
  "/:id",
  authenticateAdmin,
  upload.single("logo"),
  async (req: Request<{ id: string }, {}, { name?: string }>, res: Response) => {
    const { data: existing, error: fetchError } = await supabase
      .from("companies")
      .select("*")
      .eq("id", req.params.id)
      .maybeSingle();

    if (fetchError) {
      res.status(500).json({ message: "Server error" });
      return;
    }
    if (!existing) {
      res.status(404).json({ message: "Company not found" });
      return;
    }
    const company = existing as Company;

    const updates: Partial<Company> = {};
    if (req.body.name !== undefined) updates.name = req.body.name;

    let oldPath: string | null = null;
    if (req.file) {
      const url = await uploadToStorage(req.file);
      if (!url) {
        res.status(500).json({ message: "Logo upload failed" });
        return;
      }
      updates.logo_url = url;
      oldPath = storagePathFromPublicUrl(company.logo_url);
    }

    if (Object.keys(updates).length === 0) {
      res.status(422).json({ message: "No fields to update" });
      return;
    }

    const { data, error } = await supabase
      .from("companies")
      .update(updates)
      .eq("id", req.params.id)
      .select()
      .single();

    if (error) {
      if (error.code === "23505") {
        res.status(409).json({ message: "Company already exists" });
        return;
      }
      res.status(500).json({ message: "Server error" });
      return;
    }

    if (oldPath) {
      await supabase.storage.from(BUCKET).remove([oldPath]);
    }
    res.json(data);
  },
);

// DELETE /api/companies/:id  (admin) — members' badges detach via ON DELETE SET NULL
companiesRouter.delete(
  "/:id",
  authenticateAdmin,
  async (req: Request<{ id: string }>, res: Response) => {
    const { data: company, error: fetchError } = await supabase
      .from("companies")
      .select("logo_url")
      .eq("id", req.params.id)
      .maybeSingle();

    if (fetchError) {
      res.status(500).json({ message: "Server error" });
      return;
    }
    if (!company) {
      res.status(404).json({ message: "Company not found" });
      return;
    }

    const path = storagePathFromPublicUrl(
      (company as Pick<Company, "logo_url">).logo_url,
    );
    if (path) {
      await supabase.storage.from(BUCKET).remove([path]);
    }

    const { error } = await supabase
      .from("companies")
      .delete()
      .eq("id", req.params.id);

    if (error) {
      res.status(500).json({ message: "Server error" });
      return;
    }
    res.status(204).send();
  },
);

export default companiesRouter;
