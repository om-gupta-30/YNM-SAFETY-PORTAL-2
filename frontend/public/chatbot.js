// AI Chatbot Component for YNM Safety Portal

// Initialize chatbot
function initChatbot() {
    // Create chatbot container if it doesn't exist
    let chatbotContainer = document.getElementById('chatbotContainer');
    if (!chatbotContainer) {
        chatbotContainer = document.createElement('div');
        chatbotContainer.id = 'chatbotContainer';
        chatbotContainer.innerHTML = `
            <div id="chatbotPanel" class="chatbot-panel hidden">
                <div class="chatbot-header">
                    <h3>🤖 AI Assistant</h3>
                    <button id="closeChatbot" class="chatbot-close-btn">&times;</button>
                </div>
                <div id="chatbotMessages" class="chatbot-messages">
                    <div class="chatbot-message bot-message">
                        <div class="message-content">
                            Hello! I'm your AI assistant for YNM Safety Portal. I can help you with questions about products, manufacturers, orders, tasks, and transport. How can I assist you today?
                        </div>
                    </div>
                </div>
                <div class="chatbot-input-container">
                    <input 
                        type="text" 
                        id="chatbotInput" 
                        class="chatbot-input" 
                        placeholder="Type your question here..."
                        autocomplete="off"
                    />
                    <button id="chatbotSendBtn" class="chatbot-send-btn">Send</button>
                </div>
            </div>
            <button id="chatbotToggleBtn" class="chatbot-toggle-btn" title="Open AI Chatbot">
                💬
            </button>
        `;
        document.body.appendChild(chatbotContainer);
        
        // Setup event listeners
        setupChatbotListeners();
    }
}

// Setup chatbot event listeners
function setupChatbotListeners() {
    const toggleBtn = document.getElementById('chatbotToggleBtn');
    const closeBtn = document.getElementById('closeChatbot');
    const sendBtn = document.getElementById('chatbotSendBtn');
    const input = document.getElementById('chatbotInput');
    const panel = document.getElementById('chatbotPanel');
    
    // Toggle chatbot panel
    if (toggleBtn) {
        toggleBtn.addEventListener('click', () => {
            if (panel) {
                panel.classList.toggle('hidden');
                if (!panel.classList.contains('hidden')) {
                    input.focus();
                }
            }
        });
    }
    
    // Close chatbot
    if (closeBtn) {
        closeBtn.addEventListener('click', () => {
            if (panel) {
                panel.classList.add('hidden');
            }
        });
    }
    
    // Send message
    const sendMessage = async () => {
        if (!input || !input.value.trim() || sendBtn.disabled) return;
        
        const question = input.value.trim();
        input.value = '';
        sendBtn.disabled = true;
        
        // Add user message
        addMessage(question, 'user');
        
        // Show loading
        const loadingId = addLoadingMessage();
        
        try {
            const token = localStorage.getItem('authToken');
            if (!token) {
                throw new Error('Not authenticated. Please log in.');
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
            const response = await fetch(`${API_BASE_URL}/chatbot/ask`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({ question: question })
            });
            
            const data = await response.json();
            
            // Remove loading message
            removeMessage(loadingId);
            
            if (response.ok && data.success) {
                addMessage(data.answer, 'bot');
            } else {
                // Show the error message from backend
                const errorMsg = data.answer || data.message || 'Sorry, I encountered an error. Please try again.';
                addMessage(errorMsg, 'bot');
                console.error('Chatbot API error:', { status: response.status, data });
            }
        } catch (error) {
            removeMessage(loadingId);
            console.error('Chatbot network error:', error);
            
            // Check if it's a network error
            if (error.message && error.message.includes('fetch')) {
                addMessage('Unable to connect to the server. Please check your internet connection and try again.', 'bot');
            } else {
                addMessage('Sorry, I encountered an error. Please try again. Make sure you are logged in.', 'bot');
            }
        } finally {
            sendBtn.disabled = false;
            input.focus();
        }
    };
    
    if (sendBtn) {
        sendBtn.addEventListener('click', sendMessage);
    }
    
    if (input) {
        input.addEventListener('keypress', (e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                sendMessage();
            }
        });
    }
}

// Add message to chat
function addMessage(text, type) {
    const messagesContainer = document.getElementById('chatbotMessages');
    if (!messagesContainer) return null;
    
    const messageDiv = document.createElement('div');
    const messageId = 'msg-' + Date.now() + '-' + Math.random().toString(36).substr(2, 9);
    messageDiv.id = messageId;
    messageDiv.className = `chatbot-message ${type}-message`;
    
    const contentDiv = document.createElement('div');
    contentDiv.className = 'message-content';
    contentDiv.textContent = text;
    messageDiv.appendChild(contentDiv);
    
    messagesContainer.appendChild(messageDiv);
    messagesContainer.scrollTop = messagesContainer.scrollHeight;
    
    return messageId;
}

// Add loading message
function addLoadingMessage() {
    const messagesContainer = document.getElementById('chatbotMessages');
    if (!messagesContainer) return null;
    
    const messageDiv = document.createElement('div');
    const messageId = 'loading-' + Date.now();
    messageDiv.id = messageId;
    messageDiv.className = 'chatbot-message bot-message';
    
    const loadingDiv = document.createElement('div');
    loadingDiv.className = 'message-content chatbot-loading';
    loadingDiv.innerHTML = '<span></span><span></span><span></span>';
    messageDiv.appendChild(loadingDiv);
    
    messagesContainer.appendChild(messageDiv);
    messagesContainer.scrollTop = messagesContainer.scrollHeight;
    
    return messageId;
}

// Remove message
function removeMessage(messageId) {
    if (!messageId) return;
    const message = document.getElementById(messageId);
    if (message) {
        message.remove();
    }
}

// Toggle chatbot panel (called from navigation button)
function toggleChatbotPanel() {
    const panel = document.getElementById('chatbotPanel');
    const input = document.getElementById('chatbotInput');
    
    if (!panel) {
        // If chatbot not initialized yet, initialize it first
        initChatbot();
        setTimeout(() => {
            const newPanel = document.getElementById('chatbotPanel');
            const newInput = document.getElementById('chatbotInput');
            if (newPanel) {
                newPanel.classList.remove('hidden');
                if (newInput) {
                    newInput.focus();
                }
            }
        }, 100);
    } else {
        panel.classList.toggle('hidden');
        if (!panel.classList.contains('hidden') && input) {
            input.focus();
        }
    }
}

// Initialize chatbot when DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initChatbot);
} else {
    initChatbot();
}

// Make functions globally accessible
window.initChatbot = initChatbot;
window.toggleChatbotPanel = toggleChatbotPanel;

