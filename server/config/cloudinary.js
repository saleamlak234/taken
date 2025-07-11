// const cloudinary = require('cloudinary').v2;
// const { CloudinaryStorage } = require('multer-storage-cloudinary');
// const multer = require('multer');

// // Configure Cloudinary
// cloudinary.config({
//   cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
//   api_key: process.env.CLOUDINARY_API_KEY,
//   api_secret: process.env.CLOUDINARY_API_SECRET,
// });

// // Configure Cloudinary storage for multer
// const storage = new CloudinaryStorage({
//   cloudinary: cloudinary,
//   params: {
//     folder: 'saham-trading/receipts',
//     allowed_formats: ['jpg', 'jpeg', 'png', 'gif', 'pdf', 'webp', 'bmp'],
//     resource_type: 'auto',
//     transformation: [
//       {
//         quality: 'auto',
//         fetch_format: 'auto'
//       }
//     ],
//     public_id: (req, file) => {
//       const timestamp = Date.now();
//       const random = Math.round(Math.random() * 1E9);
//       return `receipt-${timestamp}-${random}`;
//     }
//   },
// });

// // File filter function
// const fileFilter = (req, file, cb) => {
//   const allowedTypes = /jpeg|jpg|png|gif|pdf|webp|bmp/;
//   const extname = allowedTypes.test(file.originalname.toLowerCase());
//   const mimetype = allowedTypes.test(file.mimetype);

//   if (mimetype && extname) {
//     return cb(null, true);
//   } else {
//     cb(new Error('Only image and PDF files are allowed'));
//   }
// };

// // Create multer upload middleware
// const upload = multer({
//   storage: storage,
//   limits: {
//     fileSize: 10 * 1024 * 1024 // 10MB limit
//   },
//   fileFilter: fileFilter
// });

// // Helper functions
// const uploadToCloudinary = async (buffer, options = {}) => {
//   return new Promise((resolve, reject) => {
//     const uploadOptions = {
//       folder: 'saham-trading/receipts',
//       resource_type: 'auto',
//       quality: 'auto',
//       fetch_format: 'auto',
//       ...options
//     };

//     cloudinary.uploader.upload_stream(
//       uploadOptions,
//       (error, result) => {
//         if (error) {
//           reject(error);
//         } else {
//           resolve(result);
//         }
//       }
//     ).end(buffer);
//   });
// };

// const deleteFromCloudinary = async (publicId) => {
//   try {
//     const result = await cloudinary.uploader.destroy(publicId);
//     return result;
//   } catch (error) {
//     console.error('Error deleting from Cloudinary:', error);
//     throw error;
//   }
// };

// const getOptimizedUrl = (publicId, options = {}) => {
//   return cloudinary.url(publicId, {
//     quality: 'auto',
//     fetch_format: 'auto',
//     ...options
//   });
// };

// const getThumbnailUrl = (publicId, width = 200, height = 200) => {
//   return cloudinary.url(publicId, {
//     width: width,
//     height: height,
//     crop: 'fill',
//     quality: 'auto',
//     fetch_format: 'auto'
//   });
// };

// module.exports = {
//   cloudinary,
//   upload,
//   uploadToCloudinary,
//   deleteFromCloudinary,
//   getOptimizedUrl,
//   getThumbnailUrl
// };
const cloudinary = require("cloudinary").v2;
const multer = require("multer");
const dotenv = require("dotenv");
require("dotenv").config();
// Configure Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

// Configure multer for memory storage (no local file storage)
const storage = multer.memoryStorage();

// File filter function
const fileFilter = (req, file, cb) => {
  const allowedTypes = /jpeg|jpg|png|gif|pdf|webp|bmp/;
  const extname = allowedTypes.test(file.originalname.toLowerCase());
  const mimetype = allowedTypes.test(file.mimetype);

  if (mimetype && extname) {
    return cb(null, true);
  } else {
    cb(new Error("Only image and PDF files are allowed"));
  }
};

// Create multer upload middleware with memory storage
const upload = multer({
  storage: storage,
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB limit
  },
  fileFilter: fileFilter,
});

// Helper function to upload buffer to Cloudinary
const uploadToCloudinary = async (buffer, options = {}) => {
  return new Promise((resolve, reject) => {
    const uploadOptions = {
      folder: "saham-trading/receipts",
      resource_type: "auto",
      transformation: [
        {
          quality: "auto",
          fetch_format: "auto",
        },
      ],
      public_id: `receipt-${Date.now()}-${Math.round(Math.random() * 1e9)}`,
      ...options,
    };

    cloudinary.uploader
      .upload_stream(uploadOptions, (error, result) => {
        if (error) {
          console.error("Cloudinary upload error:", error);
          reject(error);
        } else {
          resolve(result);
        }
      })
      .end(buffer);
  });
};

// Helper function to upload file directly from multer
const uploadFileToCloudinary = async (file, options = {}) => {
  if (!file || !file.buffer) {
    throw new Error("No file buffer provided");
  }

  try {
    const result = await uploadToCloudinary(file.buffer, {
      original_filename: file.originalname,
      ...options,
    });

    return {
      public_id: result.public_id,
      secure_url: result.secure_url,
      original_filename: file.originalname,
      format: result.format,
      resource_type: result.resource_type,
      bytes: result.bytes,
      width: result.width,
      height: result.height,
      created_at: result.created_at,
      url: result.url,
    };
  } catch (error) {
    console.error("Error uploading to Cloudinary:", error);
    throw new Error("Failed to upload file to Cloudinary");
  }
};

// Delete file from Cloudinary
const deleteFromCloudinary = async (publicId) => {
  try {
    const result = await cloudinary.uploader.destroy(publicId);
    return result;
  } catch (error) {
    console.error("Error deleting from Cloudinary:", error);
    throw error;
  }
};

// Get optimized URL
const getOptimizedUrl = (publicId, options = {}) => {
  if (!publicId) return null;

  return cloudinary.url(publicId, {
    quality: "auto",
    fetch_format: "auto",
    ...options,
  });
};

// Get thumbnail URL
const getThumbnailUrl = (publicId, width = 200, height = 200) => {
  if (!publicId) return null;

  return cloudinary.url(publicId, {
    width: width,
    height: height,
    crop: "fill",
    quality: "auto",
    fetch_format: "auto",
  });
};

// Get file info from Cloudinary
const getFileInfo = async (publicId) => {
  try {
    const result = await cloudinary.api.resource(publicId);
    return {
      public_id: result.public_id,
      format: result.format,
      resource_type: result.resource_type,
      bytes: result.bytes,
      width: result.width,
      height: result.height,
      created_at: result.created_at,
      secure_url: result.secure_url,
      url: result.url,
    };
  } catch (error) {
    console.error("Error getting file info from Cloudinary:", error);
    throw error;
  }
};

module.exports = {
  cloudinary,
  upload,
  uploadToCloudinary,
  uploadFileToCloudinary,
  deleteFromCloudinary,
  getOptimizedUrl,
  getThumbnailUrl,
  getFileInfo,
};
