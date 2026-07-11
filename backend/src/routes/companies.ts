import { Router, Request, Response } from "express";
import multer from "multer";
import { randomUUID } from "node:crypto";
import { supabase } from "../db/supabase.js";
import { authenticateAdmin } from "../middleware/auth.js";
import { Company, ReorderBody, SponsorTier } from "../types.js";

const SPONSOR_TIERS: SponsorTier[] = ["platinum", "gold", "silver", "bronze"];

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

// PUT /api/companies/reorder  (admin) - batch-update sort orders after a
// drag. Registered before /:id so Express doesn't treat "reorder" as an id.
companiesRouter.put(
  "/reorder",
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
          .from("companies")
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

// POST /api/companies  (admin) — create a company with its logo, optionally
// as a sponsor (sponsor_tier + sponsor_url + sponsor_blurb)
companiesRouter.post(
  "/",
  authenticateAdmin,
  upload.single("logo"),
  async (
    req: Request<
      {},
      {},
      { name: string; sponsor_tier?: string; sponsor_url?: string; sponsor_blurb?: string }
    >,
    res: Response,
  ) => {
    const { name } = req.body;
    if (!name) {
      res.status(422).json({ message: "Name is required" });
      return;
    }
    if (!req.file) {
      res.status(422).json({ message: "Logo is required" });
      return;
    }
    const sponsorTier = req.body.sponsor_tier || "";
    if (sponsorTier && !SPONSOR_TIERS.includes(sponsorTier as SponsorTier)) {
      res.status(422).json({ message: "Invalid sponsor tier" });
      return;
    }

    const logoUrl = await uploadToStorage(req.file);
    if (!logoUrl) {
      res.status(500).json({ message: "Logo upload failed" });
      return;
    }

    const { data, error } = await supabase
      .from("companies")
      .insert({
        name,
        logo_url: logoUrl,
        sponsor_tier: sponsorTier || null,
        sponsor_url: req.body.sponsor_url || null,
        sponsor_blurb: req.body.sponsor_blurb || null,
      })
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

// PUT /api/companies/:id  (admin) — rename, replace the logo, and/or edit
// sponsor fields (tier/url/blurb). Pass sponsor_tier="" to un-sponsor.
companiesRouter.put(
  "/:id",
  authenticateAdmin,
  upload.single("logo"),
  async (
    req: Request<
      { id: string },
      {},
      { name?: string; sponsor_tier?: string; sponsor_url?: string; sponsor_blurb?: string }
    >,
    res: Response,
  ) => {
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

    if (
      req.body.sponsor_tier &&
      !SPONSOR_TIERS.includes(req.body.sponsor_tier as SponsorTier)
    ) {
      res.status(422).json({ message: "Invalid sponsor tier" });
      return;
    }

    const updates: Partial<Company> = {};
    if (req.body.name !== undefined) updates.name = req.body.name;
    if (req.body.sponsor_tier !== undefined)
      updates.sponsor_tier = (req.body.sponsor_tier || null) as SponsorTier | null;
    if (req.body.sponsor_url !== undefined)
      updates.sponsor_url = req.body.sponsor_url || null;
    if (req.body.sponsor_blurb !== undefined)
      updates.sponsor_blurb = req.body.sponsor_blurb || null;

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
