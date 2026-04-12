import cors from "cors";
import express from "express";
import { applicantRouter } from "./routes/applicantRoutes.js";
import { authRouter } from "./routes/authRoutes.js";
import { contentRouter } from "./routes/contentRoutes.js";
import { dashboardRouter } from "./routes/dashboardRoutes.js";
import { electionRouter } from "./routes/electionRoutes.js";
import { meetingRoomRouter } from "./routes/meetingRoomRoutes.js";
import { errorHandler } from "./middleware/errorHandler.js";

export function createApp() {
  const app = express();

  app.use(cors());
  app.use(express.json({ limit: "10mb" }));

  app.get("/api/health", (_req, res) => {
    res.json({ ok: true });
  });

  app.use("/api/auth", authRouter);
  app.use("/api/dashboard", dashboardRouter);
  app.use("/api/applicants", applicantRouter);
  app.use("/api", contentRouter);
  app.use("/api/election", electionRouter);
  app.use("/api/meeting-rooms", meetingRoomRouter);

  app.use(errorHandler);

  return app;
}
