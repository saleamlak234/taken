// const express = require('express');
// const { upload, uploadToCloudinary, deleteFromCloudinary, getOptimizedUrl, getThumbnailUrl } = require('../config/cloudinary');
// const authMiddleware = require('../middleware/auth');

// const router = express.Router();

// // Upload single file to Cloudinary
// router.post('/upload', authMiddleware, upload.single('file'), async (req, res) => {
//   try {
//     if (!req.file) {
//       return res.status(400).json({ message: 'No file uploaded' });
//     }

//     const result = {
//       public_id: req.file.public_id,
//       secure_url: req.file.secure_url,
//       original_filename: req.file.original_filename,
//       format: req.file.format,
//       resource_type: req.file.resource_type,
//       bytes: req.file.bytes,
//       width: req.file.width,
//       height: req.file.height,
//       created_at: req.file.created_at
//     };

//     res.json({
//       message: 'File uploaded successfully',
//       file: result,
//       thumbnailUrl: getThumbnailUrl(req.file.public_id),
//       optimizedUrl: getOptimizedUrl(req.file.public_id)
//     });
//   } catch (error) {
//     console.error('Cloudinary upload error:', error);
//     res.status(500).json({ message: 'Failed to upload file to Cloudinary' });
//   }
// });

// // Upload multiple files
// router.post('/upload-multiple', authMiddleware, upload.array('files', 5), async (req, res) => {
//   try {
//     if (!req.files || req.files.length === 0) {
//       return res.status(400).json({ message: 'No files uploaded' });
//     }

//     const results = req.files.map(file => ({
//       public_id: file.public_id,
//       secure_url: file.secure_url,
//       original_filename: file.original_filename,
//       format: file.format,
//       resource_type: file.resource_type,
//       bytes: file.bytes,
//       thumbnailUrl: getThumbnailUrl(file.public_id),
//       optimizedUrl: getOptimizedUrl(file.public_id)
//     }));

//     res.json({
//       message: 'Files uploaded successfully',
//       files: results
//     });
//   } catch (error) {
//     console.error('Cloudinary multiple upload error:', error);
//     res.status(500).json({ message: 'Failed to upload files to Cloudinary' });
//   }
// });

// // Delete file from Cloudinary
// router.delete('/delete/:publicId', authMiddleware, async (req, res) => {
//   try {
//     const { publicId } = req.params;
    
//     // Decode the public_id (it might be URL encoded)
//     const decodedPublicId = decodeURIComponent(publicId);
    
//     const result = await deleteFromCloudinary(decodedPublicId);
    
//     if (result.result === 'ok') {
//       res.json({ message: 'File deleted successfully' });
//     } else {
//       res.status(404).json({ message: 'File not found or already deleted' });
//     }
//   } catch (error) {
//     console.error('Cloudinary delete error:', error);
//     res.status(500).json({ message: 'Failed to delete file from Cloudinary' });
//   }
// });

// // Get optimized URL for existing file
// router.get('/optimize/:publicId', authMiddleware, (req, res) => {
//   try {
//     const { publicId } = req.params;
//     const { width, height, quality, format } = req.query;
    
//     const decodedPublicId = decodeURIComponent(publicId);
    
//     const options = {};
//     if (width) options.width = parseInt(width);
//     if (height) options.height = parseInt(height);
//     if (quality) options.quality = quality;
//     if (format) options.format = format;
    
//     const optimizedUrl = getOptimizedUrl(decodedPublicId, options);
//     const thumbnailUrl = getThumbnailUrl(decodedPublicId);
    
//     res.json({
//       optimizedUrl,
//       thumbnailUrl,
//       public_id: decodedPublicId
//     });
//   } catch (error) {
//     console.error('Cloudinary optimize error:', error);
//     res.status(500).json({ message: 'Failed to generate optimized URL' });
//   }
// });

// // Get file information
// router.get('/info/:publicId', authMiddleware, async (req, res) => {
//   try {
//     const { publicId } = req.params;
//     const decodedPublicId = decodeURIComponent(publicId);
    
//     // Get resource details from Cloudinary
//     const result = await cloudinary.api.resource(decodedPublicId);
    
//     res.json({
//       public_id: result.public_id,
//       format: result.format,
//       resource_type: result.resource_type,
//       bytes: result.bytes,
//       width: result.width,
//       height: result.height,
//       created_at: result.created_at,
//       secure_url: result.secure_url,
//       optimizedUrl: getOptimizedUrl(result.public_id),
//       thumbnailUrl: getThumbnailUrl(result.public_id)
//     });
//   } catch (error) {
//     console.error('Cloudinary info error:', error);
//     res.status(404).json({ message: 'File not found' });
//   }
// });

// module.exports = router;
const express = require("express");
const {
  upload,
  uploadFileToCloudinary,
  deleteFromCloudinary,
  getOptimizedUrl,
  getThumbnailUrl,
  getFileInfo,
  cloudinary,
} = require("../config/cloudinary");
const authMiddleware = require("../middleware/auth");

const router = express.Router();

// Upload single file to Cloudinary
router.post(
  "/upload",
  authMiddleware,
  upload.single("file"),
  async (req, res) => {
    try {
      if (!req.file) {
        return res.status(400).json({ message: "No file uploaded" });
      }

      console.log(
        "Uploading file:",
        req.file.originalname,
        "Size:",
        req.file.size
      );

      const result = await uploadFileToCloudinary(req.file);

      console.log("Upload successful:", result.public_id);

      res.json({
        message: "File uploaded successfully",
        file: result,
        thumbnailUrl: getThumbnailUrl(result.public_id),
        optimizedUrl: getOptimizedUrl(result.public_id),
      });
    } catch (error) {
      console.error("Cloudinary upload error:", error);
      res.status(500).json({
        message: "Failed to upload file to Cloudinary",
        error: error.message,
      });
    }
  }
);

// Upload multiple files
router.post(
  "/upload-multiple",
  authMiddleware,
  upload.array("files", 5),
  async (req, res) => {
    try {
      if (!req.files || req.files.length === 0) {
        return res.status(400).json({ message: "No files uploaded" });
      }

      console.log("Uploading multiple files:", req.files.length);

      const uploadPromises = req.files.map((file) =>
        uploadFileToCloudinary(file)
      );
      const results = await Promise.all(uploadPromises);

      const formattedResults = results.map((result) => ({
        ...result,
        thumbnailUrl: getThumbnailUrl(result.public_id),
        optimizedUrl: getOptimizedUrl(result.public_id),
      }));

      res.json({
        message: "Files uploaded successfully",
        files: formattedResults,
      });
    } catch (error) {
      console.error("Cloudinary multiple upload error:", error);
      res.status(500).json({
        message: "Failed to upload files to Cloudinary",
        error: error.message,
      });
    }
  }
);

// Delete file from Cloudinary
router.delete("/delete/:publicId", authMiddleware, async (req, res) => {
  try {
    const { publicId } = req.params;

    // Decode the public_id (it might be URL encoded)
    const decodedPublicId = decodeURIComponent(publicId);

    console.log("Deleting file:", decodedPublicId);

    const result = await deleteFromCloudinary(decodedPublicId);

    if (result.result === "ok") {
      res.json({ message: "File deleted successfully" });
    } else {
      res.status(404).json({ message: "File not found or already deleted" });
    }
  } catch (error) {
    console.error("Cloudinary delete error:", error);
    res.status(500).json({
      message: "Failed to delete file from Cloudinary",
      error: error.message,
    });
  }
});

// Get optimized URL for existing file
router.get("/optimize/:publicId", authMiddleware, (req, res) => {
  try {
    const { publicId } = req.params;
    const { width, height, quality, format } = req.query;

    const decodedPublicId = decodeURIComponent(publicId);

    const options = {};
    if (width) options.width = parseInt(width);
    if (height) options.height = parseInt(height);
    if (quality) options.quality = quality;
    if (format) options.format = format;

    const optimizedUrl = getOptimizedUrl(decodedPublicId, options);
    const thumbnailUrl = getThumbnailUrl(decodedPublicId);

    res.json({
      optimizedUrl,
      thumbnailUrl,
      public_id: decodedPublicId,
    });
  } catch (error) {
    console.error("Cloudinary optimize error:", error);
    res.status(500).json({
      message: "Failed to generate optimized URL",
      error: error.message,
    });
  }
});

// Get file information
router.get("/info/:publicId", authMiddleware, async (req, res) => {
  try {
    const { publicId } = req.params;
    const decodedPublicId = decodeURIComponent(publicId);

    const result = await getFileInfo(decodedPublicId);

    res.json({
      ...result,
      optimizedUrl: getOptimizedUrl(result.public_id),
      thumbnailUrl: getThumbnailUrl(result.public_id),
    });
  } catch (error) {
    console.error("Cloudinary info error:", error);
    res.status(404).json({
      message: "File not found",
      error: error.message,
    });
  }
});

// Health check for Cloudinary connection
router.get("/health", authMiddleware, async (req, res) => {
  try {
    // Test Cloudinary connection by getting account details
    const result = await cloudinary.api.ping();

    res.json({
      status: "healthy",
      cloudinary: result,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error("Cloudinary health check failed:", error);
    res.status(500).json({
      status: "unhealthy",
      error: error.message,
      timestamp: new Date().toISOString(),
    });
  }
});

module.exports = router;