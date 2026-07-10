import express, { type Express } from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import helmet from "helmet";
import pinoHttp from "pino-http";
import router from "./routes";
import { logger } from "./lib/logger";

const app: Express = express();

// ── Security headers (Helmet) ──────────────────────────────────────────────
app.use(
  helmet({
    crossOriginResourcePolicy: { policy: "cross-origin" },
    contentSecurityPolicy: false, // frontend handled separately
  }),
);

// ── CORS ───────────────────────────────────────────────────────────────────
// Allow only same-origin requests (proxy handles routing). In the Replit
// environment, all traffic goes through the shared proxy on the same domain.
const ALLOWED_ORIGINS = new Set(
  (process.env.ALLOWED_ORIGINS ?? "")
    .split(",")
    .map((o) => o.trim())
    .filter(Boolean),
);

app.use(
  cors({
    origin: (origin, cb) => {
      // Same-origin (no Origin header) and explicitly allowed origins are OK.
      // In development we also allow all, since the shared Replit proxy merges origins.
      if (!origin || ALLOWED_ORIGINS.has(origin) || process.env.NODE_ENV !== "production") {
        cb(null, true);
      } else {
        cb(new Error("Not allowed by CORS"));
      }
    },
    credentials: true,
  }),
);

// ── Request limits ─────────────────────────────────────────────────────────
app.use(express.json({ limit: "64kb" }));
app.use(express.urlencoded({ extended: true, limit: "64kb" }));

// ── Logging ────────────────────────────────────────────────────────────────
app.use(
  pinoHttp({
    logger,
    serializers: {
      req(req) {
        return { id: req.id, method: req.method, url: req.url?.split("?")[0] };
      },
      res(res) {
        return { statusCode: res.statusCode };
      },
    },
  }),
);

app.use(cookieParser());

app.use("/api", router);

export default app;
