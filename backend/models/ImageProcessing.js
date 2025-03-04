// backend/models/ImageProcessing.js
const mongoose = require('mongoose');

// Schema for Image Processing request and its status
const imageProcessingSchema = new mongoose.Schema({
  requestId: { type: String, required: true, unique: true }, // Unique request identifier
  status: { type: String, default: 'Pending' }, // Status of the image processing (Pending, Processing, Completed)
  products: [
    {
      productName: String, // Product name
      inputImages: [String], // Array of input image URLs
      outputImages: [String], // Array of output image URLs (processed)
    }
  ],
});

const ImageProcessing = mongoose.model('ImageProcessing', imageProcessingSchema);

module.exports = ImageProcessing;
