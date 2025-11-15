// Backend Validation Middleware

const VALID_UNITS = ['m', 'meter', 'metre', 'ft', 'feet', 'kg', 'litre', 'ltr', 'unit', 'pcs'];

/**
 * Validate phone number - must be exactly 10 digits
 */
const validatePhone = (phone) => {
    if (!phone || typeof phone !== 'string') {
        return { valid: false, message: 'Phone number is required' };
    }
    
    const cleaned = phone.replace(/[\s\-\(\)]/g, '');
    
    if (!/^[0-9]{10}$/.test(cleaned)) {
        return { valid: false, message: 'Phone number must be exactly 10 digits' };
    }
    
    return { valid: true, message: '' };
};

/**
 * Validate unit - must be one of the allowed units
 */
const validateUnit = (unit) => {
    if (!unit || typeof unit !== 'string') {
        return { valid: false, message: 'Unit is required' };
    }
    
    const unitLower = unit.toLowerCase().trim();
    
    if (!VALID_UNITS.includes(unitLower)) {
        return { valid: false, message: `Invalid unit. Allowed: ${VALID_UNITS.join(', ')}` };
    }
    
    return { valid: true, message: '' };
};

/**
 * Validate name/text field
 */
const validateName = (text, fieldName = 'Field', maxLength = 160) => {
    if (!text || typeof text !== 'string') {
        return { valid: false, message: `${fieldName} is required` };
    }
    
    const trimmed = text.trim();
    
    if (trimmed.length === 0) {
        return { valid: false, message: `${fieldName} cannot be empty` };
    }
    
    if (trimmed.length > maxLength) {
        return { valid: false, message: `${fieldName} must be ${maxLength} characters or less` };
    }
    
    if (!/^[A-Za-z0-9\s\-\(\)\.,]+$/.test(trimmed)) {
        return { valid: false, message: `Invalid format. ${fieldName} can only contain letters, numbers, spaces, and limited punctuation` };
    }
    
    return { valid: true, message: '' };
};

/**
 * Validate numeric value
 */
const validateNumeric = (value, fieldName = 'Field', allowZero = false, min = null) => {
    if (value === null || value === undefined || value === '') {
        return { valid: false, message: `${fieldName} is required` };
    }
    
    const numValue = typeof value === 'string' ? parseFloat(value) : value;
    
    if (isNaN(numValue)) {
        return { valid: false, message: `${fieldName} must be a valid number` };
    }
    
    const minValue = min !== null ? min : (allowZero ? 0 : 0.01);
    
    if (numValue < minValue) {
        return { valid: false, message: `${fieldName} must be ${allowZero ? '0 or' : ''} greater than ${minValue}` };
    }
    
    return { valid: true, message: '', numericValue: numValue };
};

/**
 * Validate location string
 */
const validateLocation = (location) => {
    if (!location || typeof location !== 'string') {
        return { valid: false, message: 'Location is required' };
    }
    
    const trimmed = location.trim();
    
    if (trimmed.length === 0) {
        return { valid: false, message: 'Location cannot be empty' };
    }
    
    if (trimmed.length > 160) {
        return { valid: false, message: 'Location must be 160 characters or less' };
    }
    
    return { valid: true, message: '' };
};

/**
 * Validate username
 */
const validateUsername = (username) => {
    if (!username || typeof username !== 'string') {
        return { valid: false, message: 'Username is required' };
    }
    
    const trimmed = username.trim();
    
    if (trimmed.length === 0) {
        return { valid: false, message: 'Username cannot be empty' };
    }
    
    if (trimmed.length > 50) {
        return { valid: false, message: 'Username must be 50 characters or less' };
    }
    
    if (!/^[A-Za-z0-9\s\-_]+$/.test(trimmed)) {
        return { valid: false, message: 'Username can only contain letters, numbers, spaces, dashes, and underscores' };
    }
    
    return { valid: true, message: '' };
};

/**
 * Validation middleware factory
 */
const validate = (validations) => {
    return (req, res, next) => {
        const errors = [];
        
        for (const [field, validationFn] of Object.entries(validations)) {
            const value = req.body[field];
            const result = validationFn(value);
            
            if (!result.valid) {
                errors.push(result.message);
            }
        }
        
        if (errors.length > 0) {
            return res.status(400).json({ 
                success: false, 
                message: 'Validation failed', 
                errors: errors 
            });
        }
        
        next();
    };
};

module.exports = {
    validatePhone,
    validateUnit,
    validateName,
    validateNumeric,
    validateLocation,
    validateUsername,
    validate,
    VALID_UNITS
};

