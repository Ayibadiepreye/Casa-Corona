
import multer from "multer";

const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB

// Magic number signatures for common image formats
const IMAGE_SIGNATURES = {
  jpeg: [0xff, 0xd8, 0xff],
  png: [0x89, 0x50, 0x4e, 0x47],
  gif: [0x47, 0x49, 0x46],
  webp: [0x52, 0x49, 0x46, 0x46], // First 4 bytes, followed by WEBP at offset 8
} as const;

/**
 * Validates file type by checking magic numbers (file signature)
 * This prevents attackers from uploading malicious files with fake extensions
 */
function validateFileSignature(buffer: Buffer): boolean {
  // Check JPEG
  if (buffer[0] === 0xff && buffer[1] === 0xd8 && buffer[2] === 0xff) {
    return true;
  }
  
  // Check PNG
  if (buffer[0] === 0x89 && buffer[1] === 0x50 && buffer[2] === 0x4e && buffer[3] === 0x47) {
    return true;
  }
  
  // Check GIF
  if (buffer[0] === 0x47 && buffer[1] === 0x49 && buffer[2] === 0x46) {
    return true;
  }
  
  // Check WebP (RIFF header + WEBP at offset 8)
  if (buffer[0] === 0x52 && buffer[1] === 0x49 && buffer[2] === 0x46 && buffer[3] === 0x46) {
    if (buffer.length >= 12 && 
        buffer[8] === 0x57 && buffer[9] === 0x45 && 
        buffer[10] === 0x42 && buffer[11] === 0x50) {
      return true;
    }
  }
  
  return false;
}

const storage = multer.memoryStorage();

const fileFilter = (
  _req: Express.Request,
  file: Express.Multer.File,
  cb: multer.FileFilterCallback,
) => {
  // Check MIME type first (quick validation)
  if (!file.mimetype.startsWith("image/")) {
    return cb(new Error("Only image files are allowed"));
  }
  cb(null, true);
};

export const upload = multer({
  storage,
  limits: { fileSize: MAX_FILE_SIZE },
  fileFilter,
});

/**
 * Additional security validation after upload
 * Call this in your controllers before processing the file
 */
export function validateUploadedImage(file: Express.Multer.File): void {
  if (!file || !file.buffer) {
    throw new Error("No file provided");
  }
  
  // Validate file signature (magic numbers)
  if (!validateFileSignature(file.buffer)) {
    throw new Error("Invalid file type. File signature does not match allowed image formats.");
  }
  
  // Validate file size
  if (file.size > MAX_FILE_SIZE) {
    throw new Error(`File size must be less than ${MAX_FILE_SIZE / (1024 * 1024)}MB`);
  }
  
  // Additional security: Check for suspicious file names
  const suspiciousPatterns = [/\.php$/i, /\.exe$/i, /\.sh$/i, /\.bat$/i, /\.cmd$/i];
  if (suspiciousPatterns.some(pattern => pattern.test(file.originalname))) {
    throw new Error("Suspicious file name detected");
  }
}
