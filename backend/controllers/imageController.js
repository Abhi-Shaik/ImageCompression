// backend/controllers/imageController.js
const axios = require('axios');
const { generateRequestId, processImages } = require('../utils/imageProcessing.js');
const ImageProcessing = require('../models/ImageProcessing');
const csvParser = require('csv-parser');
const { Parser } = require('json2csv');

// Upload CSV and process images
const uploadFile = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }

    const products = [];
    const fileBuffer = req.file.buffer;

    // Parse the CSV file buffer
    require('streamifier').createReadStream(fileBuffer)
      .pipe(csvParser())
      .on('data', (row) => {
        const { SerialNumber, ProductName, InputImageUrls } = row;

        if (!ProductName || !InputImageUrls) {
          return res.status(400).json({ error: 'Invalid CSV format' });
        }

        const inputImages = InputImageUrls.split(',').map(url => url.trim());
        products.push({ productName: ProductName, inputImages });
      })
      .on('end', async () => {
        const requestId = generateRequestId();

        // Save processing status in database
        await ImageProcessing.create({
          requestId,
          status: 'Processing',
          products,
        });
        res.status(200).json({ requestId });

        // Process images asynchronously
        await processImages(requestId, products);

      });
  } catch (error) {
    console.error('Error during file upload:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// Check status of image processing
const checkStatus = async (req, res) => {
  const { requestId } = req.params;

  try {
    const result = await ImageProcessing.findOne({ requestId });

    if (!result) {
      return res.status(404).json({ error: 'Request ID not found' });
    }

    if (result.status !== 'Completed') {
      return res.status(200).json({ message: 'Processing still in progress', status: result.status });
    }
    else{
      return res.status(200).json({ message: 'Completed', status: result.status });
    }
  } catch (error) {
    console.error('Error fetching status:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// const downloadCSV = async (req, res) => {
//   try {
//     const { requestId } = req.params;

//     // Fetch processed data from the database
//     const record = await ImageProcessing.findOne({ requestId });
//     if (!record) {
//       return res.status(404).json({ error: 'Request ID not found' });
//     }

//     // Prepare CSV data
//     const csvData = record.products.map((product, index) => ({
//       'S. No.': index + 1,
//       'Product Name': product.productName,
//       'Input Image URLs': product.inputImages.join(', '),
//       'Output Image URLs': product.outputImages.join(', '),
//     }));

//     // Convert data to CSV format
//     const parser = new Parser();
//     const csv = parser.parse(csvData);

//     // Send CSV as a response
//     res.setHeader('Content-Disposition', `attachment; filename=output_${requestId}.csv`);
//     res.setHeader('Content-Type', 'text/csv');
//     res.status(200).send(csv);
//   } catch (error) {
//     console.error('Error generating CSV:', error);
//     res.status(500).json({ error: 'Failed to generate CSV' });
//   }
// };

const downloadCSV = async (req, res) => {
  try {
    const { requestId } = req.params;

    // Fetch processed data from the database
    const record = await ImageProcessing.findOne({ requestId });
    if (!record) {
      return res.status(404).json({ error: 'Request ID not found' });
    }

    // Prepare CSV data
    const csvData = record.products.map((product, index) => ({
      'S. No.': index + 1,
      'Product Name': product.productName,
      'Input Image URLs': product.inputImages.join(', '),
      'Output Image URLs': product.outputImages.join(', '),
    }));

    // Convert data to CSV format
    const parser = new Parser();
    const csv = parser.parse(csvData);

    // Set response headers to force download
    res.setHeader('Content-Disposition', `attachment; filename="output_${requestId}.csv"`);
    res.setHeader('Content-Type', 'text/csv');

    // Send the CSV as a downloadable file
    res.status(200).send(csv);
  } catch (error) {
    console.error('Error generating CSV:', error);
    res.status(500).json({ error: 'Failed to generate CSV' });
  }
};

module.exports = {
  uploadFile,
  checkStatus,
  downloadCSV
};
