import cloudinary from '../config/cloudinary.js';
import fs from 'fs';
import path from 'path';

const IMAGE_EXTS = new Set(['.jpg', '.jpeg', '.png', '.gif', '.webp', '.svg', '.bmp', '.tiff']);

export const uploadToCloudinary = async (filePath, folderPath) => {
  try {
    const ext = path.extname(filePath).toLowerCase();
    const isImage = IMAGE_EXTS.has(ext);

    const result = await cloudinary.uploader.upload(filePath, {
      folder: folderPath,
      resource_type: isImage ? 'image' : 'raw',
      access_mode: 'public',
      type: 'upload',
    });

    return result.secure_url;
  } finally {
    try {
      if (filePath && fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
      }
    } catch (cleanupErr) {
      console.warn('Temp file cleanup failed:', cleanupErr.message);
    }
  }
};

export const deleteFromCloudinary = async (fileUrl) => {
  if (!fileUrl) return;

  try {
    const urlParts = fileUrl.split('/');
    const uploadIndex = urlParts.indexOf('upload');
    if (uploadIndex === -1) return;

    // Detect resource type from URL path
    // e.g. .../raw/upload/... or .../image/upload/...
    const resourceType =
      urlParts[uploadIndex - 1] === 'raw'
        ? 'raw'
        : urlParts[uploadIndex - 1] === 'video'
        ? 'video'
        : 'image';

    const pathParts = urlParts.slice(uploadIndex + 1);
    if (pathParts[0]?.startsWith('v') && /^v\d+$/.test(pathParts[0])) {
      pathParts.shift();
    }

    const publicIdWithExt = pathParts.join('/');
    const lastDot = publicIdWithExt.lastIndexOf('.');
    // For raw, Cloudinary public_id often includes the extension
    const publicId =
      resourceType === 'raw'
        ? publicIdWithExt
        : lastDot > -1
        ? publicIdWithExt.substring(0, lastDot)
        : publicIdWithExt;

    await cloudinary.uploader.destroy(publicId, { resource_type: resourceType });
  } catch (error) {
    console.warn('Cloudinary asset cleanup failed:', error.message);
  }
};