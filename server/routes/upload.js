const express = require('express');
const router = express.Router();
const multer = require('multer');
const cloudinary = require('cloudinary').v2;
const { CloudinaryStorage } = require('multer-storage-cloudinary');
require('dotenv').config();

// Configure Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME || 'dbmj7rhwt',
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET
});

// Configure Multer to use Cloudinary for storage
const storage = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: {
    folder: 'products',
    allowed_formats: ['jpg', 'jpeg', 'png', 'gif'],
    transformation: [{ width: 500, height: 500, crop: 'limit' }]
  }
});

const upload = multer({ storage: storage });

// Route to handle image uploads
router.post('/', upload.single('image'), async (req, res) => {
  try {
    // The file has been uploaded to Cloudinary via the storage engine
    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }

    // Return the Cloudinary URL and other details
    return res.status(200).json({
      url: req.file.path,
      public_id: req.file.filename,
      success: true
    });
  } catch (error) {
    console.error('Error uploading to Cloudinary:', error);
    return res.status(500).json({
      error: 'Failed to upload image',
      details: error.message
    });
  }
});

module.exports = router;
