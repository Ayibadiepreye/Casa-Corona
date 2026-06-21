import express, { type Express, type Request, type Response, type NextFunction } from "express";
import cors from "cors";
import helmet from "helmet";
import cookieParser from "cookie-parser";
import pinoHttp from "pino-http";
import rateLimit from "express-rate-limit";
import path from "path";
import router from "./routes/index.js";
import { logger } from "./lib/logger.js";
import { env } from "./lib/env.js";
import { errorHandler } from "./middlewares/errorHandler.js";
import { notFound } from "./lib/response.js";
import { maintenanceGate } from "./middlewares/maintenance.js";

export function createApp(): Express {
  const app: Express = express();

  // Static serve uploaded files (avatars, chat images, portfolio).
  // The uploaded files live under UPLOAD_DIR (default ./uploads).
  app.use("/uploads", express.static(env.UPLOAD_DIR || path.join(process.cwd(), "uploads"), {
    maxAge: "30d",
    fallthrough: true,
  }));

  // Helmet for security — but disable crossOrigin headers so they don't
    // interfere with our explicit CORS handling below.
    app.use(
      helmet({
        crossOriginResourcePolicy: false,
        crossOriginOpenerPolicy: false,
        crossOriginEmbedderPolicy: false,
      })
    );

    // Disable x-powered-by header
    app.disable("x-powered-by");

    // CORS — accept comma-separated list of origins.
    // We handle preflight manually so Access-Control-Allow-Credentials is
    // always set when allowed, regardless of how the cors middleware handles
    // dynamic origin callbacks.
    const allowedOrigins = env.CORS_ORIGIN.split(",").map((o) => o.trim()).filter(Boolean);

    app.use((req, res, next) => {
      const origin = req.headers.origin;
      if (origin && (allowedOrigins.includes(origin) || allowedOrigins.includes("*"))) {
        res.setHeader("Access-Control-Allow-Origin", origin);
        res.setHeader("Access-Control-Allow-Credentials", "true");
        res.setHeader("Vary", "Origin");
        res.setHeader("Access-Control-Allow-Methods", "GET,HEAD,PUT,PATCH,POST,DELETE,OPTIONS");
        res.setHeader(
          "Access-Control-Allow-Headers",
          req.headers["access-control-request-headers"] ||
            "Origin, X-Requested-With, Content-Type, Accept, Authorization, x-cron-secret"
        );
        res.setHeader("Access-Control-Max-Age", "86400");
      }
      if (req.method === "OPTIONS") {
        return res.status(204).end();
      }
      return next();
    });

    // Also run the official cors middleware for non-OPTIONS requests so it's
    // a no-op for allowed origins and consistent with Express patterns.
    app.use(
      cors({
        origin: (origin, cb) => {
          if (!origin) return cb(null, true);
          if (allowedOrigins.includes(origin) || allowedOrigins.includes("*")) {
            return cb(null, true);
          }
          return cb(null, false);
        },
        credentials: env.CORS_CREDENTIALS,
      })
    );

  // Cookie parser
  app.use(cookieParser());

  // JSON parser with 10mb limit
  app.use(express.json({ limit: "10mb" }));

  // Pino logging
  app.use(
    pinoHttp({
      logger,
      serializers: {
        req(req) {
          return {
            id: req.id,
            method: req.method,
            url: req.url?.split("?")[0],
          };
        },
        res(res) {
          return {
            statusCode: res.statusCode,
          };
        },
      },
    }),
  );

  // Rate limiting (skip in test and development)
  if (env.NODE_ENV !== "test" && env.NODE_ENV !== "development") {
    const limiter = rateLimit({
      windowMs: env.RATE_LIMIT_WINDOW_MS,
      max: env.RATE_LIMIT_MAX_REQUESTS,
    });
    app.use(limiter);
  }

  // Maintenance mode — returns 503 for non-admins when MAINTENANCE_MODE=true
  app.use(maintenanceGate);

  // Routes
  app.use(router);

  // 404 handler
  app.use((req: Request, res: Response, next: NextFunction) => {
    return notFound(res, "Route not found");
  });

  // Error handler
  app.use(errorHandler);

  return app;
}

export default createApp();

