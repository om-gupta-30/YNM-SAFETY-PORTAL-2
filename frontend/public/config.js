// Configuration file for API endpoints
// This file can be easily updated for deployment

const CONFIG = {
  // API Base URL - automatically detects environment
  API_BASE_URL: (() => {
    // Development: Use localhost
    if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
      return 'http://localhost:5002/api';
    }
    
    // Production: Use your deployed backend URL
    // IMPORTANT: When deploying to Render, replace the URL below with your Render backend URL
    // Example: 'https://ynm-backend.onrender.com/api'
    
    // For separate deployments (Vercel frontend + Render backend):
    // Uncomment the line below and replace with your Render backend URL
    // return 'https://your-backend-name.onrender.com/api';
    
    // For same-domain deployment (if frontend and backend are on same domain):
    return window.location.origin + '/api';
  })()
};

// Make it globally accessible
window.CONFIG = CONFIG;

