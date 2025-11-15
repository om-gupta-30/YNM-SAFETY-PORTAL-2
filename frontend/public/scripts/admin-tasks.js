// Admin Task Management System - Updated to use API
let allTasks = []; // Store all tasks for duplicate checking

// Check if user is logged in and is admin
function checkAdminAccess() {
    const token = localStorage.getItem('authToken');
    const userRole = localStorage.getItem('userRole');
    
    if (!token) {
        window.location.href = 'login.html';
        return false;
    }
    
    // Check if user is admin
    if (userRole !== 'admin') {
        window.location.href = 'login.html';
        return false;
    }
    
    return true;
}

// Initialize page
document.addEventListener('DOMContentLoaded', async function() {
    if (!checkAdminAccess()) return;
    
    // Set greeting
    const activeUser = localStorage.getItem('activeUser');
    const greetingEl = document.getElementById('userGreeting');
    if (greetingEl) {
        greetingEl.textContent = `Welcome, ${activeUser} 👋`;
    }
    
    // Set today's date as minimum for deadline input
    const today = new Date().toISOString().split('T')[0];
    const deadlineInput = document.getElementById('deadlineInput');
    if (deadlineInput) deadlineInput.min = today;
    
    // Setup typo correction for task title
    const taskTitleInput = document.getElementById('taskTitleInput');
    if (taskTitleInput && typeof setupTypoCorrection === 'function') {
        setupTypoCorrection(taskTitleInput, async () => {
            // Get all existing task titles for suggestions
            try {
                if (typeof tasksAPI !== 'undefined') {
                    const tasks = await tasksAPI.getAll();
                    return tasks.map(t => t.title || t.taskText || '').filter(t => t);
                }
            } catch (error) {
                console.error('Error loading tasks for typo correction:', error);
            }
            return [];
        }, {
            autoCorrectThreshold: 0.95, // Higher threshold for task titles (less aggressive)
            suggestionThreshold: 0.88,
            onCorrect: (corrected, original) => {
                console.log(`Auto-corrected task title "${original}" to "${corrected}"`);
            }
        });
    }
    
    // Load employees for dropdowns
    await loadEmployees();
    
    // Load and display tasks
    await loadTasks();
    await updateStatistics();
    
    // Setup event listeners
    setupEventListeners();
});

// Load employees and populate dropdowns
async function loadEmployees() {
    try {
        if (typeof authAPI === 'undefined' || !authAPI.getEmployees) {
            console.error('Auth API not available');
            return;
        }
        
        const employees = await authAPI.getEmployees();
        console.log('Loaded employees:', employees);
        
        // Populate employee select dropdown
        const employeeSelect = document.getElementById('employeeSelect');
        if (employeeSelect) {
            // Keep the first option (Select Employee)
            employeeSelect.innerHTML = '<option value="">Select Employee</option>';
            employees.forEach(emp => {
                const option = document.createElement('option');
                option.value = emp.username;
                option.textContent = emp.username;
                employeeSelect.appendChild(option);
            });
        }
        
        // Populate filter employee dropdown
        const filterEmployee = document.getElementById('filterEmployee');
        if (filterEmployee) {
            // Keep the first option (All Employees)
            filterEmployee.innerHTML = '<option value="">All Employees</option>';
            employees.forEach(emp => {
                const option = document.createElement('option');
                option.value = emp.username;
                option.textContent = emp.username;
                filterEmployee.appendChild(option);
            });
        }
        
        // Populate edit employee select dropdown
        const editEmployeeSelect = document.getElementById('editEmployeeSelect');
        if (editEmployeeSelect) {
            editEmployeeSelect.innerHTML = '<option value="">Select Employee</option>';
            employees.forEach(emp => {
                const option = document.createElement('option');
                option.value = emp.username;
                option.textContent = emp.username;
                editEmployeeSelect.appendChild(option);
            });
        }
    } catch (error) {
        console.error('Error loading employees:', error);
    }
}

// Setup event listeners
function setupEventListeners() {
    // Task form submission
    const taskForm = document.getElementById('taskForm');
    if (taskForm) {
        taskForm.addEventListener('submit', async function(e) {
            e.preventDefault();
            await assignTask();
        });
    }
    
    // Edit task form submission
    const editTaskForm = document.getElementById('editTaskForm');
    if (editTaskForm) {
        editTaskForm.addEventListener('submit', async function(e) {
            e.preventDefault();
            await saveEditedTask();
        });
    }
    
    // Filter changes
    const filterEmployee = document.getElementById('filterEmployee');
    const filterStatus = document.getElementById('filterStatus');
    const clearFilters = document.getElementById('clearFilters');
    
    if (filterEmployee) {
        filterEmployee.addEventListener('change', loadTasks);
    }
    if (filterStatus) {
        filterStatus.addEventListener('change', loadTasks);
    }
    if (clearFilters) {
        clearFilters.addEventListener('click', function() {
            if (filterEmployee) filterEmployee.value = '';
            if (filterStatus) filterStatus.value = '';
            loadTasks();
        });
    }
    
    // Logout button
    const logoutBtn = document.getElementById('logoutBtn');
    if (logoutBtn) {
        logoutBtn.addEventListener('click', function(e) {
            e.preventDefault();
            e.stopPropagation();
            // Clear all authentication data
            localStorage.removeItem('sessionActive');
            localStorage.removeItem('activeUser');
            localStorage.removeItem('rememberMe');
            localStorage.removeItem('authToken');
            localStorage.removeItem('userRole');
            // Redirect to login page
            window.location.href = 'login.html';
        });
        logoutBtn.type = 'button';
    }
    
    // Modal close
    const modal = document.getElementById('editTaskModal');
    if (modal) {
        const closeBtn = modal.querySelector('.close-modal');
        const cancelBtn = document.getElementById('cancelEdit');
        
        if (closeBtn) {
            closeBtn.addEventListener('click', function() {
                modal.style.display = 'none';
            });
        }
        
        if (cancelBtn) {
            cancelBtn.addEventListener('click', function() {
                modal.style.display = 'none';
            });
        }
        
        window.addEventListener('click', function(e) {
            if (e.target === modal) {
                modal.style.display = 'none';
            }
        });
    }
}

// Assign new task
async function assignTask() {
    const employee = document.getElementById('employeeSelect')?.value;
    const title = document.getElementById('taskTitleInput')?.value.trim();
    const description = document.getElementById('taskDescriptionInput')?.value.trim();
    const deadline = document.getElementById('deadlineInput')?.value;
    
    if (!employee || !title || !description || !deadline) {
        alert('Please fill in all required fields.');
        return;
    }
    
    try {
        if (typeof tasksAPI === 'undefined') {
            throw new Error('Tasks API not loaded');
        }
        
        await tasksAPI.create({
            employee: employee,
            title: title,
            description: description,
            deadline: deadline
        });
        
        // Reset form
        const taskForm = document.getElementById('taskForm');
        if (taskForm) taskForm.reset();
        
        // Reload tasks and update statistics
        await loadTasks();
        await updateStatistics();
        
        // Show success message
        alert('Task assigned successfully!');
    } catch (error) {
        console.error('Error assigning task:', error);
        const errorMessage = error.message || 'Failed to assign task. Please try again.';
        
        // Handle duplicate task error with more details
        if (error.status === 409 && error.existing) {
            const existing = error.existing;
            alert(`Cannot assign task: ${errorMessage}\n\nA task with the same title already exists:\n- Employee: ${existing.assignedTo}\n- Title: ${existing.title}\n- Date: ${new Date(existing.date).toLocaleDateString()}\n- Status: ${existing.status}\n\nPlease modify the task title or assign it to a different employee/date.`);
        } else {
            alert('Failed to assign task: ' + errorMessage);
        }
    }
}

// Load and display tasks
async function loadTasks() {
    try {
        if (typeof tasksAPI === 'undefined') {
            console.error('Tasks API not loaded');
            return;
        }
        
        const filterEmployee = document.getElementById('filterEmployee')?.value || '';
        const filterStatus = document.getElementById('filterStatus')?.value || '';
        
        const filters = {};
        if (filterEmployee) filters.employee = filterEmployee;
        if (filterStatus) filters.status = filterStatus;
        
        const tasks = await tasksAPI.getAll(filters);
        
        // Store all tasks for duplicate checking (without filters)
        if (Object.keys(filters).length === 0) {
            allTasks = tasks;
        } else {
            // If filters are applied, still load all tasks for duplicate checking
            try {
                allTasks = await tasksAPI.getAll();
            } catch (error) {
                console.error('Error loading all tasks for duplicate check:', error);
            }
        }
        
        // Sort by assigned date (newest first)
        tasks.sort((a, b) => new Date(b.assignedDate || b.createdAt) - new Date(a.assignedDate || a.createdAt));
        
        const tbody = document.getElementById('tasksTableBody');
        if (!tbody) return;
        
        tbody.innerHTML = '';
        
        if (tasks.length === 0) {
            tbody.innerHTML = '<tr><td colspan="8" class="no-tasks">No tasks found.</td></tr>';
            await updateStatistics();
            return;
        }
        
        tasks.forEach(task => {
            const row = document.createElement('tr');
            const taskId = task._id || task.id;
            const statusUpdate = task.statusUpdate || '';
            const statusUpdatedAt = task.statusUpdatedAt ? formatDate(task.statusUpdatedAt) : '';
            
            // Get status history - show all status updates that were made before task completion
            const statusHistory = task.statusHistory || [];
            
            // Debug: Log the task data to see what we're receiving
            console.log('Task data:', {
                taskId: taskId,
                statusHistory: statusHistory,
                statusHistoryLength: statusHistory.length,
                statusUpdate: statusUpdate,
                employeeStatus: task.employeeStatus
            });
            
            // Build status history HTML
            let statusHistoryHTML = '';
            
            // Always try to show history if it exists
            if (statusHistory && Array.isArray(statusHistory) && statusHistory.length > 0) {
                statusHistoryHTML = '<div style="max-height: 400px; overflow-y: auto; padding: 5px;">';
                // Show in reverse chronological order (newest first)
                const sortedHistory = [...statusHistory].sort((a, b) => {
                    const dateA = new Date(a.updatedAt);
                    const dateB = new Date(b.updatedAt);
                    return dateB - dateA;
                });
                
                sortedHistory.forEach((entry, index) => {
                    const updateDate = entry.updatedAt ? formatDate(entry.updatedAt) : 'Unknown date';
                    const isLatest = index === 0;
                    const statusText = entry.statusText || entry.statusUpdate || '';
                    statusHistoryHTML += `
                        <div style="background: ${isLatest ? '#e8f4f8' : '#f5f5f5'}; padding: 10px; border-radius: 4px; border-left: 3px solid ${isLatest ? '#667eea' : '#ccc'}; margin-bottom: ${index < sortedHistory.length - 1 ? '10px' : '0'};">
                            ${isLatest ? '<div style="font-weight: 600; color: #667eea; margin-bottom: 5px; font-size: 0.9em;">⭐ Latest Update</div>' : ''}
                            <div style="color: #555; white-space: pre-wrap; margin-bottom: 8px; font-size: 0.95em;">${escapeHtml(statusText)}</div>
                            <div style="font-size: 0.8em; color: #888; font-style: italic;">
                                ${updateDate}
                            </div>
                        </div>
                    `;
                });
                statusHistoryHTML += '</div>';
            } else if (statusUpdate) {
                // Fallback: If no history but we have a statusUpdate, show it
                statusHistoryHTML = `
                    <div style="background: #e8f4f8; padding: 10px; border-radius: 4px; border-left: 3px solid #667eea; margin-bottom: 8px;">
                        <div style="font-weight: 600; color: #333; margin-bottom: 5px;">Status Update:</div>
                        <div style="color: #555; white-space: pre-wrap; margin-bottom: 8px;">${escapeHtml(statusUpdate)}</div>
                        ${statusUpdatedAt ? `
                            <div style="font-size: 0.85em; color: #888; font-style: italic;">
                                Updated On: ${statusUpdatedAt}
                            </div>
                        ` : ''}
                    </div>
                `;
            } else {
                // No status updates at all
                statusHistoryHTML = `
                    <div style="color: #999; font-style: italic;">
                        Status Update: No update yet
                    </div>
                    <div style="font-size: 0.85em; color: #999; margin-top: 5px;">
                        Updated On: -
                    </div>
                `;
            }
            
            row.innerHTML = `
                <td>${task.employee}</td>
                <td>${escapeHtml(task.title)}</td>
                <td>${escapeHtml(task.description)}</td>
                <td>${formatDate(task.deadline)}</td>
                <td><span class="status-badge status-${task.status.toLowerCase().replace(' ', '-')}">${getStatusBadge(task.status)} ${task.status}</span></td>
                <td style="max-width: 400px; word-wrap: break-word;">
                    ${statusHistoryHTML}
                </td>
                <td>${formatDate(task.assignedDate || task.createdAt)}</td>
                <td>
                    <button class="action-btn edit-btn" onclick="editTask('${taskId}')">Edit</button>
                    <button class="action-btn delete-btn" onclick="deleteTask('${taskId}')" title="Delete Task">🗑️ Delete</button>
                </td>
            `;
            tbody.appendChild(row);
        });
        
        await updateStatistics();
    } catch (error) {
        console.error('Error loading tasks:', error);
        const tbody = document.getElementById('tasksTableBody');
        if (tbody) {
            tbody.innerHTML = '<tr><td colspan="8" class="no-tasks">Error loading tasks. Please refresh the page.</td></tr>';
        }
    }
}

// Edit task
async function editTask(taskId) {
    try {
        if (typeof tasksAPI === 'undefined') {
            throw new Error('Tasks API not loaded');
        }
        
        const tasks = await tasksAPI.getAll();
        const task = tasks.find(t => (t._id || t.id) === taskId);
        
        if (!task) {
            alert('Task not found.');
            return;
        }
        
        // Populate edit form
        const editTaskId = document.getElementById('editTaskId');
        const editEmployeeSelect = document.getElementById('editEmployeeSelect');
        const editTaskTitleInput = document.getElementById('editTaskTitleInput');
        const editTaskDescriptionInput = document.getElementById('editTaskDescriptionInput');
        const editDeadlineInput = document.getElementById('editDeadlineInput');
        const editStatusSelect = document.getElementById('editStatusSelect');
        
        if (editTaskId) editTaskId.value = task._id || task.id;
        if (editEmployeeSelect) editEmployeeSelect.value = task.employee;
        if (editTaskTitleInput) editTaskTitleInput.value = task.title;
        if (editTaskDescriptionInput) editTaskDescriptionInput.value = task.description;
        if (editDeadlineInput) editDeadlineInput.value = task.deadline ? new Date(task.deadline).toISOString().split('T')[0] : '';
        if (editStatusSelect) editStatusSelect.value = task.status;
        
        // Show modal
        const modal = document.getElementById('editTaskModal');
        if (modal) modal.style.display = 'block';
    } catch (error) {
        console.error('Error loading task for edit:', error);
        alert('Failed to load task. Please try again.');
    }
}

// Save edited task
async function saveEditedTask() {
    const taskId = document.getElementById('editTaskId')?.value;
    const employee = document.getElementById('editEmployeeSelect')?.value;
    const title = document.getElementById('editTaskTitleInput')?.value.trim();
    const description = document.getElementById('editTaskDescriptionInput')?.value.trim();
    const deadline = document.getElementById('editDeadlineInput')?.value;
    const status = document.getElementById('editStatusSelect')?.value;
    
    if (!employee || !title || !description || !deadline) {
        alert('Please fill in all required fields.');
        return;
    }
    
    try {
        if (typeof tasksAPI === 'undefined') {
            throw new Error('Tasks API not loaded');
        }
        
        await tasksAPI.update(taskId, {
            employee: employee,
            title: title,
            description: description,
            deadline: deadline,
            status: status
        });
        
        // Close modal
        const modal = document.getElementById('editTaskModal');
        if (modal) modal.style.display = 'none';
        
        // Reload tasks and update statistics
        await loadTasks();
        await updateStatistics();
        
        alert('Task updated successfully!');
    } catch (error) {
        console.error('Error updating task:', error);
        alert('Failed to update task. Please try again.');
    }
}

// Delete task
async function deleteTask(taskId) {
    if (!confirm('Are you sure you want to delete this task?\n\nThis action cannot be undone.')) {
        return;
    }
    
    try {
        if (typeof tasksAPI === 'undefined') {
            throw new Error('Tasks API not loaded');
        }
        
        await tasksAPI.delete(taskId);
        
        // Reload tasks and update statistics
        await loadTasks();
        await updateStatistics();
        
        alert('✅ Task deleted successfully!');
    } catch (error) {
        console.error('Error deleting task:', error);
        alert('Failed to delete task. Please try again.');
    }
}

// Update statistics
async function updateStatistics() {
    try {
        if (typeof tasksAPI === 'undefined') {
            return;
        }
        
        const tasks = await tasksAPI.getAll();
        
        const total = tasks.length;
        const pending = tasks.filter(t => t.status === 'Pending').length;
        const completed = tasks.filter(t => t.status === 'Completed').length;
        const carriedForward = tasks.filter(t => t.status === 'Carried Forward').length;
        
        const totalEl = document.getElementById('totalTasksCount');
        const pendingEl = document.getElementById('pendingTasksCount');
        const completedEl = document.getElementById('completedTasksCount');
        const carriedForwardEl = document.getElementById('carriedForwardCount');
        
        if (totalEl) totalEl.textContent = total;
        if (pendingEl) pendingEl.textContent = pending;
        if (completedEl) completedEl.textContent = completed;
        if (carriedForwardEl) carriedForwardEl.textContent = carriedForward;
    } catch (error) {
        console.error('Error updating statistics:', error);
    }
}

// Helper functions
function formatDate(dateString) {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
}

function escapeHtml(text) {
    if (!text) return '';
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

function getStatusBadge(status) {
    switch(status) {
        case 'Completed':
            return '🟢';
        case 'Pending':
            return '🔴';
        case 'Carried Forward':
            return '🟡';
        default:
            return '⚪';
    }
}

// Make functions globally accessible
window.editTask = editTask;
window.deleteTask = deleteTask;
