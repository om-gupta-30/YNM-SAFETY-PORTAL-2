const Manufacturer = require('../models/Manufacturer');
const Product = require('../models/Product');
const Order = require('../models/Order');
const Task = require('../models/Task');
const Location = require('../models/Location');
const OpenAI = require('openai');

// Initialize OpenAI client
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
});

// Check if API key is available
if (!process.env.OPENAI_API_KEY) {
  console.error('WARNING: OPENAI_API_KEY is not set in environment variables!');
}

// Rate limiting: Track requests per user (by IP or user ID)
const requestTracker = new Map();
const RATE_LIMIT = {
  maxRequests: 10, // Max requests per window
  windowMs: 60 * 1000, // 1 minute window
  cooldownMs: 5 * 60 * 1000 // 5 minute cooldown after limit exceeded
};

// Database context caching (refresh every 5 minutes)
let cachedContext = null;
let contextCacheTime = null;
const CONTEXT_CACHE_TTL = 5 * 60 * 1000; // 5 minutes

// Check rate limit
function checkRateLimit(identifier) {
  const now = Date.now();
  const userRequests = requestTracker.get(identifier) || { requests: [], blockedUntil: null };

  // Check if user is in cooldown period
  if (userRequests.blockedUntil && now < userRequests.blockedUntil) {
    const remainingSeconds = Math.ceil((userRequests.blockedUntil - now) / 1000);
    return {
      allowed: false,
      message: `Rate limit exceeded. Please wait ${remainingSeconds} seconds before trying again.`
    };
  }

  // Clear old requests outside the window
  userRequests.requests = userRequests.requests.filter(
    timestamp => now - timestamp < RATE_LIMIT.windowMs
  );

  // Check if limit exceeded
  if (userRequests.requests.length >= RATE_LIMIT.maxRequests) {
    userRequests.blockedUntil = now + RATE_LIMIT.cooldownMs;
    requestTracker.set(identifier, userRequests);
    return {
      allowed: false,
      message: `Rate limit exceeded. Maximum ${RATE_LIMIT.maxRequests} requests per minute. Please wait ${RATE_LIMIT.cooldownMs / 1000} seconds.`
    };
  }

  // Add current request
  userRequests.requests.push(now);
  requestTracker.set(identifier, userRequests);

  return { allowed: true };
}

// Safety filter keywords - questions must contain at least one of these
const ALLOWED_KEYWORDS = [
  'product', 'products', 'manufacturer', 'manufacturers', 'company', 'companies',
  'order', 'orders', 'purchase', 'purchases', 'task', 'tasks', 'assignment',
  'transport', 'route', 'routes', 'location', 'locations', 'city', 'cities',
  'price', 'pricing', 'cost', 'costs', 'ynm', 'safety', 'portal', 'barrier',
  'crash', 'paint', 'thermoplastic', 'signage', 'signages', 'employee', 'admin',
  'quantity', 'delivery', 'shipment', 'supplier', 'suppliers'
];

// Check if question is related to YNM Safety Portal
function isQuestionRelevant(question) {
  if (!question || typeof question !== 'string') return false;
  
  const normalized = question.toLowerCase();
  return ALLOWED_KEYWORDS.some(keyword => normalized.includes(keyword));
}

// Fetch and summarize database data (with caching)
async function getDatabaseContext() {
  const now = Date.now();
  
  // Return cached context if still valid
  if (cachedContext && contextCacheTime && (now - contextCacheTime) < CONTEXT_CACHE_TTL) {
    console.log('Using cached database context');
    return cachedContext;
  }

  try {
    console.log('Fetching fresh database context...');
    const manufacturers = await Manufacturer.find().lean();
    const products = await Product.find().lean();
    const orders = await Order.find().lean().sort({ createdAt: -1 }).limit(20); // Reduced from 50 to 20
    const tasks = await Task.find().lean().sort({ createdAt: -1 }).limit(20); // Reduced from 50 to 20
    const locations = await Location.find().lean();

    const contextData = {
      products: products.map(p => ({
        name: p.name,
        subtypes: p.subtypes,
        unit: p.unit,
        notes: p.notes
      })),
      manufacturers: manufacturers.map(m => ({
        name: m.name,
        location: m.location,
        contact: m.contact,
        productsOffered: m.productsOffered
      })),
      orders: orders.map(o => ({
        manufacturer: o.manufacturer,
        product: o.product,
        productType: o.productType,
        quantity: o.quantity,
        fromLocation: o.fromLocation,
        toLocation: o.toLocation,
        transportCost: o.transportCost,
        productCost: o.productCost,
        totalCost: o.totalCost,
        createdAt: o.createdAt
      })),
      tasks: tasks.map(t => ({
        taskText: t.taskText,
        assignedTo: t.assignedTo,
        date: t.date,
        status: t.status,
        statusUpdate: t.statusUpdate || '',
        createdAt: t.createdAt
      })),
      locations: locations.map(l => ({
        locationId: l.Location_ID,
        city: l.City,
        state: l.State,
        latitude: l.latitude,
        longitude: l.longitude
      }))
    };

    // Cache the context
    cachedContext = contextData;
    contextCacheTime = now;
    console.log('Database context cached');

    return contextData;
  } catch (error) {
    console.error('Error fetching database context:', error);
    // Return cached context if available, even if expired
    if (cachedContext) {
      console.log('Using expired cache due to error');
      return cachedContext;
    }
    return {
      products: [],
      manufacturers: [],
      orders: [],
      tasks: [],
      locations: []
    };
  }
}

// Main chatbot handler
exports.askQuestion = async (req, res) => {
  try {
    const { question } = req.body;

    // Validate input
    if (!question || typeof question !== 'string' || question.trim().length === 0) {
      return res.status(400).json({
        success: false,
        answer: 'Please provide a valid question.'
      });
    }

    const trimmedQuestion = question.trim();

    // Rate limiting: Use user ID if available, otherwise use IP address
    const userIdentifier = req.user?.id || req.ip || 'anonymous';
    const rateLimitCheck = checkRateLimit(userIdentifier);
    
    if (!rateLimitCheck.allowed) {
      console.log(`Rate limit exceeded for user: ${userIdentifier}`);
      return res.status(429).json({
        success: false,
        answer: rateLimitCheck.message
      });
    }

    // Safety filter - check if question is relevant
    if (!isQuestionRelevant(trimmedQuestion)) {
      return res.status(200).json({
        success: true,
        answer: 'I can only answer questions related to YNM Safety Portal data such as products, manufacturers, orders, tasks, and transport.'
      });
    }

    // Fetch database context
    const dbContext = await getDatabaseContext();
    
    // Limit context size to avoid token limits (reduced to save costs)
    const contextString = JSON.stringify(dbContext, null, 2);
    const maxContextLength = 4000; // Reduced from 8000 to 4000 to save tokens
    
    let finalContext = contextString;
    if (contextString.length > maxContextLength) {
      // Truncate if too large, but keep structure
      finalContext = contextString.substring(0, maxContextLength) + '... (truncated)';
      console.log(`Context truncated from ${contextString.length} to ${maxContextLength} characters`);
    }

    // Log usage for monitoring
    console.log(`[Chatbot] Request from ${userIdentifier}: "${trimmedQuestion.substring(0, 50)}..." | Context size: ${finalContext.length} chars`);

    // Create system prompt
    const systemPrompt = `You are the official AI assistant for YNM Safety Portal. 
You ONLY answer questions using the database information provided in the context below. 
DO NOT hallucinate any manufacturers, products, orders, or tasks that do not exist in the data.
If information is missing or not found in the context, say: "No matching data found in the system."
If the question is unrelated to YNM Safety Portal operations, politely refuse.
Always be helpful, concise, and accurate based on the provided data.

Database Context:
${finalContext}`;

    // Check if API key exists
    if (!process.env.OPENAI_API_KEY) {
      console.error('OpenAI API key is missing!');
      return res.status(500).json({
        success: false,
        answer: 'AI service is not configured. Please contact the administrator.'
      });
    }

    // Call OpenAI API
    try {
      console.log('Calling OpenAI API with question:', trimmedQuestion.substring(0, 50) + '...');
      
      const completion = await openai.chat.completions.create({
        model: 'gpt-3.5-turbo', // Using gpt-3.5-turbo - cheapest model for free tier users
        messages: [
          {
            role: 'system',
            content: systemPrompt
          },
          {
            role: 'user',
            content: trimmedQuestion
          }
        ],
        temperature: 0.7,
        max_tokens: 300 // Reduced from 500 to 300 to save tokens
      });

      const answer = completion.choices[0]?.message?.content || 'Sorry, I could not generate a response.';
      const tokensUsed = completion.usage?.total_tokens || 0;
      const estimatedCost = (tokensUsed * 0.000002).toFixed(6); // gpt-3.5-turbo pricing
      
      console.log(`[Chatbot] Response received | Tokens: ${tokensUsed} | Est. cost: $${estimatedCost}`);

      res.status(200).json({
        success: true,
        answer: answer
      });

    } catch (openaiError) {
      // Log full error details for debugging
      console.error('=== OpenAI API Error ===');
      console.error('Error message:', openaiError.message);
      console.error('Error status:', openaiError.status);
      console.error('Error code:', openaiError.code);
      console.error('Error type:', openaiError.type);
      console.error('Error response:', openaiError.response?.data);
      console.error('Full error:', JSON.stringify(openaiError, null, 2));
      console.error('======================');
      
      // Handle API key errors
      if (openaiError.status === 401 || openaiError.code === 'invalid_api_key' || 
          (openaiError.response && openaiError.response.status === 401)) {
        return res.status(500).json({
          success: false,
          answer: 'AI service authentication failed. The API key may be invalid or expired. Please contact the administrator.'
        });
      }

      // Handle quota exceeded (different from rate limits)
      if (openaiError.code === 'insufficient_quota' || 
          (openaiError.response && openaiError.response.data && 
           openaiError.response.data.error && 
           openaiError.response.data.error.code === 'insufficient_quota') ||
          (openaiError.message && openaiError.message.includes('exceeded your current quota'))) {
        return res.status(429).json({
          success: false,
          answer: 'The AI service quota has been exceeded. Please check your OpenAI account billing and add credits, or contact the administrator to resolve this issue.'
        });
      }

      // Handle rate limits (temporary, can retry)
      if (openaiError.status === 429 || openaiError.code === 'rate_limit_exceeded' ||
          (openaiError.response && openaiError.response.status === 429 && 
           openaiError.code !== 'insufficient_quota')) {
        return res.status(429).json({
          success: false,
          answer: 'AI service is currently busy due to rate limits. Please wait a moment and try again.'
        });
      }

      // Handle network errors
      if (openaiError.code === 'ECONNREFUSED' || openaiError.code === 'ETIMEDOUT' || 
          openaiError.message?.includes('fetch failed')) {
        return res.status(500).json({
          success: false,
          answer: 'Unable to connect to AI service. Please check your internet connection and try again.'
        });
      }

      // Handle model not found or other API errors
      if (openaiError.response && openaiError.response.data) {
        const errorData = openaiError.response.data;
        if (errorData.error && errorData.error.message) {
          return res.status(500).json({
            success: false,
            answer: `AI service error: ${errorData.error.message}. Please try again.`
          });
        }
      }

      // Generic error - show actual error message for debugging
      const errorMsg = openaiError.message || 'Unknown error occurred';
      console.error('Returning generic error:', errorMsg);
      return res.status(500).json({
        success: false,
        answer: `Sorry, I encountered an error: ${errorMsg}. Please check the server logs for more details.`
      });
    }

  } catch (error) {
    console.error('Chatbot controller error:', error);
    res.status(500).json({
      success: false,
      answer: 'Sorry, I encountered an error processing your question. Please try again.'
    });
  }
};

