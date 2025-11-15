// Update Task Status Page - For Employees

// Check if user is logged in and is employee
function checkEmployeeAccess() {
    const token = localStorage.getItem('authToken');
    const userRole = localStorage.getItem('userRole');
    
    if (!token) {
        window.location.href = 'login.html';
        return false;
    }
    
    if (userRole === 'admin') {
        window.location.href = 'index.html';
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
    
    // Load tasks for dropdown
    await loadTasks();
    
    // Setup form submission
    const form = document.getElementById('updateStatusForm');
    if (form) {
        form.addEventListener('submit', async function(e) {
            e.preventDefault();
            await submitStatusUpdate();
        });
    }
});

// Load tasks for dropdown
async function loadTasks() {
    try {
        if (typeof tasksAPI === 'undefined') {
            console.error('Tasks API not loaded');
            return;
        }
        
        const employee = getCurrentEmployee();
        const tasks = await tasksAPI.getAll({ employee: employee });
        
        const taskSelect = document.getElementById('taskSelect');
        if (!taskSelect) return;
        
        // Clear existing options except the first one
        taskSelect.innerHTML = '<option value="">-- Select a task --</option>';
        
        // Add only incomplete and carried forward tasks (not completed)
        tasks.forEach(task => {
            // Only show tasks that are not completed
            if (task.status !== 'Completed') {
                const option = document.createElement('option');
                option.value = task._id || task.id;
                const taskTitle = task.title || 'Untitled Task';
                const deadline = task.deadline ? formatDate(task.deadline) : 'No deadline';
                const status = task.status || 'Pending';
                option.textContent = `${taskTitle} (Deadline: ${deadline}, Status: ${status})`;
                taskSelect.appendChild(option);
            }
        });
        
        // If no tasks available after filtering
        if (taskSelect.options.length === 1) {
            const option = document.createElement('option');
            option.value = '';
            option.textContent = 'No incomplete tasks available';
            option.disabled = true;
            taskSelect.appendChild(option);
        }
    } catch (error) {
        console.error('Error loading tasks:', error);
        alert('Failed to load tasks. Please refresh the page.');
    }
}

// Submit status update
async function submitStatusUpdate() {
    const taskSelect = document.getElementById('taskSelect');
    const textarea = document.getElementById('statusTextarea');
    
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
        const response = await fetch(`${API_BASE_URL}/tasks/${selectedTaskId}/status`, {
            method: 'PATCH',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({ statusUpdate: statusText })
        });
        
        const data = await response.json();
        
        if (!response.ok) {
            throw new Error(data.message || 'Failed to update task status');
        }
        
        // Show success message
        alert('✅ Status updated successfully!');
        
        // Clear form
        taskSelect.value = '';
        textarea.value = '';
        
        // Reload tasks to show updated status
        await loadTasks();
    } catch (error) {
        console.error('Error updating task status:', error);
        alert('Failed to save status update: ' + (error.message || 'Please try again.'));
    }
}

// Helper function
function formatDate(dateString) {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
}

