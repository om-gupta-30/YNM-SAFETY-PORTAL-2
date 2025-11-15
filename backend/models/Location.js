const mongoose = require('mongoose');

const locationSchema = new mongoose.Schema({
  Location_ID: {
    type: String,
    required: true,
    unique: true
  },
  City: {
    type: String,
    required: true
  },
  State: {
    type: String,
    required: true
  },
  latitude: {
    type: Number,
    default: null
  },
  longitude: {
    type: Number,
    default: null
  }
});

module.exports = mongoose.model('Location', locationSchema);

