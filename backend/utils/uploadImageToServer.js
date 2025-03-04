const cloudinary = require('../config/cloudinary');

/**
 * Upload image buffer to Cloudinary
 * @param {Buffer} imageBuffer - Processed image buffer
 * @param {string} filename - Filename for Cloudinary
 * @returns {Promise<string>} - URL of uploaded image
 */
const uploadImageToServer = async (imageBuffer, filename) => {
  try {
    console.log(`Uploading image: ${filename} to Cloudinary...`);

    // Convert buffer to base64 for Cloudinary upload
    const base64Image = `data:image/jpeg;base64,${imageBuffer.toString('base64')}`;

    const result = await cloudinary.uploader.upload(base64Image, {
      folder: 'processed_images', // Change to your Cloudinary folder
      public_id: filename.replace('.jpg', ''), // Remove extension for public ID
      overwrite: true, // Allow overwriting in Cloudinary
    });

    console.log(`Uploaded successfully: ${result.secure_url}`);
    return result.secure_url; // Return the Cloudinary URL
  } catch (error) {
    console.error('Cloudinary upload error:', error);
    throw new Error('Failed to upload image to Cloudinary');
  }
};

module.exports = uploadImageToServer;
