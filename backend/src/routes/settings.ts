import { Router, Request, Response } from "express";
import { supabase } from "../db/supabase.js";
import { authenticateAdmin } from "../middleware/auth.js";
import { SiteSetting, UpdateSiteSettingBody } from "../types.js";

const settingsRouter = Router();

// GET /api/settings  (public) — flattened { key: value } map
settingsRouter.get("/", async (_req: Request, res: Response) => {
  const { data, error } = await supabase.from("site_settings").select("*");

  if (error) {
    res.status(500).json({ message: "Failed to fetch settings" });
    return;
  }

  const map = Object.fromEntries(
    (data as SiteSetting[]).map((s) => [s.key, s.value]),
  );
  res.json(map);
});

// PUT /api/settings/:key  (admin) — update an existing setting's value
settingsRouter.put(
  "/:key",
  authenticateAdmin,
  async (
    req: Request<{ key: string }, {}, UpdateSiteSettingBody>,
    res: Response,
  ) => {
    if (!req.body.value) {
      res.status(422).json({ message: "Value is required" });
      return;
    }

    const { data, error } = await supabase
      .from("site_settings")
      .update({ value: req.body.value, updated_at: new Date().toISOString() })
      .eq("key", req.params.key)
      .select()
      .maybeSingle();

    if (error) {
      res.status(500).json({ message: "Server error" });
      return;
    }
    if (!data) {
      res.status(404).json({ message: "Setting not found" });
      return;
    }
    res.json(data);
  },
);

export default settingsRouter;
