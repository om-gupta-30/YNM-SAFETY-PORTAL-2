const express = require('express');
const router = express.Router();
const multer = require('multer');
const {
  getOrders,
  createOrder,
  deleteOrder,
  extractPdf
} = require('../controllers/orderController');
const { protect, authorize } = require('../middleware/auth');

router.use(protect);

// Configure multer for PDF uploads
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, 'uploads/');
  },
  filename: function (req, file, cb) {
    cb(null, Date.now() + '-' + file.originalname);
  }
});

const upload = multer({
  storage: storage,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB
  fileFilter: function (req, file, cb) {
    if (file.mimetype === 'application/pdf') {
      cb(null, true);
    } else {
      cb(new Error('Only PDF files are allowed'));
    }
  }
});

router.route('/')
  .get(getOrders)
  .post(createOrder);

router.route('/extract-pdf')
  .post(upload.single('pdf'), extractPdf);

router.route('/:id')
  .delete(deleteOrder); // Allow all authenticated users to delete their orders

module.exports = router;

