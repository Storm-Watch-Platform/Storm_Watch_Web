// Cloudinary Upload Service
// Upload images to Cloudinary and get public URLs

// Environment variables (thêm vào file .env)
// VITE_CLOUDINARY_CLOUD_NAME=ds6hhxliv
// VITE_CLOUDINARY_UPLOAD_PRESET=stormwatch

const CLOUDINARY_CLOUD_NAME = import.meta.env.VITE_CLOUDINARY_CLOUD_NAME || 'ds6hhxliv';
const CLOUDINARY_UPLOAD_PRESET = import.meta.env.VITE_CLOUDINARY_UPLOAD_PRESET || 'stormwatch';

// Cloudinary upload URL (sử dụng unsigned upload với preset)
// Không cần API secret vì dùng unsigned preset
const CLOUDINARY_UPLOAD_URL = `https://api.cloudinary.com/v1_1/${CLOUDINARY_CLOUD_NAME}/image/upload`;

/**
 * Upload single image to Cloudinary
 * @param {File} file - Image file to upload
 * @returns {Promise<string>} Public URL of uploaded image
 */
export async function uploadImageToCloudinary(file) {
  return new Promise((resolve, reject) => {
    if (!CLOUDINARY_CLOUD_NAME) {
      reject(new Error('Cloudinary cloud name chưa được cấu hình. Vui lòng thêm VITE_CLOUDINARY_CLOUD_NAME vào .env'));
      return;
    }

    // Create FormData
    const formData = new FormData();
    formData.append('file', file);
    formData.append('upload_preset', CLOUDINARY_UPLOAD_PRESET);
    // Optional: add folder for organization
    formData.append('folder', 'stormwatch/reports');
    // Optional: add timestamp for uniqueness
    formData.append('timestamp', Math.round(Date.now() / 1000));

    // For signed upload (if using API secret)
    // Note: In production, signed uploads should be done via backend for security
    // This is a simplified version using unsigned upload with preset
    
    fetch(CLOUDINARY_UPLOAD_URL, {
      method: 'POST',
      body: formData,
    })
      .then((response) => {
        if (!response.ok) {
          return response.json().then((err) => {
            throw new Error(err.error?.message || 'Upload failed');
          });
        }
        return response.json();
      })
      .then((data) => {
        // Return secure URL (HTTPS)
        const imageUrl = data.secure_url || data.url;
        if (!imageUrl) {
          reject(new Error('Không nhận được URL từ Cloudinary'));
          return;
        }
        console.log('[Cloudinary] ✅ Image uploaded successfully!');
        console.log('[Cloudinary] 📸 Image URL:', imageUrl);
        console.log('[Cloudinary] 📋 Full response:', data);
        resolve(imageUrl);
      })
      .catch((error) => {
        console.error('[Cloudinary] Upload error:', error);
        reject(error);
      });
  });
}

/**
 * Upload multiple images to Cloudinary
 * @param {File[]} files - Array of image files
 * @returns {Promise<string[]>} Array of public URLs
 */
export async function uploadMultipleImagesToCloudinary(files) {
  try {
    const uploadPromises = files.map((file) => uploadImageToCloudinary(file));
    const urls = await Promise.all(uploadPromises);
    return urls;
  } catch (error) {
    console.error('[Cloudinary] Error uploading multiple images:', error);
    throw error;
  }
}

/**
 * Delete image from Cloudinary (if needed in future)
 * Note: This requires backend implementation for security
 */
export async function deleteImageFromCloudinary(publicId) {
  // This should be done via backend to keep API secret secure
  console.warn('[Cloudinary] Delete should be done via backend');
  return Promise.reject(new Error('Delete should be done via backend'));
}

