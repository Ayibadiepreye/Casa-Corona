
import { v2 as cloudinary } from "cloudinary";
import { env } from "./env";

const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB

function validateFile(file: Express.Multer.File) {
  if (!file.mimetype.startsWith("image/")) {
    throw new Error("Only image files are allowed");
  }
  if (file.size > MAX_FILE_SIZE) {
    throw new Error("File size must be less than 5MB");
  }
}

// Stub implementation (dev mode without Cloudinary creds)
const stubUploadImage = async (file: Express.Multer.File, folder: string) => {
  validateFile(file);
  const fileName = `${Date.now()}-${file.originalname.replace(/\s+/g, "-")}`;
  // In dev, return a placeholder image URL so the frontend doesn't try to
  // load a local path that 404s. In prod with real Cloudinary, the upload
  // function below returns the real Cloudinary URL instead.
  return {
    url: `https://placehold.co/600x400/EEE/333?text=${encodeURIComponent(file.originalname)}`,
    publicId: `local_${Date.now()}`,
  };
};

const stubUploadMultipleImages = async (files: Express.Multer.File[], folder: string) => {
  const results = [];
  for (const file of files) {
    results.push(await stubUploadImage(file, folder));
  }
  return results;
};

const stubDeleteImage = async (_publicId: string) => {
  return true;
};

const stubGetOptimizedUrl = (publicId: string, width: number, format = "webp") => {
  return `/optimized/${publicId}?w=${width}&f=${format}`;
};

// Real Cloudinary implementation
if (env.CLOUDINARY_CLOUD_NAME) {
  cloudinary.config({
    cloud_name: env.CLOUDINARY_CLOUD_NAME,
    api_key: env.CLOUDINARY_API_KEY,
    api_secret: env.CLOUDINARY_API_SECRET,
  });
}

export async function uploadImage(file: Express.Multer.File, folder: string) {
  validateFile(file);
  if (!env.CLOUDINARY_CLOUD_NAME) {
    return stubUploadImage(file, folder);
  }

  return new Promise((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(
      { folder, resource_type: "image" },
      (error, result) => {
        if (error) return reject(error);
        if (!result) return reject(new Error("No result from cloudinary"));
        resolve({ url: result.secure_url, publicId: result.public_id });
      },
    );
    if (file.buffer) {
      stream.end(file.buffer);
    } else {
      reject(new Error("No file buffer"));
    }
  });
}

export async function uploadMultipleImages(files: Express.Multer.File[], folder: string) {
  if (!env.CLOUDINARY_CLOUD_NAME) {
    return stubUploadMultipleImages(files, folder);
  }
  const results = [];
  for (const file of files) {
    results.push(await uploadImage(file, folder));
  }
  return results;
}

export async function deleteImage(publicId: string) {
  if (!env.CLOUDINARY_CLOUD_NAME) {
    return stubDeleteImage(publicId);
  }
  await cloudinary.uploader.destroy(publicId);
  return true;
}

export function getOptimizedUrl(publicId: string, width: number, format = "webp") {
  if (!env.CLOUDINARY_CLOUD_NAME) {
    return stubGetOptimizedUrl(publicId, width, format);
  }
  return cloudinary.url(publicId, {
    width,
    format,
    quality: "auto",
    fetch_format: "auto",
  });
}
