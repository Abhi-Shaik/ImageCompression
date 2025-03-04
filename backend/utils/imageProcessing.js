const axios = require('axios');
const sharp = require('sharp');
const fs = require('fs');
const { Parser } = require('json2csv');
const ImageProcessing = require('../models/ImageProcessing');
const uploadImageToServer = require('./uploadImageToServer');

// Generate a unique request ID
const generateRequestId = () => {
  return 'REQ-' + Math.random().toString(36).substr(2, 9);
};

// Process images: Compress and upload to Cloudinary
const processImages = async (requestId, products) => {
  for (let product of products) {
    const outputImages = [];

    for (let i = 0; i < product.inputImages.length; i++) {
      const url = product.inputImages[i];

      try {
        console.log(`Fetching image: ${url}`);

        // Fetch the image
        const response = await axios.get(url, { responseType: 'arraybuffer' });
        const inputImageBuffer = Buffer.from(response.data, 'binary');

        console.log(`Input Image Size: ${Buffer.byteLength(inputImageBuffer)} bytes`);

        // Compress image
        const outputImageBuffer = await sharp(inputImageBuffer)
          .resize({ width: 800 })  // Resize width to 800px
          .jpeg({ quality: 50 })   // Reduce quality to 50%
          .toBuffer();

        console.log(`Compressed Image Size: ${Buffer.byteLength(outputImageBuffer)} bytes`);

        // Upload the processed image to Cloudinary
        let randomNum = Math.random().toString(36).substr(2, 9);
        const filename = `compressed_${randomNum}_${i + 1}`;
        const outputUrl = await uploadImageToServer(outputImageBuffer, filename);

        outputImages.push(outputUrl);
      } catch (error) {
        console.error(`Error processing image ${url}:`, error);
      }
    }

    // Update database with Cloudinary URLs
    await ImageProcessing.updateOne(
      { requestId },
      { $set: { 'products.$[elem].outputImages': outputImages } },
      { arrayFilters: [{ 'elem.productName': product.productName }] }
    );
  }

  // Mark processing as completed
  await ImageProcessing.updateOne(
    { requestId },
    { $set: { status: 'Completed' } }
  );

};


module.exports = {
  generateRequestId,
  processImages
};
