// Past Task Status Page - For Admins

// Check if user is logged in and is admin
function checkAdminAccess() {
    const token = localStorage.getItem('authToken');
    const userRole = localStorage.getItem('userRole');
    
    if (!token) {
        window.location.href = 'login.html';
        return false;
    }
    
    if (userRole !== 'admin') {
        window.location.href = 'index.html';
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
    
    // Setup logout button
    const logoutBtn = document.getElementById('logoutBtn');
    if (logoutBtn) {
        logoutBtn.addEventListener('click', function(e) {
            e.preventDefault();
            e.stopPropagation();
            localStorage.removeItem('sessionActive');
            localStorage.removeItem('activeUser');
            localStorage.removeItem('rememberMe');
            localStorage.removeItem('authToken');
            localStorage.removeItem('userRole');
            window.location.href = 'login.html';
        });
        logoutBtn.type = 'button';
    }
    
    // Load employees
    await loadEmployees();
    
    // Setup event listeners
    setupEventListeners();
});

// Load employees and populate dropdown
async function loadEmployees() {
    try {
        if (typeof authAPI === 'undefined' || !authAPI.getEmployees) {
            console.error('Auth API not available');
            return;
        }
        
        const employees = await authAPI.getEmployees();
        console.log('Loaded employees:', employees);
        
        const employeeSelect = document.getElementById('employeeSelect');
        if (employeeSelect) {
            employees.forEach(emp => {
                const option = document.createElement('option');
                option.value = emp.username;
                option.textContent = emp.username;
                employeeSelect.appendChild(option);
            });
        }
    } catch (error) {
        console.error('Error loading employees:', error);
        alert('Failed to load employees. Please refresh the page.');
    }
}

// Setup event listeners
function setupEventListeners() {
    const employeeSelect = document.getElementById('employeeSelect');
    const taskSelect = document.getElementById('taskSelect');
    const viewStatusBtn = document.getElementById('viewStatusBtn');
    
    // When employee is selected, load their tasks
    if (employeeSelect) {
        employeeSelect.addEventListener('change', async function() {
            const selectedEmployee = this.value;
            if (selectedEmployee) {
                await loadTasksForEmployee(selectedEmployee);
                taskSelect.disabled = false;
                viewStatusBtn.disabled = true; // Disable until task is selected
            } else {
                taskSelect.innerHTML = '<option value="">-- Select Employee First --</option>';
                taskSelect.disabled = true;
                viewStatusBtn.disabled = true;
            }
        });
    }
    
    // When task is selected, enable view button
    if (taskSelect) {
        taskSelect.addEventListener('change', function() {
            viewStatusBtn.disabled = !this.value;
        });
    }
    
    // View status button
    if (viewStatusBtn) {
        viewStatusBtn.addEventListener('click', async function() {
            const selectedTaskId = taskSelect.value;
            if (selectedTaskId) {
                await viewTaskStatus(selectedTaskId);
            }
        });
    }
}

// Load tasks for selected employee
async function loadTasksForEmployee(employee) {
    try {
        if (typeof tasksAPI === 'undefined') {
            console.error('Tasks API not available');
            return;
        }
        
        const tasks = await tasksAPI.getAll({ employee: employee });
        console.log('Loaded tasks for employee:', tasks);
        
        const taskSelect = document.getElementById('taskSelect');
        if (taskSelect) {
            taskSelect.innerHTML = '<option value="">-- Select Task --</option>';
            
            if (tasks.length === 0) {
                const option = document.createElement('option');
                option.value = '';
                option.textContent = 'No tasks found for this employee';
                option.disabled = true;
                taskSelect.appendChild(option);
                return;
            }
            
            tasks.forEach(task => {
                const option = document.createElement('option');
                option.value = task._id || task.id;
                const taskTitle = task.title || 'Untitled Task';
                const deadline = task.deadline ? formatDate(task.deadline) : 'No deadline';
                const status = task.status || 'Pending';
                option.textContent = `${taskTitle} (Deadline: ${deadline}, Status: ${status})`;
                option.dataset.taskData = JSON.stringify(task); // Store full task data
                taskSelect.appendChild(option);
            });
        }
    } catch (error) {
        console.error('Error loading tasks:', error);
        alert('Failed to load tasks. Please try again.');
    }
}

// View task status history
async function viewTaskStatus(taskId) {
    try {
        if (typeof tasksAPI === 'undefined') {
            console.error('Tasks API not available');
            return;
        }
        
        // Get all tasks to find the selected one
        const tasks = await tasksAPI.getAll();
        const task = tasks.find(t => (t._id || t.id) === taskId);
        
        if (!task) {
            alert('Task not found.');
            return;
        }
        
        // Get the selected employee name
        const employeeSelect = document.getElementById('employeeSelect');
        const employeeName = employeeSelect ? employeeSelect.value : task.employee;
        
        // Display task info
        displayTaskInfo(task, employeeName);
        
        // Display status history
        displayStatusHistory(task);
        
        // Show the status history section
        const statusHistorySection = document.getElementById('statusHistorySection');
        if (statusHistorySection) {
            statusHistorySection.style.display = 'block';
            statusHistorySection.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
    } catch (error) {
        console.error('Error viewing task status:', error);
        alert('Failed to load task status. Please try again.');
    }
}

// Display task information
function displayTaskInfo(task, employeeName) {
    const taskInfo = document.getElementById('taskInfo');
    if (!taskInfo) return;
    
    const deadline = task.deadline ? formatDate(task.deadline) : 'No deadline';
    const assignedDate = task.assignedDate || task.createdAt ? formatDate(task.assignedDate || task.createdAt) : 'Unknown';
    
    taskInfo.innerHTML = `
        <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 15px;">
            <div>
                <div style="font-weight: 600; color: #667eea; margin-bottom: 5px; font-size: 0.9em;">Employee</div>
                <div style="color: #333; font-size: 1.1em;">${escapeHtml(employeeName)}</div>
            </div>
            <div>
                <div style="font-weight: 600; color: #667eea; margin-bottom: 5px; font-size: 0.9em;">Task Title</div>
                <div style="color: #333; font-size: 1.1em;">${escapeHtml(task.title || 'Untitled Task')}</div>
            </div>
            <div>
                <div style="font-weight: 600; color: #667eea; margin-bottom: 5px; font-size: 0.9em;">Deadline</div>
                <div style="color: #333; font-size: 1.1em;">${deadline}</div>
            </div>
            <div>
                <div style="font-weight: 600; color: #667eea; margin-bottom: 5px; font-size: 0.9em;">Status</div>
                <div style="color: #333; font-size: 1.1em;">
                    <span class="status-badge status-${(task.status || 'Pending').toLowerCase().replace(' ', '-')}">
                        ${getStatusBadge(task.status || 'Pending')} ${task.status || 'Pending'}
                    </span>
                </div>
            </div>
            <div>
                <div style="font-weight: 600; color: #667eea; margin-bottom: 5px; font-size: 0.9em;">Assigned Date</div>
                <div style="color: #333; font-size: 1.1em;">${assignedDate}</div>
            </div>
        </div>
        ${task.description ? `
            <div style="margin-top: 15px; padding-top: 15px; border-top: 1px solid #ddd;">
                <div style="font-weight: 600; color: #667eea; margin-bottom: 5px; font-size: 0.9em;">Description</div>
                <div style="color: #333; white-space: pre-wrap;">${escapeHtml(task.description)}</div>
            </div>
        ` : ''}
    `;
}

// Display status history
function displayStatusHistory(task) {
    const statusHistoryList = document.getElementById('statusHistoryList');
    const noStatusMessage = document.getElementById('noStatusMessage');
    
    if (!statusHistoryList || !noStatusMessage) return;
    
    // Get status history
    const statusHistory = task.statusHistory || [];
    
    // If no history, check if we have old statusUpdate field
    if (statusHistory.length === 0) {
        const statusUpdate = task.statusUpdate || task.employeeStatus || '';
        if (statusUpdate) {
            // Show the single status update
            statusHistoryList.innerHTML = `
                <div style="background: #e8f4f8; padding: 15px; border-radius: 8px; border-left: 4px solid #667eea; margin-bottom: 15px;">
                    <div style="font-weight: 600; color: #667eea; margin-bottom: 8px; font-size: 0.95em;">Status Update</div>
                    <div style="color: #555; white-space: pre-wrap; margin-bottom: 10px; font-size: 1em;">${escapeHtml(statusUpdate)}</div>
                    <div style="font-size: 0.85em; color: #888; font-style: italic;">
                        ${task.statusUpdatedAt || task.lastUpdatedOn ? formatDate(task.statusUpdatedAt || task.lastUpdatedOn) : 'Unknown date'}
                    </div>
                </div>
            `;
            noStatusMessage.style.display = 'none';
            return;
        }
    }
    
    if (statusHistory.length === 0) {
        statusHistoryList.innerHTML = '';
        noStatusMessage.style.display = 'block';
        return;
    }
    
    // Sort history by date (newest first)
    const sortedHistory = [...statusHistory].sort((a, b) => {
        const dateA = new Date(a.updatedAt);
        const dateB = new Date(b.updatedAt);
        return dateB - dateA;
    });
    
    // Display all status updates
    statusHistoryList.innerHTML = '';
    sortedHistory.forEach((entry, index) => {
        const updateDate = entry.updatedAt ? formatDate(entry.updatedAt) : 'Unknown date';
        const isLatest = index === 0;
        const statusText = entry.statusText || entry.statusUpdate || '';
        
        const entryDiv = document.createElement('div');
        entryDiv.style.cssText = `
            background: ${isLatest ? '#e8f4f8' : '#f5f5f5'};
            padding: 20px;
            border-radius: 8px;
            border-left: 4px solid ${isLatest ? '#667eea' : '#ccc'};
            margin-bottom: 15px;
            box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
        `;
        
        entryDiv.innerHTML = `
            ${isLatest ? '<div style="font-weight: 600; color: #667eea; margin-bottom: 8px; font-size: 0.95em;">⭐ Latest Update</div>' : ''}
            <div style="color: #555; white-space: pre-wrap; margin-bottom: 12px; font-size: 1em; line-height: 1.6;">${escapeHtml(statusText)}</div>
            <div style="font-size: 0.85em; color: #888; font-style: italic; display: flex; align-items: center; gap: 5px;">
                <span>📅</span>
                <span>${updateDate}</span>
            </div>
        `;
        
        statusHistoryList.appendChild(entryDiv);
    });
    
    noStatusMessage.style.display = 'none';
}

// Clear selection
function clearSelection() {
    const employeeSelect = document.getElementById('employeeSelect');
    const taskSelect = document.getElementById('taskSelect');
    const viewStatusBtn = document.getElementById('viewStatusBtn');
    const statusHistorySection = document.getElementById('statusHistorySection');
    
    if (employeeSelect) employeeSelect.value = '';
    if (taskSelect) {
        taskSelect.innerHTML = '<option value="">-- Select Employee First --</option>';
        taskSelect.disabled = true;
    }
    if (viewStatusBtn) viewStatusBtn.disabled = true;
    if (statusHistorySection) statusHistorySection.style.display = 'none';
}

// Helper functions
function formatDate(dateString) {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { 
        year: 'numeric', 
        month: 'short', 
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
    });
}

function escapeHtml(text) {
    if (!text) return '';
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

function getStatusBadge(status) {
    const badges = {
        'Pending': '⏳',
        'Completed': '✅',
        'Carried Forward': '📅'
    };
    return badges[status] || '📋';
}

