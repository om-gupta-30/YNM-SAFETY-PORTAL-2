// Check if user is logged in, redirect to login if not
function checkLogin() {
    const token = localStorage.getItem('authToken');
    
    if (!token) {
        window.location.href = 'login.html';
        return false;
    }
    
    // Ensure session is active
    if (!localStorage.getItem('sessionActive')) {
        localStorage.setItem('sessionActive', 'true');
    }
    
    return true;
}

// Get current user name
function getCurrentUser() {
    return localStorage.getItem('activeUser') || '';
}

// Display user greeting
function displayUserGreeting() {
    const greetingElement = document.getElementById('userGreeting');
    if (greetingElement) {
        const userName = getCurrentUser();
        const greetings = [
            `Welcome, ${userName} 👋`,
            `Welcome back, ${userName} 👋`,
            `Hey ${userName}, good to see you!`
        ];
        const randomGreeting = greetings[Math.floor(Math.random() * greetings.length)];
        greetingElement.textContent = randomGreeting;
    }
}

// Handle logout - centralized function
function handleLogout(e) {
    // Prevent any default behavior
    if (e) {
        e.preventDefault();
        e.stopPropagation();
    }
    
    // Clear all authentication data
    localStorage.removeItem('sessionActive');
    localStorage.removeItem('activeUser');
    localStorage.removeItem('rememberMe');
    localStorage.removeItem('authToken');
    localStorage.removeItem('userRole');
    
    // Redirect to login page
    window.location.href = 'login.html';
}

// Make handleLogout globally accessible
window.handleLogout = handleLogout;

// Update total orders count from API
async function updateTotalOrders() {
    try {
        const ordersValueElement = document.getElementById('totalOrdersValue');
        if (ordersValueElement && typeof ordersAPI !== 'undefined') {
            const orders = await ordersAPI.getAll();
            ordersValueElement.textContent = orders.length;
        } else if (ordersValueElement) {
            ordersValueElement.textContent = '0';
        }
    } catch (error) {
        console.error('Error updating total orders:', error);
        const ordersValueElement = document.getElementById('totalOrdersValue');
        if (ordersValueElement) {
            ordersValueElement.textContent = '0';
        }
    }
}

// Update total products count from API
async function updateTotalProducts() {
    try {
        const productsValueElement = document.getElementById('totalProductsValue');
        if (productsValueElement && typeof productsAPI !== 'undefined') {
            const products = await productsAPI.getAll();
            productsValueElement.textContent = products.length;
        } else if (productsValueElement) {
            productsValueElement.textContent = '0';
        }
    } catch (error) {
        console.error('Error updating total products:', error);
        const productsValueElement = document.getElementById('totalProductsValue');
        if (productsValueElement) {
            productsValueElement.textContent = '0';
        }
    }
}

// Update total manufacturers count from API
async function updateTotalManufacturers() {
    try {
        const manufacturersValueElement = document.getElementById('totalManufacturersValue');
        if (manufacturersValueElement && typeof manufacturersAPI !== 'undefined') {
            const manufacturers = await manufacturersAPI.getAll();
            // Count unique manufacturers
            const uniqueManufacturers = new Set(manufacturers.map(m => m.Manufacturer_Name));
            manufacturersValueElement.textContent = uniqueManufacturers.size;
        } else if (manufacturersValueElement) {
            manufacturersValueElement.textContent = '0';
        }
    } catch (error) {
        console.error('Error updating total manufacturers:', error);
        const manufacturersValueElement = document.getElementById('totalManufacturersValue');
        if (manufacturersValueElement) {
            manufacturersValueElement.textContent = '0';
        }
    }
}

// Navigation function - routes to respective pages (defined before DOMContentLoaded)
function navigateToPage(page) {
    if (!page) {
        console.error('No page specified for navigation');
        return;
    }
    
    // Map page names to HTML files
    const pageMap = {
        'dashboard': 'dashboard.html',
        'products': 'products.html',
        'manufacturers': 'manufacturers.html',
        'transport': 'transport.html',
        'orders': 'orders.html',
        'tasks': 'tasks.html'
    };
    
    const pageFile = pageMap[page];
    if (pageFile) {
        console.log('Redirecting to:', pageFile); // Debug log
        window.location.href = pageFile;
    } else {
        console.error(`Page "${page}" not found in pageMap`);
        alert(`Navigation error: Page "${page}" not found.`);
    }
}

// Make navigateToPage globally accessible
window.navigateToPage = navigateToPage;

// Navigation handler - ready for page routing
document.addEventListener('DOMContentLoaded', function() {
    // Check if user is logged in
    if (!checkLogin()) {
        return; // Redirect to login page
    }
    
    // Display user greeting
    displayUserGreeting();
    
    // Show/hide role-based buttons
    const userRole = localStorage.getItem('userRole');
    const employeeUpdateStatusCard = document.getElementById('employeeUpdateStatusCard');
    const adminTaskStatusCard = document.getElementById('adminTaskStatusCard');
    
    if (userRole === 'employee' && employeeUpdateStatusCard) {
        employeeUpdateStatusCard.style.cssText = 'cursor: pointer; display: flex !important;';
    }
    if (userRole === 'admin' && adminTaskStatusCard) {
        adminTaskStatusCard.style.cssText = 'cursor: pointer; display: flex !important;';
    }
    
    // Setup logout button
    const logoutBtn = document.getElementById('logoutBtn');
    if (logoutBtn) {
        logoutBtn.addEventListener('click', function(e) {
            e.preventDefault();
            e.stopPropagation();
            handleLogout(e);
        });
        // Prevent any default button behavior
        logoutBtn.type = 'button';
    }
    
    // Update counts on page load
    updateTotalOrders();
    updateTotalProducts();
    updateTotalManufacturers();
    
    // Update counts when page becomes visible (user returns from other pages)
    document.addEventListener('visibilitychange', function() {
        if (!document.hidden) {
            updateTotalOrders();
            updateTotalProducts();
            updateTotalManufacturers();
        }
    });
    
    // Also update on focus (when user switches back to this tab)
    window.addEventListener('focus', function() {
        updateTotalOrders();
        updateTotalProducts();
        updateTotalManufacturers();
    });
    
    // Listen for storage changes (when products/manufacturers are added in other tabs)
    window.addEventListener('storage', function(e) {
        if (e.key === 'products' || e.key === 'totalProducts') {
            updateTotalProducts();
        }
        if (e.key === 'manufacturers' || e.key === 'totalManufacturers') {
            updateTotalManufacturers();
        }
        if (e.key === 'orders') {
            updateTotalOrders();
        }
    });
    
    // Set up navigation cards
    const navCards = document.querySelectorAll('.nav-card');
    
    navCards.forEach(card => {
        // Skip if card already has onclick handler (like tasks card)
        if (card.hasAttribute('onclick')) {
            return;
        }
        
        card.addEventListener('click', function(e) {
            e.preventDefault();
            e.stopPropagation();
            const page = this.getAttribute('data-page');
            console.log('Navigating to page:', page); // Debug log
            if (page) {
                navigateToPage(page);
            }
        });
    });
});

