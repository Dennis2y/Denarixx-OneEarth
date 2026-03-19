import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import router from "./routes/index.js";
import liveRouter from "./routes/live.js";
import { env } from "./env.js";

const app = express();

const allowedOrigins = [
  "http://localhost:3002",
  "http://localhost:3004",
  "https://denarixx-oneearth-web.onrender.com",
  "https://www.denarixxoneearth.com",
  "https://denarixxoneearth.com",
];

app.use(
  cors({
    origin(origin, callback) {
      if (!origin || allowedOrigins.includes(origin)) {
        return callback(null, true);
      }
      return callback(new Error("Not allowed by CORS"));
    },
    credentials: true,
  }),
);

app.use(express.json());
app.use(cookieParser());

app.get("/api/__runtime", (_req, res) => {
  res.json({
    ok: true,
    env: env.NODE_ENV,
    allowedOrigins,
  });
});

app.use("/api", liveRouter);
app.use("/api", router);

export default app;
