const mongoose = require('mongoose');

const productOfferedSchema = new mongoose.Schema({
  productType: {
    type: String,
    required: true
  },
  price: {
    type: Number,
    required: true
  }
}, { _id: false });

const manufacturerSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true
  },
  location: {
    type: String,
    required: true
  },
  contact: {
    type: String,
    required: true
  },
  productsOffered: {
    type: [productOfferedSchema],
    default: []
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model('Manufacturer', manufacturerSchema);
