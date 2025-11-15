const mongoose = require('mongoose');

const orderSchema = new mongoose.Schema({
  manufacturer: {
    type: String,
    required: true
  },
  product: {
    type: String,
    required: true
  },
  productType: {
    type: String,
    required: true
  },
  quantity: {
    type: Number,
    required: true
  },
  fromLocation: {
    type: String,
    required: true
  },
  toLocation: {
    type: String,
    required: true
  },
  transportCost: {
    type: Number,
    default: 0
  },
  productCost: {
    type: Number,
    default: 0
  },
  totalCost: {
    type: Number,
    required: true
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model('Order', orderSchema);
