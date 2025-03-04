const express = require('express');
const multer = require('multer');
const imageController = require('../controllers/imageController');

const router = express.Router();

// Configure multer for file uploads
const upload = multer({ storage: multer.memoryStorage() });

// POST route for uploading CSV and processing images
router.post('/upload', upload.single('file'), imageController.uploadFile);

// GET route for checking the status of image processing
router.get('/status/:requestId', imageController.checkStatus);

// GET route for downloading the processed CSV file
router.get('/download/:requestId', imageController.downloadCSV);

module.exports = router;
