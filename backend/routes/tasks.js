const express = require('express');
const router = express.Router();
const {
  getTasks,
  createTask,
  updateTask,
  deleteTask,
  updateTaskStatus,
  updateTaskStatusUpdate
} = require('../controllers/taskController');
const { protect, authorize } = require('../middleware/auth');

router.use(protect);

router.route('/')
  .get(getTasks)
  .post(authorize('admin'), createTask);

router.route('/update-status/:taskId')
  .put(updateTaskStatus);

router.route('/:id/status')
  .patch(updateTaskStatusUpdate);

router.route('/:id')
  .put(updateTask)
  .delete(authorize('admin'), deleteTask);

module.exports = router;

