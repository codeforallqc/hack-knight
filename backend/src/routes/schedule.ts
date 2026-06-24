import { Router, Request, Response } from "express";
import { supabase } from "../db/supabase.js";
import {
  CreateScheduleEventBody,
  UpdateScheduleEventBody,
} from "../types.js";
import { authenticateAdmin } from "../middleware/auth.js";

const scheduleRouter = Router();

// GET /api/schedule  (public)
scheduleRouter.get("/", async (_req: Request, res: Response) => {
  const { data, error } = await supabase
    .from("schedule_events")
    .select("*")
    .order("start_hour", { ascending: true });

  if (error) {
    res.status(500).json({ message: "Failed to fetch schedule" });
    return;
  }
  res.json(data);
});

// GET /api/schedule/days  (public)
scheduleRouter.get("/days", async (_req: Request, res: Response) => {
  const { data, error } = await supabase
    .from("schedule_days")
    .select("*")
    .order("sort_order", { ascending: true });

  if (error) {
    res.status(500).json({ message: "Failed to fetch days" });
    return;
  }
  res.json(data);
});

// POST /api/schedule  (admin)
scheduleRouter.post(
  "/",
  authenticateAdmin,
  async (req: Request<{}, {}, CreateScheduleEventBody>, res: Response) => {
    const { day, start_hour, end_hour, label } = req.body;
    if (!day || start_hour == null || end_hour == null || !label) {
      res.status(422).json({ message: "Missing required field" });
      return;
    }

    const { data, error } = await supabase
      .from("schedule_events")
      .insert({
        day,
        start_hour,
        end_hour,
        label,
        color: req.body.color ?? "violet",
        sort_order: req.body.sort_order ?? 0,
      })
      .select()
      .single();

    if (error) {
      res.status(500).json({ message: "Server error" });
      return;
    }
    res.status(201).json(data);
  },
);

// PUT /api/schedule/:id  (admin)
scheduleRouter.put(
  "/:id",
  authenticateAdmin,
  async (
    req: Request<{ id: string }, {}, UpdateScheduleEventBody>,
    res: Response,
  ) => {
    const { data, error } = await supabase
      .from("schedule_events")
      .update(req.body)
      .eq("id", req.params.id)
      .select()
      .maybeSingle();

    if (error) {
      res.status(500).json({ message: "Server error" });
      return;
    }
    if (!data) {
      res.status(404).json({ message: "Event not found" });
      return;
    }
    res.json(data);
  },
);

// PUT /api/schedule/days/:key  (admin)
scheduleRouter.put(
  "/days/:key",
  authenticateAdmin,
  async (
    req: Request<{ key: string }, {}, { label: string }>,
    res: Response,
  ) => {
    if (!req.body.label) {
      res.status(422).json({ message: "Label is required" });
      return;
    }
    const { data, error } = await supabase
      .from("schedule_days")
      .update({ label: req.body.label })
      .eq("key", req.params.key)
      .select()
      .maybeSingle();

    if (error) {
      res.status(500).json({ message: "Server error" });
      return;
    }
    if (!data) {
      res.status(404).json({ message: "Day not found" });
      return;
    }
    res.json(data);
  },
);

// DELETE /api/schedule/:id  (admin)
scheduleRouter.delete(
  "/:id",
  authenticateAdmin,
  async (req: Request<{ id: string }>, res: Response) => {
    const { error } = await supabase
      .from("schedule_events")
      .delete()
      .eq("id", req.params.id);

    if (error) {
      res.status(500).json({ message: "Server error" });
      return;
    }
    res.status(204).send();
  },
);

export default scheduleRouter;
