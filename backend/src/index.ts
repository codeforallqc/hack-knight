import "dotenv/config";
import express from "express";
import morgan from "morgan";
import authRouter from "./routes/auth.js";
import scheduleRouter from "./routes/schedule.js";
import galleryRouter from "./routes/gallery.js";
import teamRouter from "./routes/team.js";
import companiesRouter from "./routes/companies.js";
import cors from "cors";

const app = express();
const PORT = process.env.PORT || 3000;
const requiredEnvVars = [
  "JWT_SECRET",
  "ADMIN_PASSWORD_HASH",
  "FRONTEND_URL",
  "SUPABASE_URL",
  "SUPABASE_SECRET_KEY",
];
for (const envVar of requiredEnvVars) {
  if (!process.env[envVar]) {
    console.error(`Missing required environment variable: ${envVar}`);
    process.exit(1);
  }
}

// Middleware
app.use(morgan("dev"));
app.use(
  cors({
    origin: process.env.FRONTEND_URL,
    methods: ["GET", "POST", "PUT", "DELETE"],
    allowedHeaders: ["Content-Type", "Authorization"],
  }),
);
app.use(express.json());

// Health check
app.get("/api/health", (req, res) => {
  res.json({ status: "ok" });
});

// Routes
app.use("/api/auth", authRouter);
app.use("/api/schedule", scheduleRouter);
app.use("/api/gallery", galleryRouter);
app.use("/api/team", teamRouter);
app.use("/api/companies", companiesRouter);

// Start server
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

// Exported for Vercel Fluid Compute to wrap as a serverless function.
export default app;
