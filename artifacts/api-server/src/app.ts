import express, { type Express } from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import router from "./routes/index.js";
import { env } from "./env.js";

const app: Express = express();

const allowedOrigins = [
  "http://localhost:3002",
  "http://localhost:3004",
  "https://denarixx-oneearth-web.onrender.com",
];

app.set("trust proxy", 1);

app.use(cors({
  origin(origin, callback) {
    if (!origin || allowedOrigins.includes(origin)) {
      return callback(null, true);
    }
    return callback(new Error(`CORS blocked for origin: ${origin}`));
  },
  credentials: true,
}));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

app.get("/api/health/cors", (_req, res) => {
  res.json({
    ok: true,
    env: env.NODE_ENV,
    allowedOrigins,
  });
});

app.use("/api", router);

export default app;
