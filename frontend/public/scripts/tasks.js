// Unified Task Management System (Admin & Employee)

// Check if user is logged in
function checkLogin() {
    const token = localStorage.getItem('authToken');
    
    if (!token) {
        window.location.href = 'login.html';
        return false;
    }
    
    return true;
}

// Get user role from localStorage (set during login)
function getUserRole() {
    const userRole = localStorage.getItem('userRole');
    if (userRole) {
        return userRole;
    }
    // Fallback: check activeUser name
    const activeUser = localStorage.getItem('activeUser');
    return activeUser === 'Admin' ? 'admin' : 'employee';
}

// Get all tasks from API
async function getTasks() {
    try {
        if (typeof tasksAPI !== 'undefined') {
            const tasks = await tasksAPI.getAll();
            return { tasks: tasks || [] };
        }
        return { tasks: [] };
    } catch (error) {
        console.error('Error fetching tasks:', error);
        return { tasks: [] };
    }
}

// Save tasks - now handled via API
function saveTasks(tasksData) {
    // Tasks are now stored in database via API
    // This function kept for compatibility
}

// Check and update carried forward tasks - handled by backend
async function updateCarriedForwardTasks() {
    // Backend automatically updates carried forward tasks
    // This function kept for compatibility but does nothing
}

// Get current employee name
function getCurrentEmployee() {
    return localStorage.getItem('activeUser');
}

// Initialize page
document.addEventListener('DOMContentLoaded', async function() {
    try {
        if (!checkLogin()) return;
        
        const role = getUserRole();
        const activeUser = getCurrentEmployee();
        
        // Update carried forward tasks on page load (handled by backend)
        await updateCarriedForwardTasks();
        
        // Set greeting
        const greetingEl = document.getElementById('userGreeting');
        if (greetingEl) {
            greetingEl.textContent = `Hey, ${activeUser} 👋`;
        }
        
        // Show appropriate dashboard based on role
        const adminDashboard = document.getElementById('adminDashboard');
        const employeeDashboard = document.getElementById('employeeDashboard');
        const pageTitle = document.getElementById('pageTitle');
        
        if (role === 'admin') {
            if (adminDashboard) adminDashboard.style.display = 'block';
            if (employeeDashboard) employeeDashboard.style.display = 'none';
            if (pageTitle) pageTitle.textContent = 'Admin Dashboard - Task Management';
            
            // Initialize admin dashboard
            initAdminDashboard();
        } else {
            if (adminDashboard) adminDashboard.style.display = 'none';
            if (employeeDashboard) employeeDashboard.style.display = 'block';
            if (pageTitle) pageTitle.textContent = 'My Tasks';
            
            // Initialize employee dashboard
            initEmployeeDashboard();
        }
        
        // Setup logout button (common for both)
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
    } catch (error) {
        console.error('Error initializing tasks page:', error);
        alert('Error loading tasks page. Please check console for details.');
    }
});

// ==================== ADMIN DASHBOARD FUNCTIONS ====================

async function initAdminDashboard() {
    // Set today's date as minimum for deadline input
    const today = new Date().toISOString().split('T')[0];
    const deadlineInput = document.getElementById('deadlineInput');
    if (deadlineInput) deadlineInput.min = today;
    
    // Load employees for dropdowns
    await loadEmployees();
    
    // Load and display tasks
    await loadAdminTasks();
    await updateAdminStatistics();
    
    // Setup event listeners
    setupAdminEventListeners();
}

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

function setupAdminEventListeners() {
    // Task form submission
    document.getElementById('taskForm').addEventListener('submit', function(e) {
        e.preventDefault();
        assignTask();
    });
    
    // Edit task form submission
    document.getElementById('editTaskForm').addEventListener('submit', function(e) {
        e.preventDefault();
        saveEditedTask();
    });
    
    // Filter changes
    document.getElementById('filterEmployee').addEventListener('change', loadAdminTasks);
    document.getElementById('filterStatus').addEventListener('change', loadAdminTasks);
    document.getElementById('clearFilters').addEventListener('click', function() {
        document.getElementById('filterEmployee').value = '';
        document.getElementById('filterStatus').value = '';
        loadAdminTasks();
    });
    
    // Modal close
    const modal = document.getElementById('editTaskModal');
    const closeBtn = document.querySelector('.close-modal');
    const cancelBtn = document.getElementById('cancelEdit');
    
    closeBtn.addEventListener('click', function() {
        modal.style.display = 'none';
    });
    
    cancelBtn.addEventListener('click', function() {
        modal.style.display = 'none';
    });
    
    window.addEventListener('click', function(e) {
        if (e.target === modal) {
            modal.style.display = 'none';
        }
    });
}

async function assignTask() {
    const employee = document.getElementById('employeeSelect').value;
    const title = document.getElementById('taskTitleInput').value.trim();
    const description = document.getElementById('taskDescriptionInput').value.trim();
    const deadline = document.getElementById('deadlineInput').value;
    
    if (!employee || !title || !description || !deadline) {
        alert('Please fill in all required fields.');
        return;
    }
    
    try {
        await tasksAPI.create({
            employee: employee,
            title: title,
            description: description,
            deadline: deadline
        });
        
        // Reset form
        document.getElementById('taskForm').reset();
        
        // Reload tasks and update statistics
        await loadAdminTasks();
        await updateAdminStatistics();
        
        // Show success message
        alert('Task assigned successfully!');
    } catch (error) {
        console.error('Error assigning task:', error);
        alert('Failed to assign task. Please try again.');
    }
}

async function loadAdminTasks() {
    try {
        const filterEmployee = document.getElementById('filterEmployee')?.value || '';
        const filterStatus = document.getElementById('filterStatus')?.value || '';
        
        const filters = {};
        if (filterEmployee) filters.employee = filterEmployee;
        if (filterStatus) filters.status = filterStatus;
        
        const tasks = await tasksAPI.getAll(filters);
        
    // Sort by assigned date (newest first)
        tasks.sort((a, b) => new Date(b.assignedDate || b.createdAt) - new Date(a.assignedDate || a.createdAt));
        
        const tbody = document.getElementById('tasksTableBody');
        if (!tbody) return;
        
        tbody.innerHTML = '';
        
        if (tasks.length === 0) {
            tbody.innerHTML = '<tr><td colspan="7" class="no-tasks">No tasks found.</td></tr>';
            await updateAdminStatistics();
            return;
        }
        
        tasks.forEach(task => {
            const row = document.createElement('tr');
            const taskId = task._id || task.id;
            row.innerHTML = `
                <td>${task.employee}</td>
                <td>${escapeHtml(task.title)}</td>
                <td>${escapeHtml(task.description)}</td>
                <td>${formatDate(task.deadline)}</td>
                <td><span class="status-badge status-${task.status.toLowerCase().replace(' ', '-')}">${getStatusBadge(task.status)} ${task.status}</span></td>
                <td>${formatDate(task.assignedDate || task.createdAt)}</td>
                <td>
                    <button class="action-btn edit-btn" onclick="editTask('${taskId}')">Edit</button>
                    <button class="action-btn delete-btn" onclick="deleteTask('${taskId}')" title="Delete Task">🗑️ Delete</button>
                </td>
            `;
            tbody.appendChild(row);
        });
        
        await updateAdminStatistics();
    } catch (error) {
        console.error('Error loading admin tasks:', error);
        const tbody = document.getElementById('tasksTableBody');
        if (tbody) {
            tbody.innerHTML = '<tr><td colspan="7" class="no-tasks">Error loading tasks. Please refresh the page.</td></tr>';
        }
    }
}

async function editTask(taskId) {
    try {
        const tasks = await tasksAPI.getAll();
        const task = tasks.find(t => (t._id || t.id) === taskId);
        
        if (!task) {
            alert('Task not found.');
            return;
        }
        
        // Populate edit form
        document.getElementById('editTaskId').value = task._id || task.id;
        document.getElementById('editEmployeeSelect').value = task.employee;
        document.getElementById('editTaskTitleInput').value = task.title;
        document.getElementById('editTaskDescriptionInput').value = task.description;
        document.getElementById('editDeadlineInput').value = task.deadline;
        document.getElementById('editStatusSelect').value = task.status;
        
        // Show modal
        document.getElementById('editTaskModal').style.display = 'block';
    } catch (error) {
        console.error('Error loading task for edit:', error);
        alert('Failed to load task. Please try again.');
    }
}

async function saveEditedTask() {
    const taskId = document.getElementById('editTaskId').value;
    const employee = document.getElementById('editEmployeeSelect').value;
    const title = document.getElementById('editTaskTitleInput').value.trim();
    const description = document.getElementById('editTaskDescriptionInput').value.trim();
    const deadline = document.getElementById('editDeadlineInput').value;
    const status = document.getElementById('editStatusSelect').value;
    
    if (!employee || !title || !description || !deadline) {
        alert('Please fill in all required fields.');
        return;
    }
    
    try {
        await tasksAPI.update(taskId, {
            employee: employee,
            title: title,
            description: description,
            deadline: deadline,
            status: status
        });
        
        // Close modal
        document.getElementById('editTaskModal').style.display = 'none';
        
        // Reload tasks and update statistics
        await loadAdminTasks();
        await updateAdminStatistics();
        
        alert('Task updated successfully!');
    } catch (error) {
        console.error('Error updating task:', error);
        alert('Failed to update task. Please try again.');
    }
}

async function deleteTask(taskId) {
    // Security check: Only Admin can delete tasks
    const role = getUserRole();
    if (role !== 'admin') {
        alert('❌ Access Denied: Only administrators can delete tasks.');
        return;
    }
    
    // Show confirmation popup
    if (!confirm('Are you sure you want to delete this task?\n\nThis action cannot be undone.')) {
        return;
    }
    
    try {
        await tasksAPI.delete(taskId);
        
        // Reload tasks and update statistics
        await loadAdminTasks();
        await updateAdminStatistics();
        
        alert('✅ Task deleted successfully!');
    } catch (error) {
        console.error('Error deleting task:', error);
        alert('Failed to delete task. Please try again.');
    }
}

async function updateAdminStatistics() {
    try {
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
        console.error('Error updating admin statistics:', error);
    }
}

// ==================== EMPLOYEE DASHBOARD FUNCTIONS ====================

async function initEmployeeDashboard() {
    // Load and display tasks
    await loadEmployeeTasks();
    await updateEmployeeStatistics();
}

async function loadEmployeeTasks() {
    try {
        const employee = getCurrentEmployee();
        
        // Get tasks for current employee (backend filters by employee)
        const myTasks = await tasksAPI.getAll({ employee: employee });
        
        const today = new Date().toISOString().split('T')[0];
        
        // Separate tasks by category
        // Today's Tasks: tasks due today or in the future, not completed
        const todayTasks = myTasks.filter(task => 
            task.deadline >= today && task.status !== 'Completed' && task.status !== 'Carried Forward'
        );
        
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
        
        await updateEmployeeStatistics();
    } catch (error) {
        console.error('Error loading employee tasks:', error);
        displayTasks('todayTasks', [], 'Error loading tasks. Please refresh the page.');
    }
}

function displayTasks(containerId, tasks, emptyMessage) {
    const container = document.getElementById(containerId);
    container.innerHTML = '';
    
    if (tasks.length === 0) {
        container.innerHTML = `<p class="no-tasks">${emptyMessage}</p>`;
        return;
    }
    
    tasks.forEach(task => {
        const taskCard = document.createElement('div');
        taskCard.className = 'task-card';
        
        const isOverdue = task.deadline < new Date().toISOString().split('T')[0] && task.status !== 'Completed';
        const overdueClass = isOverdue ? 'overdue' : '';
        
        taskCard.innerHTML = `
            <div class="task-card-header">
                <h3 class="${overdueClass}">${escapeHtml(task.title)}</h3>
                <span class="status-badge status-${task.status.toLowerCase().replace(' ', '-')}">
                    ${getStatusBadge(task.status)} ${task.status}
                </span>
            </div>
            <p class="task-description">${escapeHtml(task.description)}</p>
            <div class="task-card-footer">
                <div class="task-meta">
                    <span><strong>Deadline:</strong> ${formatDate(task.deadline)}</span>
                    <span><strong>Assigned:</strong> ${formatDate(task.assignedDate)}</span>
                </div>
                ${task.status !== 'Completed' ? `
                    <button class="complete-btn" onclick="markTaskComplete('${task._id || task.id}')">
                        Mark as Complete
                    </button>
                ` : ''}
            </div>
        `;
        
        container.appendChild(taskCard);
    });
}

async function markTaskComplete(taskId) {
    if (!confirm('Mark this task as completed?')) return;
    
    try {
        await tasksAPI.update(taskId, { status: 'Completed' });
        
        // Reload tasks and update statistics
        await loadEmployeeTasks();
        await updateEmployeeStatistics();
        
        alert('Task marked as completed!');
    } catch (error) {
        console.error('Error marking task complete:', error);
        alert('Failed to mark task as completed. Please try again.');
    }
}

async function updateEmployeeStatistics() {
    try {
        const employee = getCurrentEmployee();
        const myTasks = await tasksAPI.getAll({ employee: employee });
        
        const total = myTasks.length;
        const pending = myTasks.filter(t => t.status === 'Pending').length;
        const completed = myTasks.filter(t => t.status === 'Completed').length;
        const carriedForward = myTasks.filter(t => t.status === 'Carried Forward').length;
        
        const totalEl = document.getElementById('empTotalTasksCount');
        const pendingEl = document.getElementById('empPendingTasksCount');
        const completedEl = document.getElementById('empCompletedTasksCount');
        const carriedForwardEl = document.getElementById('empCarriedForwardCount');
        
        if (totalEl) totalEl.textContent = total;
        if (pendingEl) pendingEl.textContent = pending;
        if (completedEl) completedEl.textContent = completed;
        if (carriedForwardEl) carriedForwardEl.textContent = carriedForward;
    } catch (error) {
        console.error('Error updating employee statistics:', error);
    }
}

function toggleCompletedTasks() {
    const completedTasks = document.getElementById('completedTasks');
    const toggle = document.getElementById('completedToggle');
    
    if (completedTasks.style.display === 'none') {
        completedTasks.style.display = 'block';
        toggle.textContent = '▲';
    } else {
        completedTasks.style.display = 'none';
        toggle.textContent = '▼';
    }
}

// ==================== HELPER FUNCTIONS ====================

function formatDate(dateString) {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
}

function escapeHtml(text) {
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
window.markTaskComplete = markTaskComplete;
window.toggleCompletedTasks = toggleCompletedTasks;

