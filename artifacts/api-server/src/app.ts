import express, { type Express } from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import router from "./routes/index.js";
import liveRouter from "./routes/live.js";
import { env } from "./env.js";
import { createRateLimiter } from "./middlewares/rate-limit.js";

const app: Express = express();

/* trust Render proxy so secure cookies + IP detection work */
app.set("trust proxy", 1);

const allowedOrigins = [
  "http://localhost:3002",
  "http://localhost:3004",
  "https://denarixx-oneearth-web.onrender.com",
];

app.use(cors({
  origin(origin, callback) {
    if (!origin || allowedOrigins.includes(origin)) {
      return callback(null, true);
    }
    return callback(new Error(`CORS blocked for origin: ${origin}`));
  },
  credentials: true,
}));

const apiLimiter = createRateLimiter({
  windowMs: 15 * 60 * 1000,
  max: 1000,
  message: "Too many API requests. Please try again later.",
});

const authLimiter = createRateLimiter({
  windowMs: 15 * 60 * 1000,
  max: 20,
  message: "Too many login attempts. Please wait and try again.",
});

app.use("/api", apiLimiter);

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

app.use("/api/auth/login", authLimiter);

app.get("/api/__runtime", (_req, res) => {
  res.json({
    ok: true,
    env: env.NODE_ENV,
    allowedOrigins,
  });
});

/* mount live stream explicitly before the main authenticated api router */
app.use("/api", liveRouter);

app.use("/api", router);

export default app;
