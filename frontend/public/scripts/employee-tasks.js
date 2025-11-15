// Employee Task Management System - Updated to use API

// Check if user is logged in and is employee
function checkEmployeeAccess() {
    const token = localStorage.getItem('authToken');
    const userRole = localStorage.getItem('userRole');
    
    if (!token) {
        window.location.href = 'login.html';
        return false;
    }
    
    // Check if user is employee (not admin)
    if (userRole === 'admin') {
        window.location.href = 'dashboard.html';
        return false;
    }
    
    return true;
}

// Get current employee name
function getCurrentEmployee() {
    return localStorage.getItem('activeUser');
}

// Initialize page
document.addEventListener('DOMContentLoaded', async function() {
    if (!checkEmployeeAccess()) return;
    
    // Set greeting
    const activeUser = getCurrentEmployee();
    const greetingEl = document.getElementById('userGreeting');
    if (greetingEl) {
        greetingEl.textContent = `Welcome, ${activeUser} 👋`;
    }
    
    // Load and display tasks
    await loadTasks();
    await updateStatistics();
    
    // Setup event listeners
    setupEventListeners();
});

// Setup event listeners
function setupEventListeners() {
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
}

// Load and display tasks
async function loadTasks() {
    try {
        if (typeof tasksAPI === 'undefined') {
            console.error('Tasks API not loaded');
            return;
        }
        
        const employee = getCurrentEmployee();
        
        // Get tasks for current employee (backend filters by employee)
        const myTasks = await tasksAPI.getAll({ employee: employee });
        
        // Store tasks globally for getTaskById function
        window.currentTasks = myTasks;
        
        const today = new Date().toISOString().split('T')[0];
        
        // Separate tasks by category
        // Today's Tasks: ALL tasks due today or in the future (including completed ones)
        // This allows employees to update status on all current/upcoming tasks
        const todayTasks = myTasks.filter(task => {
            const deadline = task.deadline ? new Date(task.deadline).toISOString().split('T')[0] : '';
            // Include all tasks due today or in the future, regardless of status
            // But exclude "Carried Forward" tasks (they go in their own section)
            return deadline >= today && task.status !== 'Carried Forward';
        });
        
        const carriedForwardTasks = myTasks.filter(task => 
            task.status === 'Carried Forward'
        );
        
        const completedTasks = myTasks.filter(task => 
            task.status === 'Completed'
        );
        
        // Display today's tasks
        displayTasks('todayTasks', todayTasks, 'No tasks for today.');
        
        // Display carried forward tasks
        displayTasks('carriedForwardTasks', carriedForwardTasks, 'No carried forward tasks.');
        
        // Display completed tasks
        displayTasks('completedTasks', completedTasks, 'No completed tasks.');
        
        await updateStatistics();
    } catch (error) {
        console.error('Error loading tasks:', error);
        displayTasks('todayTasks', [], 'Error loading tasks. Please refresh the page.');
    }
}

// Display tasks in a container
function displayTasks(containerId, tasks, emptyMessage) {
    const container = document.getElementById(containerId);
    if (!container) return;
    
    container.innerHTML = '';
    
    if (tasks.length === 0) {
        container.innerHTML = `<p class="no-tasks">${emptyMessage}</p>`;
        return;
    }
    
    const today = new Date().toISOString().split('T')[0];
    
    tasks.forEach(task => {
        const taskCard = document.createElement('div');
        taskCard.className = 'task-card';
        
        const deadline = task.deadline ? new Date(task.deadline).toISOString().split('T')[0] : '';
        const isOverdue = deadline < today && task.status !== 'Completed';
        const overdueClass = isOverdue ? 'overdue' : '';
        const taskId = task._id || task.id;
        
        console.log('Rendering task:', task.title, 'Task ID:', taskId);
        
        // Build the status update section HTML - ALWAYS include it, NO CONDITIONS
        // Show statusUpdate field (not employeeStatus) as per requirements
        const statusUpdateText = task.statusUpdate || '';
        const statusUpdatedAtDate = task.statusUpdatedAt || null;
        
        // Build complete task card HTML - NO status update section on each card
        let taskCardHTML = '<div class="task-card-header">';
        taskCardHTML += '<h3 class="' + overdueClass + '">' + escapeHtml(task.title) + '</h3>';
        taskCardHTML += '<span class="status-badge status-' + task.status.toLowerCase().replace(' ', '-') + '">' + getStatusBadge(task.status) + ' ' + task.status + '</span>';
        taskCardHTML += '</div>';
        taskCardHTML += '<p class="task-description">' + escapeHtml(task.description) + '</p>';
        
        // Show status update if it exists
        if (statusUpdateText) {
            taskCardHTML += '<div style="margin: 15px 0; padding: 10px; background: #e8f4f8; border-radius: 4px; border-left: 3px solid #667eea;">';
            taskCardHTML += '<div style="font-weight: 600; color: #333; margin-bottom: 5px;">Status Update:</div>';
            taskCardHTML += '<div style="color: #555; white-space: pre-wrap; margin-bottom: 5px;">' + escapeHtml(statusUpdateText) + '</div>';
            if (statusUpdatedAtDate) {
                taskCardHTML += '<small style="font-size: 0.85em; color: #888;">Last Updated On: ' + formatDate(statusUpdatedAtDate) + '</small>';
            }
            taskCardHTML += '</div>';
        }
        
        taskCardHTML += '<div class="task-card-footer">';
        taskCardHTML += '<div class="task-meta">';
        taskCardHTML += '<span><strong>Deadline:</strong> ' + formatDate(task.deadline) + '</span>';
        taskCardHTML += '<span><strong>Assigned:</strong> ' + formatDate(task.assignedDate || task.createdAt) + '</span>';
        taskCardHTML += '</div>';
        if (task.status !== 'Completed') {
            taskCardHTML += '<button class="complete-btn" onclick="markTaskComplete(\'' + taskId + '\')">Mark as Complete</button>';
        }
        taskCardHTML += '</div>';
        
        taskCard.innerHTML = taskCardHTML;
        container.appendChild(taskCard);
    });
}

// Show update status modal - opens with task selector
function showUpdateStatusModal() {
    // Get all tasks for the current employee
    const allTasks = window.currentTasks || [];
    
    if (allTasks.length === 0) {
        alert('No tasks available to update.');
        return;
    }
    
    // Create modal if it doesn't exist
    let modal = document.getElementById('updateStatusModal');
    if (!modal) {
        modal = document.createElement('div');
        modal.id = 'updateStatusModal';
        modal.className = 'modal';
        modal.style.display = 'none';
        modal.innerHTML = `
            <div class="modal-content" style="max-width: 600px;">
                <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px;">
                    <h2 style="margin: 0; color: var(--primary-maroon);">📝 Update Task Status</h2>
                    <button id="closeUpdateStatusModal" class="close-button" style="background: none; border: none; font-size: 24px; cursor: pointer; color: #667eea;">&times;</button>
                </div>
                <div style="margin-bottom: 15px;">
                    <label style="display: block; margin-bottom: 8px; font-weight: 600; color: #333;">
                        Select Task: *
                    </label>
                    <select 
                        id="taskSelectDropdown" 
                        style="width: 100%; padding: 10px; border: 1px solid #ddd; border-radius: 4px; font-size: 14px; font-family: inherit;"
                        required
                    >
                        <option value="">-- Select a task --</option>
                    </select>
                </div>
                <div style="margin-bottom: 15px;">
                    <label style="display: block; margin-bottom: 8px; font-weight: 600; color: #333;">
                        Enter your task status update: *
                    </label>
                    <textarea 
                        id="updateStatusTextarea" 
                        rows="5" 
                        placeholder="Enter your task status update..."
                        style="width: 100%; padding: 10px; border: 1px solid #ddd; border-radius: 4px; font-size: 14px; font-family: inherit; resize: vertical;"
                        required
                    ></textarea>
                </div>
                <div style="display: flex; gap: 10px; justify-content: flex-end;">
                    <button type="button" id="cancelUpdateStatus" class="submit-button" style="background: #6c757d; padding: 10px 20px;">Cancel</button>
                    <button type="button" id="saveUpdateStatus" class="submit-button" style="padding: 10px 20px;">Submit</button>
                </div>
            </div>
        `;
        document.body.appendChild(modal);
        
        // Setup event listeners
        const closeBtn = document.getElementById('closeUpdateStatusModal');
        const cancelBtn = document.getElementById('cancelUpdateStatus');
        const saveBtn = document.getElementById('saveUpdateStatus');
        
        const closeModal = () => {
            modal.style.display = 'none';
            document.getElementById('updateStatusTextarea').value = '';
            document.getElementById('taskSelectDropdown').value = '';
        };
        
        if (closeBtn) closeBtn.addEventListener('click', closeModal);
        if (cancelBtn) cancelBtn.addEventListener('click', closeModal);
        
        if (saveBtn) {
            saveBtn.addEventListener('click', async () => {
                const taskSelect = document.getElementById('taskSelectDropdown');
                const textarea = document.getElementById('updateStatusTextarea');
                const selectedTaskId = taskSelect.value;
                const statusText = textarea.value.trim();
                
                if (!selectedTaskId) {
                    alert('Please select a task.');
                    return;
                }
                
                if (!statusText) {
                    alert('Please enter a status update.');
                    return;
                }
                
                await updateTaskStatus(selectedTaskId, statusText);
                closeModal();
            });
        }
        
        // Close on outside click
        modal.addEventListener('click', (e) => {
            if (e.target === modal) {
                closeModal();
            }
        });
    }
    
    // Populate task dropdown
    const taskSelect = document.getElementById('taskSelectDropdown');
    if (taskSelect) {
        // Clear existing options except the first one
        taskSelect.innerHTML = '<option value="">-- Select a task --</option>';
        
        // Add all tasks
        allTasks.forEach(task => {
            const option = document.createElement('option');
            option.value = task._id || task.id;
            const taskTitle = task.title || 'Untitled Task';
            const deadline = task.deadline ? formatDate(task.deadline) : 'No deadline';
            option.textContent = `${taskTitle} (Deadline: ${deadline})`;
            taskSelect.appendChild(option);
        });
    }
    
    // Clear textarea
    const textarea = document.getElementById('updateStatusTextarea');
    if (textarea) {
        textarea.value = '';
    }
    
    // Show modal
    modal.style.display = 'block';
    if (taskSelect) {
        taskSelect.focus();
    }
}

// Helper function to get task by ID
function getTaskById(taskId) {
    // This will be populated from the tasks loaded
    const allTasks = window.currentTasks || [];
    return allTasks.find(t => (t._id || t.id) === taskId);
}

// Update task status (work status update) - uses new endpoint
async function updateTaskStatus(taskId, statusText) {
    if (!statusText || !statusText.trim()) {
        alert('Please enter a status update.');
        return;
    }
    
    try {
        const token = localStorage.getItem('authToken');
        if (!token) {
            throw new Error('Not authenticated');
        }
        
        // Use the same API base URL logic as api.js
        const BASE_URL = "https://ynm-safety-portal-2.onrender.com";
        const PYTHON_URL = "https://ynm-safety-portal-2-1.onrender.com";
        const API_BASE_URL = (() => {
            if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
                return 'http://localhost:5002/api';
            }
            return BASE_URL + '/api';
        })();
        const response = await fetch(`${API_BASE_URL}/tasks/${taskId}/status`, {
            method: 'PATCH',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({ statusUpdate: statusText.trim() })
        });
        
        const data = await response.json();
        
        if (!response.ok) {
            throw new Error(data.message || 'Failed to update task status');
        }
        
        // Show success message
        showSuccessMessage('Status updated successfully.');
        
        // Reload tasks to show updated status
        await loadTasks();
    } catch (error) {
        console.error('Error updating task status:', error);
        alert('Failed to save status update: ' + (error.message || 'Please try again.'));
    }
}

// Show success message
function showSuccessMessage(message) {
    // Create a temporary success message element
    const successDiv = document.createElement('div');
    successDiv.style.cssText = 'position: fixed; top: 20px; right: 20px; background: #28a745; color: white; padding: 15px 20px; border-radius: 4px; box-shadow: 0 2px 8px rgba(0,0,0,0.2); z-index: 10000; font-weight: 600;';
    successDiv.textContent = message;
    document.body.appendChild(successDiv);
    
    // Remove after 3 seconds
    setTimeout(() => {
        successDiv.remove();
    }, 3000);
}

// Make functions globally accessible
window.showUpdateStatusModal = showUpdateStatusModal;
window.updateTaskStatus = updateTaskStatus;

// Mark task as complete
async function markTaskComplete(taskId) {
    if (!confirm('Mark this task as completed?')) return;
    
    try {
        if (typeof tasksAPI === 'undefined') {
            throw new Error('Tasks API not loaded');
        }
        
        await tasksAPI.update(taskId, { status: 'Completed' });
        
        // Reload tasks and update statistics
        await loadTasks();
        await updateStatistics();
        
        alert('Task marked as completed!');
    } catch (error) {
        console.error('Error marking task complete:', error);
        alert('Failed to mark task as completed. Please try again.');
    }
}

// Update statistics
async function updateStatistics() {
    try {
        if (typeof tasksAPI === 'undefined') {
            return;
        }
        
        const employee = getCurrentEmployee();
        const myTasks = await tasksAPI.getAll({ employee: employee });
        
        const total = myTasks.length;
        const pending = myTasks.filter(t => t.status === 'Pending').length;
        const completed = myTasks.filter(t => t.status === 'Completed').length;
        const carriedForward = myTasks.filter(t => t.status === 'Carried Forward').length;
        
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

// Toggle completed tasks visibility
function toggleCompletedTasks() {
    const completedTasks = document.getElementById('completedTasks');
    const toggle = document.getElementById('completedToggle');
    
    if (!completedTasks || !toggle) return;
    
    if (completedTasks.style.display === 'none') {
        completedTasks.style.display = 'block';
        toggle.textContent = '▲';
    } else {
        completedTasks.style.display = 'none';
        toggle.textContent = '▼';
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
window.markTaskComplete = markTaskComplete;
window.toggleCompletedTasks = toggleCompletedTasks;
