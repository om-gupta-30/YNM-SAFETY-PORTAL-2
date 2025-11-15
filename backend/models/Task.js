const mongoose = require('mongoose');

const taskSchema = new mongoose.Schema({
  assignedTo: {
    type: String,
    required: true
  },
  assignedBy: {
    type: String,
    required: true
  },
  date: {
    type: Date,
    required: true
  },
  taskText: {
    type: String,
    required: true
  },
  status: {
    type: String,
    enum: ['pending', 'completed'],
    default: 'pending'
  },
  statusUpdate: {
    type: String,
    default: '',
    maxlength: 1000
  },
  statusUpdatedAt: {
    type: Date
  },
  employeeStatus: {
    type: String,
    default: ''
  },
  lastUpdatedOn: {
    type: Date
  },
  statusHistory: [{
    statusText: {
      type: String,
      required: true
    },
    updatedAt: {
      type: Date,
      default: Date.now
    }
  }],
  createdAt: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model('Task', taskSchema);
