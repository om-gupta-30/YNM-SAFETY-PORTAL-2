// View Task Status Page - For Admin

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
    
    // Load employees for filter dropdown
    await loadEmployees();
    
    // Setup filters
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
    
    // Load tasks
    await loadTasks();
});

// Load employees and populate filter dropdown
async function loadEmployees() {
    try {
        if (typeof authAPI === 'undefined' || !authAPI.getEmployees) {
            console.error('Auth API not available');
            return;
        }
        
        const employees = await authAPI.getEmployees();
        console.log('Loaded employees:', employees);
        
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
    } catch (error) {
        console.error('Error loading employees:', error);
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
        
        // Sort by assigned date (newest first)
        tasks.sort((a, b) => new Date(b.assignedDate || b.createdAt) - new Date(a.assignedDate || a.createdAt));
        
        const tbody = document.getElementById('tasksTableBody');
        if (!tbody) return;
        
        tbody.innerHTML = '';
        
        if (tasks.length === 0) {
            tbody.innerHTML = '<tr><td colspan="8" class="no-tasks">No tasks found.</td></tr>';
            return;
        }
        
        tasks.forEach(task => {
            const row = document.createElement('tr');
            const statusUpdate = task.statusUpdate || '';
            const statusUpdatedAt = task.statusUpdatedAt ? formatDate(task.statusUpdatedAt) : '';
            
            row.innerHTML = `
                <td>${task.employee}</td>
                <td>${escapeHtml(task.title)}</td>
                <td>${escapeHtml(task.description)}</td>
                <td>${formatDate(task.deadline)}</td>
                <td><span class="status-badge status-${task.status.toLowerCase().replace(' ', '-')}">${getStatusBadge(task.status)} ${task.status}</span></td>
                <td style="max-width: 300px; word-wrap: break-word;">
                    ${statusUpdate ? `
                        <div style="background: #e8f4f8; padding: 10px; border-radius: 4px; border-left: 3px solid #667eea; margin-bottom: 8px;">
                            <div style="color: #555; white-space: pre-wrap;">${escapeHtml(statusUpdate)}</div>
                        </div>
                    ` : `
                        <div style="color: #999; font-style: italic;">
                            No status update yet
                        </div>
                    `}
                </td>
                <td>
                    ${statusUpdatedAt ? statusUpdatedAt : '-'}
                </td>
                <td>${formatDate(task.assignedDate || task.createdAt)}</td>
            `;
            tbody.appendChild(row);
        });
    } catch (error) {
        console.error('Error loading tasks:', error);
        const tbody = document.getElementById('tasksTableBody');
        if (tbody) {
            tbody.innerHTML = '<tr><td colspan="8" class="no-tasks">Error loading tasks. Please refresh the page.</td></tr>';
        }
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

