// Login page functionality - Backend API Authentication Only 

// Check if user is logged in
function isLoggedIn() {
    return !!localStorage.getItem('authToken');
}

// Toggle password visibility
function togglePasswordVisibility(inputId, toggleId) {
    const input = document.getElementById(inputId);
    const toggle = document.getElementById(toggleId);
    
    if (input.type === 'password') {
        input.type = 'text';
        toggle.textContent = '🙈';
    } else {
        input.type = 'password';
        toggle.textContent = '👁️';
    }
}

// Show error message
function showError(message) {
    const errorMessage = document.getElementById('errorMessage');
    const successMessage = document.getElementById('successMessage');
    if (errorMessage) {
        errorMessage.textContent = message;
        errorMessage.classList.add('show');
    }
    if (successMessage) {
        successMessage.classList.remove('show');
    }
}

// Show success message
function showSuccess(message) {
    const errorMessage = document.getElementById('errorMessage');
    const successMessage = document.getElementById('successMessage');
    if (successMessage) {
        successMessage.textContent = message;
        successMessage.classList.add('show');
    }
    if (errorMessage) {
        errorMessage.classList.remove('show');
    }
}

// Hide all messages
function hideMessages() {
    const errorMessage = document.getElementById('errorMessage');
    const successMessage = document.getElementById('successMessage');
    if (errorMessage) {
        errorMessage.classList.remove('show');
    }
    if (successMessage) {
        successMessage.classList.remove('show');
    }
}

// Handle login form submission
document.addEventListener('DOMContentLoaded', function() {
    // If already logged in, redirect to home page
    if (isLoggedIn()) {
        window.location.href = 'index.html';
        return;
    }
    
    const loginForm = document.getElementById('loginForm');
    const loginPasswordToggle = document.getElementById('loginPasswordToggle');
    
    // Password visibility toggle
    if (loginPasswordToggle) {
        loginPasswordToggle.addEventListener('click', function() {
            togglePasswordVisibility('loginPassword', 'loginPasswordToggle');
        });
    }
    
    // Handle login
    if (loginForm) {
        loginForm.addEventListener('submit', async function(e) {
            e.preventDefault();
            
            const username = document.getElementById('loginName').value.trim();
            const password = document.getElementById('loginPassword').value;
            const rememberMe = document.getElementById('rememberMe') ? document.getElementById('rememberMe').checked : false;
            
            hideMessages();
            
            if (!username || !password) {
                showError('Please enter both username and password');
                return;
            }
            
            try {
                // Direct backend API call
                console.log('Attempting login for:', username);
                // Use the same API base URL logic as api.js
                const BASE_URL = "https://ynm-safety-portal-2.onrender.com";
                const PYTHON_URL = "https://ynm-safety-portal-2-1.onrender.com";
                const API_BASE_URL = (() => {
                    if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
                        return 'http://localhost:5002/api';
                    }
                    return BASE_URL + '/api';
                })();
                const response = await fetch(`${API_BASE_URL}/auth/login`, {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ username, password })
                });

                console.log('Response status:', response.status, response.statusText);
                const result = await response.json();
                console.log('Response data:', result);

                // Check if response was successful
                if (response.ok && result.success && result.token) {
                    console.log('Login successful! User role:', result.user?.role);
                    // Store authentication token and user info
                    localStorage.setItem("authToken", result.token);
                    localStorage.setItem("activeUser", result.user?.username || username);
                    localStorage.setItem("userRole", result.user?.role || "employee");
                    localStorage.setItem("sessionActive", "true");
                    
                    if (rememberMe) {
                        localStorage.setItem("rememberMe", "true");
                    } else {
                        localStorage.removeItem("rememberMe");
                    }

                    // Redirect to homepage after login
                    console.log('Login successful! Redirecting to homepage');
                    window.location.href = "index.html";
                } else {
                    // Handle error response
                    const errorMessage = result.message || "Invalid credentials. Please check your username and password.";
                    console.error('Login failed:', { status: response.status, result });
                    showError(errorMessage);
                }
            } catch (error) {
                console.error('Login error:', error);
                showError('Login failed. Please check your connection. Error: ' + error.message);
            }
        });
    }
});
