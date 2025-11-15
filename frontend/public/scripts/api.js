// API Utility - Centralized API calls for frontend
// API URL is configured in config.js
// If CONFIG is not loaded, fallback to auto-detection
const API_BASE_URL = (() => {
  if (window.CONFIG && window.CONFIG.API_BASE_URL) {
    return window.CONFIG.API_BASE_URL;
  }
  // Fallback: auto-detect
  if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
    return 'http://localhost:5002/api';
  }
  return window.location.origin + '/api';
})();

// Get auth token from localStorage
function getAuthToken() {
  return localStorage.getItem('authToken');
}

// Set auth token
function setAuthToken(token) {
  localStorage.setItem('authToken', token);
}

// Remove auth token
function removeAuthToken() {
  localStorage.removeItem('authToken');
}

// Make authenticated API request
async function apiRequest(endpoint, options = {}) {
  const token = getAuthToken();
  
  const defaultOptions = {
    headers: {
      'Content-Type': 'application/json',
      ...(token && { 'Authorization': `Bearer ${token}` })
    }
  };

  const config = {
    ...defaultOptions,
    ...options,
    headers: {
      ...defaultOptions.headers,
      ...(options.headers || {})
    }
  };

  try {
    const response = await fetch(`${API_BASE_URL}${endpoint}`, config);
    const data = await response.json();

    if (!response.ok) {
      if (response.status === 401) {
        // Unauthorized - clear token and redirect to login
        removeAuthToken();
        window.location.href = 'login.html';
        return null;
      }
      // Preserve duplicate detection response (409 Conflict)
      if (response.status === 409) {
        throw { message: data.message || 'Duplicate entry detected', existing: data.existing, status: 409 };
      }
      throw new Error(data.message || 'API request failed');
    }

    return data;
  } catch (error) {
    console.error('API Error:', error);
    throw error;
  }
}

// Auth API
const authAPI = {
  login: async (username, password) => {
    const response = await apiRequest('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ username, password })
    });
    if (response && response.success) {
      setAuthToken(response.token);
      localStorage.setItem('activeUser', response.user.username);
      localStorage.setItem('userRole', response.user.role);
    }
    return response;
  },
  
  logout: () => {
    removeAuthToken();
    localStorage.removeItem('activeUser');
    localStorage.removeItem('userRole');
  },
  
  getCurrentUser: async () => {
    return await apiRequest('/auth/me');
  },
  
  getEmployees: async () => {
    const response = await apiRequest('/auth/employees');
    return response?.data || [];
  }
};

// Tasks API
const tasksAPI = {
  getAll: async (filters = {}) => {
    const queryParams = new URLSearchParams(filters).toString();
    const endpoint = `/tasks${queryParams ? `?${queryParams}` : ''}`;
    const response = await apiRequest(endpoint);
    // Backend returns array directly
    return Array.isArray(response) ? response : (response?.data || []);
  },
  
  create: async (taskData) => {
    const response = await apiRequest('/tasks', {
      method: 'POST',
      body: JSON.stringify(taskData)
    });
    return response?.data;
  },
  
  update: async (id, taskData) => {
    const response = await apiRequest(`/tasks/${id}`, {
      method: 'PUT',
      body: JSON.stringify(taskData)
    });
    return response?.data;
  },
  
  delete: async (id) => {
    const response = await apiRequest(`/tasks/${id}`, {
      method: 'DELETE'
    });
    return response;
  }
};

// Orders API
const ordersAPI = {
  getAll: async () => {
    const response = await apiRequest('/orders');
    console.log('Orders API raw response:', response);
    // Backend returns array directly
    const result = Array.isArray(response) ? response : (response?.data || []);
    console.log('Orders API processed result:', result);
    return result;
  },
  
  create: async (orderData) => {
    const response = await apiRequest('/orders', {
      method: 'POST',
      body: JSON.stringify(orderData)
    });
    // Backend returns { success: true, data: order }
    return response?.data || response;
  },
  
  delete: async (id) => {
    const response = await apiRequest(`/orders/${id}`, {
      method: 'DELETE'
    });
    if (response && response.success) {
      return response;
    }
    throw new Error(response?.message || 'Failed to delete order');
  }
};

// Manufacturers API
const manufacturersAPI = {
  getAll: async () => {
    const response = await apiRequest('/manufacturers');
    console.log('Manufacturers API raw response:', response);
    // Backend returns array directly
    const result = Array.isArray(response) ? response : (response?.data || []);
    console.log('Manufacturers API processed result:', result);
    return result;
  },
  
  create: async (manufacturerData) => {
    const response = await apiRequest('/manufacturers', {
      method: 'POST',
      body: JSON.stringify(manufacturerData)
    });
    // Backend returns { success: true, data: manufacturer }
    return response?.data || response;
  },
  
  update: async (id, manufacturerData) => {
    const response = await apiRequest(`/manufacturers/${id}`, {
      method: 'PUT',
      body: JSON.stringify(manufacturerData)
    });
    // Backend returns { success: true, data: manufacturer }
    return response?.data || response;
  },
  
  delete: async (id) => {
    const response = await apiRequest(`/manufacturers/${id}`, {
      method: 'DELETE'
    });
    return response;
  }
};

// Products API
const productsAPI = {
  getAll: async () => {
    const response = await apiRequest('/products');
    // Backend returns array directly
    return Array.isArray(response) ? response : (response?.data || []);
  },
  
  create: async (productData) => {
    const response = await apiRequest('/products', {
      method: 'POST',
      body: JSON.stringify(productData)
    });
    return response?.data;
  },
  
  update: async (id, productData) => {
    const response = await apiRequest(`/products/${id}`, {
      method: 'PUT',
      body: JSON.stringify(productData)
    });
    return response?.data;
  },
  
  delete: async (id) => {
    const response = await apiRequest(`/products/${id}`, {
      method: 'DELETE'
    });
    return response;
  }
};

// PDF API
const pdfAPI = {
  extract: async (file, manufacturerList = null) => {
    const formData = new FormData();
    formData.append('pdf', file); // Changed from 'file' to 'pdf' to match backend expectation
    
    if (manufacturerList) {
      formData.append('manufacturer_list', JSON.stringify(manufacturerList));
    }

    const token = getAuthToken();
    
    // DO NOT set Content-Type header - browser will set it automatically with boundary
    const headers = {};
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }
    
    const response = await fetch(`${API_BASE_URL}/orders/extract-pdf`, {
      method: 'POST',
      headers: headers,
      body: formData
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ message: 'PDF extraction failed' }));
      throw new Error(errorData.message || `PDF extraction failed: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();
    return data;
  }
};

// Export API objects
window.authAPI = authAPI;
window.tasksAPI = tasksAPI;
window.ordersAPI = ordersAPI;
window.manufacturersAPI = manufacturersAPI;
window.productsAPI = productsAPI;
window.pdfAPI = pdfAPI;

