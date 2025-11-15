const express = require('express');
const router = express.Router();
const {
  getManufacturers,
  createManufacturer,
  updateManufacturer,
  deleteManufacturer
} = require('../controllers/manufacturerController');
const { protect, authorize } = require('../middleware/auth');

router.use(protect);

router.route('/')
  .get(getManufacturers)
  .post(authorize('admin'), createManufacturer);

router.route('/:id')
  .put(authorize('admin'), updateManufacturer)
  .delete(authorize('admin'), deleteManufacturer);

module.exports = router;

