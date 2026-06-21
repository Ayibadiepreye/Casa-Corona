import { Router, type IRouter, type Request, type Response, type NextFunction } from "express";
import { logger } from "../../lib/logger.js";
import multer from "multer";
import path from "path";
import fs from "fs/promises";
import crypto from "crypto";
import { requireAuth } from "../../middlewares/requireAuth.js";
import { ok, badRequest } from "../../lib/response.js";
import { v2 as cloudinary } from "cloudinary";

const UPLOAD_DIR = process.env.UPLOAD_DIR || path.join(process.cwd(), "uploads");
await fs.mkdir(UPLOAD_DIR, { recursive: true }).catch(() => {});

// Configure Cloudinary if env is present
const useCloudinary = !!(
  process.env.CLOUDINARY_CLOUD_NAME &&
  process.env.CLOUDINARY_API_KEY &&
  process.env.CLOUDINARY_API_SECRET
);
if (useCloudinary) {
  cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
    secure: true,
  });
  logger.info("[uploads] Cloudinary enabled");
} else {
  logger.info("[uploads] Cloudinary not configured — using local disk storage");
}

// ── Disk storage (fallback) ────────────────────────────────────────────────
const diskStorage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, UPLOAD_DIR),
  filename: (_req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase() || ".bin";
    const id = crypto.randomBytes(16).toString("hex");
    cb(null, `${Date.now()}-${id}${ext}`);
  },
});

// In-memory storage when using Cloudinary (we need the buffer to upload)
const memoryStorage = multer.memoryStorage();

const ALLOWED = new Set([
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/gif",
  "image/avif",
  "image/svg+xml",
]);

const upload = multer({
  storage: useCloudinary ? memoryStorage : diskStorage,
  limits: { fileSize: 5 * 1024 * 1024, files: 6 },
  fileFilter: (_req, file, cb) => {
    if (ALLOWED.has(file.mimetype)) cb(null, true);
    else cb(new Error(`Unsupported file type: ${file.mimetype}`));
  },
});

const router: IRouter = Router();

async function uploadToCloudinary(file: Express.Multer.File): Promise<string> {
  return new Promise((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(
      { folder: "casa-corona", resource_type: "image" },
      (err, result) => {
        if (err) return reject(err);
        resolve(result?.secure_url || "");
      }
    );
    stream.end(file.buffer);
  });
}

router.post("/images", requireAuth, (req: Request, res: Response, next: NextFunction) => {
  upload.array("files", 6)(req, res, async (err) => {
    if (err) return badRequest(res, err.message ?? "Upload failed");
    const files = (req.files as Express.Multer.File[]) ?? [];
    try {
      const urls: string[] = [];
      if (useCloudinary) {
        for (const f of files) {
          const url = await uploadToCloudinary(f);
          urls.push(url);
        }
      } else {
        const baseUrl = process.env.PUBLIC_UPLOAD_URL || `${req.protocol}://${req.get("host")}`;
        urls.push(...files.map((f) => `${baseUrl}/uploads/${f.filename}`));
      }
      return ok(res, { urls, storage: useCloudinary ? "cloudinary" : "local" });
    } catch (e: any) {
      logger.error({ err: e?.message }, "[uploads] error");
      return badRequest(res, e?.message ?? "Upload failed");
    }
  });
});

export default router;