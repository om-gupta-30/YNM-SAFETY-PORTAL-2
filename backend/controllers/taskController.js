const Task = require('../models/Task');

// Helper function for fuzzy matching
function normalizeText(text) {
    if (!text || typeof text !== 'string') return '';
    return text.trim().toLowerCase().replace(/\s+/g, ' ');
}

function fuzzyMatch(str1, str2) {
    const s1 = normalizeText(str1);
    const s2 = normalizeText(str2);
    if (s1 === s2) return 1.0;
    if (s1.includes(s2) || s2.includes(s1)) return 0.9;
    
    const maxLen = Math.max(s1.length, s2.length);
    if (maxLen === 0) return 1.0;
    
    let distance = 0;
    const minLen = Math.min(s1.length, s2.length);
    for (let i = 0; i < minLen; i++) {
        if (s1[i] !== s2[i]) distance++;
    }
    distance += Math.abs(s1.length - s2.length);
    
    const similarity = 1 - (distance / maxLen);
    return distance <= 2 && maxLen > 2 ? Math.max(similarity, 0.85) : similarity;
}

// @desc    Get all tasks
// @route   GET /api/tasks
// @access  Private
exports.getTasks = async (req, res) => {
  try {
    let query = {};

    // If user is employee, only show their tasks
    if (req.user.role === 'employee') {
      query.assignedTo = req.user.username;
    } else if (req.query.assignedTo) {
      query.assignedTo = req.query.assignedTo;
    } else if (req.query.employee) {
      // Support old frontend format
      query.assignedTo = req.query.employee;
    }

    if (req.query.status) {
      // Map frontend status to backend status
      const statusMap = {
        'Pending': 'pending',
        'Completed': 'completed',
        'Carried Forward': 'pending' // Carried forward tasks are pending in backend
      };
      query.status = statusMap[req.query.status] || req.query.status.toLowerCase();
    }

    const tasks = await Task.find(query).sort({ date: -1 });

    // Transform to frontend format
    const transformedTasks = tasks.map(task => {
      const taskTextParts = task.taskText.split('\n');
      const title = taskTextParts[0] || task.taskText;
      const description = taskTextParts.slice(1).join('\n') || task.taskText;
      
      // Check if task is carried forward (deadline passed and status is pending)
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const taskDate = new Date(task.date);
      taskDate.setHours(0, 0, 0, 0);
      const isCarriedForward = task.status === 'pending' && taskDate < today;
      
      // Migrate old status updates to history if history is empty but statusUpdate exists
      let statusHistory = task.statusHistory || [];
      if (statusHistory.length === 0) {
        // Check if we have old statusUpdate or employeeStatus that should be migrated
        const statusUpdate = task.statusUpdate || '';
        const employeeStatus = task.employeeStatus || '';
        
        if (statusUpdate && statusUpdate.trim()) {
          statusHistory.push({
            statusText: statusUpdate.trim(),
            updatedAt: task.statusUpdatedAt || task.lastUpdatedOn || task.createdAt || new Date()
          });
        } else if (employeeStatus && employeeStatus.trim()) {
          statusHistory.push({
            statusText: employeeStatus.trim(),
            updatedAt: task.lastUpdatedOn || task.createdAt || new Date()
          });
        }
        
        // If we migrated data, save it back to the database (async, don't wait)
        if (statusHistory.length > 0) {
          task.statusHistory = statusHistory;
          task.save().catch(err => console.error('Error migrating status history:', err));
        }
      }
      
      return {
        _id: task._id,
        id: task._id,
        employee: task.assignedTo,
        title: title,
        description: description,
        deadline: task.date,
        assignedDate: task.createdAt,
        status: isCarriedForward ? 'Carried Forward' : (task.status.charAt(0).toUpperCase() + task.status.slice(1)),
        statusUpdate: task.statusUpdate || '',
        statusUpdatedAt: task.statusUpdatedAt || null,
        employeeStatus: task.employeeStatus || '',
        lastUpdatedOn: task.lastUpdatedOn || null,
        statusHistory: statusHistory,
        createdAt: task.createdAt
      };
    });

    res.status(200).json(transformedTasks);
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Create task
// @route   POST /api/tasks
// @access  Private/Admin
exports.createTask = async (req, res) => {
  try {
    // Support both old frontend format (employee, title, description, deadline) and new format (assignedTo, date, taskText)
    let assignedTo, date, taskText, status;
    
    if (req.body.employee) {
      // Old frontend format
      assignedTo = req.body.employee;
      date = req.body.deadline;
      taskText = `${req.body.title || ''}\n${req.body.description || ''}`.trim();
      status = req.body.status ? req.body.status.toLowerCase() : 'pending';
    } else {
      // New format
      assignedTo = req.body.assignedTo;
      date = req.body.date;
      taskText = req.body.taskText;
      status = req.body.status ? req.body.status.toLowerCase() : 'pending';
    }

    if (!assignedTo || !date || !taskText) {
      return res.status(400).json({ success: false, message: 'Please provide assignedTo/employee, date/deadline, and taskText/title+description' });
    }

    // Check for exact duplicate tasks only (same employee, same date, exact same title)
    // This prevents accidental exact duplicates while allowing similar tasks
    const allTasks = await Task.find();
    const taskDate = new Date(date);
    const taskDateStr = taskDate.toISOString().split('T')[0];
    const taskTitle = normalizeText(taskText.split('\n')[0] || taskText);
    
    for (const existingTask of allTasks) {
      const existingDate = new Date(existingTask.date);
      const existingDateStr = existingDate.toISOString().split('T')[0];
      const existingTitle = normalizeText(existingTask.taskText.split('\n')[0] || existingTask.taskText);
      
      const titleMatch = taskTitle === existingTitle;
      const employeeMatch = normalizeText(assignedTo) === normalizeText(existingTask.assignedTo);
      const dateMatch = taskDateStr === existingDateStr;
      
      // Only block if it's an EXACT duplicate (same employee, same date, exact same title)
      if (titleMatch && employeeMatch && dateMatch) {
        return res.status(409).json({
          success: false,
          message: 'Duplicate entry detected',
          existing: {
            assignedTo: existingTask.assignedTo,
            title: existingTask.taskText.split('\n')[0] || existingTask.taskText,
            date: existingTask.date,
            status: existingTask.status
          }
        });
      }
    }

    const task = await Task.create({
      assignedTo,
      assignedBy: req.user.username,
      date: new Date(date),
      taskText,
      status: status === 'completed' ? 'completed' : 'pending'
    });

    // Return in format frontend expects
    const response = {
      _id: task._id,
      id: task._id,
      employee: task.assignedTo,
      title: task.taskText.split('\n')[0] || task.taskText,
      description: task.taskText.split('\n').slice(1).join('\n') || task.taskText,
      deadline: task.date,
      assignedDate: task.createdAt,
      status: task.status.charAt(0).toUpperCase() + task.status.slice(1),
      createdAt: task.createdAt
    };

    res.status(201).json({ success: true, data: response });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Update task
// @route   PUT /api/tasks/:id
// @access  Private
exports.updateTask = async (req, res) => {
  try {
    let task = await Task.findById(req.params.id);

    if (!task) {
      return res.status(404).json({ success: false, message: 'Task not found' });
    }

    // Employees can only update status and statusUpdate of their own tasks
    if (req.user.role === 'employee') {
      if (task.assignedTo !== req.user.username) {
        return res.status(403).json({ success: false, message: 'Not authorized to update this task' });
      }
      
      // Allow employees to update status
      if (req.body.status) {
        // Map frontend status to backend
        const statusMap = {
          'Pending': 'pending',
          'Completed': 'completed',
          'Carried Forward': 'pending'
        };
        task.status = statusMap[req.body.status] || req.body.status.toLowerCase();
      }
      
      // Allow employees to update statusUpdate (work status)
      if (req.body.statusUpdate !== undefined) {
        task.statusUpdate = req.body.statusUpdate || '';
        task.statusUpdatedAt = new Date();
      }
      
      await task.save();
    } else {
      // Admin can update all fields - support both formats
      const updateData = {};
      
      if (req.body.employee) {
        updateData.assignedTo = req.body.employee;
      } else if (req.body.assignedTo) {
        updateData.assignedTo = req.body.assignedTo;
      }
      
      if (req.body.deadline) {
        updateData.date = new Date(req.body.deadline);
      } else if (req.body.date) {
        updateData.date = new Date(req.body.date);
      }
      
      if (req.body.title || req.body.description) {
        updateData.taskText = `${req.body.title || ''}\n${req.body.description || ''}`.trim();
      } else if (req.body.taskText) {
        updateData.taskText = req.body.taskText;
      }
      
      if (req.body.status) {
        const statusMap = {
          'Pending': 'pending',
          'Completed': 'completed',
          'Carried Forward': 'pending'
        };
        updateData.status = statusMap[req.body.status] || req.body.status.toLowerCase();
      }
      
      task = await Task.findByIdAndUpdate(req.params.id, updateData, {
        new: true,
        runValidators: true
      });
    }

    // Return in frontend format
    const taskTextParts = task.taskText.split('\n');
    const title = taskTextParts[0] || task.taskText;
    const description = taskTextParts.slice(1).join('\n') || task.taskText;
    
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const taskDate = new Date(task.date);
    taskDate.setHours(0, 0, 0, 0);
    const isCarriedForward = task.status === 'pending' && taskDate < today;
    
    const response = {
      _id: task._id,
      id: task._id,
      employee: task.assignedTo,
      title: title,
      description: description,
      deadline: task.date,
      assignedDate: task.createdAt,
      status: isCarriedForward ? 'Carried Forward' : (task.status.charAt(0).toUpperCase() + task.status.slice(1)),
      statusUpdate: task.statusUpdate || '',
      statusUpdatedAt: task.statusUpdatedAt || null,
      employeeStatus: task.employeeStatus || '',
      lastUpdatedOn: task.lastUpdatedOn || null,
      statusHistory: task.statusHistory || [],
      createdAt: task.createdAt
    };

    res.status(200).json({ success: true, data: response });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Delete task
// @route   DELETE /api/tasks/:id
// @access  Private/Admin
exports.deleteTask = async (req, res) => {
  try {
    const task = await Task.findById(req.params.id);

    if (!task) {
      return res.status(404).json({ success: false, message: 'Task not found' });
    }

    await Task.findByIdAndDelete(req.params.id);

    res.status(200).json({ success: true, message: 'Task deleted successfully' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Update task status (employee status update)
// @route   PUT /api/tasks/update-status/:taskId
// @access  Private (Employee only)
exports.updateTaskStatus = async (req, res) => {
  try {
    // Validate that requester role is employee
    if (req.user.role !== 'employee') {
      return res.status(403).json({ 
        success: false, 
        message: 'Only employees can update task status' 
      });
    }

    const task = await Task.findById(req.params.taskId);

    if (!task) {
      return res.status(404).json({ success: false, message: 'Task not found' });
    }

    // Validate that task is assigned to this employee
    if (task.assignedTo !== req.user.username) {
      return res.status(403).json({ 
        success: false, 
        message: 'Not authorized to update this task. Task is not assigned to you.' 
      });
    }

    // Employees can update status for ALL tasks assigned to them
    // No restrictions - they can always provide status updates on their assigned tasks

    // Get status text from request body
    const { statusText } = req.body;

    if (statusText === undefined || statusText === null) {
      return res.status(400).json({ 
        success: false, 
        message: 'statusText is required' 
      });
    }

    // Update employeeStatus and lastUpdatedOn
    task.employeeStatus = statusText || '';
    task.lastUpdatedOn = new Date();

    // Add to status history (only if task is not completed and statusText is provided)
    if (task.status !== 'completed' && statusText && statusText.trim()) {
      if (!task.statusHistory) {
        task.statusHistory = [];
      }
      // Always add to history - don't check if it already exists (allow multiple updates)
      task.statusHistory.push({
        statusText: statusText.trim(),
        updatedAt: new Date()
      });
      console.log(`[Status History] Added new status update to task ${task._id}. History now has ${task.statusHistory.length} entries.`);
    }

    await task.save();

    // Return updated task in frontend format
    const taskTextParts = task.taskText.split('\n');
    const title = taskTextParts[0] || task.taskText;
    const description = taskTextParts.slice(1).join('\n') || task.taskText;
    
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const taskDate = new Date(task.date);
    taskDate.setHours(0, 0, 0, 0);
    const isCarriedForward = task.status === 'pending' && taskDate < today;
    
    const response = {
      _id: task._id,
      id: task._id,
      employee: task.assignedTo,
      title: title,
      description: description,
      deadline: task.date,
      assignedDate: task.createdAt,
      status: isCarriedForward ? 'Carried Forward' : (task.status.charAt(0).toUpperCase() + task.status.slice(1)),
      statusUpdate: task.statusUpdate || '',
      statusUpdatedAt: task.statusUpdatedAt || null,
      employeeStatus: task.employeeStatus || '',
      lastUpdatedOn: task.lastUpdatedOn || null,
      statusHistory: task.statusHistory || [],
      createdAt: task.createdAt
    };

    res.status(200).json({ success: true, data: response });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Update task status update (employee status update)
// @route   PATCH /api/tasks/:id/status
// @access  Private (Employee only)
exports.updateTaskStatusUpdate = async (req, res) => {
  try {
    // Validate that requester role is employee
    if (req.user.role !== 'employee') {
      return res.status(403).json({ 
        success: false, 
        message: 'Only employees can update task status' 
      });
    }

    const task = await Task.findById(req.params.id);

    if (!task) {
      return res.status(404).json({ success: false, message: 'Task not found' });
    }

    // Validate that task is assigned to this employee
    if (task.assignedTo !== req.user.username) {
      return res.status(403).json({ 
        success: false, 
        message: 'Not authorized to update this task. Task is not assigned to you.' 
      });
    }

    // Get statusUpdate from request body
    const { statusUpdate } = req.body;

    if (statusUpdate === undefined || statusUpdate === null) {
      return res.status(400).json({ 
        success: false, 
        message: 'statusUpdate is required' 
      });
    }

    // Update statusUpdate and statusUpdatedAt fields
    task.statusUpdate = statusUpdate || '';
    task.statusUpdatedAt = new Date();

    // Add to status history (only if task is not completed and statusUpdate is provided)
    if (task.status !== 'completed' && statusUpdate && statusUpdate.trim()) {
      if (!task.statusHistory) {
        task.statusHistory = [];
      }
      // Always add to history - don't check if it already exists (allow multiple updates)
      task.statusHistory.push({
        statusText: statusUpdate.trim(),
        updatedAt: new Date()
      });
      console.log(`[Status History] Added new status update to task ${task._id}. History now has ${task.statusHistory.length} entries.`);
    }

    await task.save();

    // Return updated task in frontend format
    const taskTextParts = task.taskText.split('\n');
    const title = taskTextParts[0] || task.taskText;
    const description = taskTextParts.slice(1).join('\n') || task.taskText;
    
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const taskDate = new Date(task.date);
    taskDate.setHours(0, 0, 0, 0);
    const isCarriedForward = task.status === 'pending' && taskDate < today;
    
    const response = {
      _id: task._id,
      id: task._id,
      employee: task.assignedTo,
      title: title,
      description: description,
      deadline: task.date,
      assignedDate: task.createdAt,
      status: isCarriedForward ? 'Carried Forward' : (task.status.charAt(0).toUpperCase() + task.status.slice(1)),
      statusUpdate: task.statusUpdate || '',
      statusUpdatedAt: task.statusUpdatedAt || null,
      statusHistory: task.statusHistory || [],
      createdAt: task.createdAt
    };

    res.status(200).json({ success: true, data: response });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
