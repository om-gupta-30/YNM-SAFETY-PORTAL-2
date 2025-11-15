// Global Validation Functions - Used across entire application

// Valid units list
const VALID_UNITS = ['m', 'meter', 'metre', 'ft', 'feet', 'kg', 'litre', 'ltr', 'unit', 'pcs'];

/**
 * Validate phone number - must be exactly 10 digits
 * @param {string} phone - Phone number to validate
 * @returns {object} - { valid: boolean, message: string }
 */
function validatePhone(phone) {
    if (!phone || typeof phone !== 'string') {
        return { valid: false, message: 'Phone number is required' };
    }
    
    // Remove any spaces or dashes
    const cleaned = phone.replace(/[\s\-\(\)]/g, '');
    
    // Check if it's exactly 10 digits
    if (!/^[0-9]{10}$/.test(cleaned)) {
        if (cleaned.length < 10) {
            return { valid: false, message: 'Phone number must be exactly 10 digits' };
        } else if (cleaned.length > 10) {
            return { valid: false, message: 'Phone number must be exactly 10 digits (too many digits)' };
        } else {
            return { valid: false, message: 'Phone number must contain only digits (0-9)' };
        }
    }
    
    return { valid: true, message: '' };
}

/**
 * Validate unit - must be one of the allowed units
 * @param {string} unit - Unit to validate
 * @returns {object} - { valid: boolean, message: string }
 */
function validateUnit(unit) {
    if (!unit || typeof unit !== 'string') {
        return { valid: false, message: 'Unit is required' };
    }
    
    const unitLower = unit.toLowerCase().trim();
    
    if (!VALID_UNITS.includes(unitLower)) {
        return { 
            valid: false, 
            message: `Invalid unit. Please select a valid measurement unit. Allowed: ${VALID_UNITS.join(', ')}` 
        };
    }
    
    return { valid: true, message: '' };
}

/**
 * Validate name/text field - max 160 chars, alphanumeric + spaces + limited punctuation
 * @param {string} text - Text to validate
 * @param {string} fieldName - Name of the field (for error messages)
 * @param {number} maxLength - Maximum length (default 160)
 * @returns {object} - { valid: boolean, message: string }
 */
function validateName(text, fieldName = 'Field', maxLength = 160) {
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
    
    // Allow alphanumeric + spaces + limited punctuation: dash, parentheses, comma, period
    if (!/^[A-Za-z0-9\s\-\(\)\.,]+$/.test(trimmed)) {
        return { valid: false, message: `Invalid format. ${fieldName} can only contain letters, numbers, spaces, and limited punctuation (dash, parentheses, comma, period)` };
    }
    
    return { valid: true, message: '' };
}

/**
 * Validate length of text
 * @param {string} text - Text to validate
 * @param {number} maxLength - Maximum length
 * @param {string} fieldName - Name of the field
 * @returns {object} - { valid: boolean, message: string }
 */
function validateLength(text, maxLength, fieldName = 'Field') {
    if (!text || typeof text !== 'string') {
        return { valid: false, message: `${fieldName} is required` };
    }
    
    if (text.length > maxLength) {
        return { valid: false, message: `${fieldName} must be ${maxLength} characters or less` };
    }
    
    return { valid: true, message: '' };
}

/**
 * Validate numeric value
 * @param {string|number} value - Value to validate
 * @param {string} fieldName - Name of the field
 * @param {boolean} allowZero - Whether zero is allowed
 * @param {number} min - Minimum value (default 0 if allowZero is false, else 0)
 * @returns {object} - { valid: boolean, message: string, numericValue: number }
 */
function validateNumeric(value, fieldName = 'Field', allowZero = false, min = null) {
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
}

/**
 * Validate location string
 * @param {string} location - Location to validate
 * @returns {object} - { valid: boolean, message: string }
 */
function validateLocation(location) {
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
}

/**
 * Show error message in UI
 * @param {string} message - Error message to display
 * @param {HTMLElement} container - Container element to show error in
 */
function showValidationError(message, container) {
    if (!container) return;
    
    // Remove existing error
    const existingError = container.querySelector('.validation-error');
    if (existingError) {
        existingError.remove();
    }
    
    // Create error element
    const errorDiv = document.createElement('div');
    errorDiv.className = 'validation-error';
    errorDiv.style.cssText = 'background: #fee; border: 1px solid #fcc; color: #c33; padding: 10px; border-radius: 4px; margin: 10px 0; font-size: 14px;';
    errorDiv.textContent = message;
    
    // Insert error
    container.insertBefore(errorDiv, container.firstChild);
    
    // Scroll to error
    errorDiv.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
}

/**
 * Remove validation error
 * @param {HTMLElement} container - Container element
 */
function removeValidationError(container) {
    if (!container) return;
    const existingError = container.querySelector('.validation-error');
    if (existingError) {
        existingError.remove();
    }
}

/**
 * Validate form and show errors
 * @param {HTMLElement} form - Form element
 * @param {object} validations - Object with field names and validation functions
 * @returns {boolean} - True if form is valid
 */
function validateForm(form, validations) {
    if (!form) return false;
    
    let isValid = true;
    const formContainer = form.closest('.form-container') || form.parentElement;
    
    // Remove all existing errors
    removeValidationError(formContainer);
    
    // Validate each field
    for (const [fieldName, validationFn] of Object.entries(validations)) {
        const field = form.querySelector(`[name="${fieldName}"], #${fieldName}`);
        if (!field) continue;
        
        const result = validationFn(field.value);
        
        if (!result.valid) {
            isValid = false;
            showValidationError(result.message, formContainer);
            
            // Highlight field
            field.style.borderColor = '#c33';
            field.addEventListener('input', function clearError() {
                field.style.borderColor = '';
                field.removeEventListener('input', clearError);
            }, { once: true });
        } else {
            field.style.borderColor = '';
        }
    }
    
    return isValid;
}

// Make functions globally accessible
window.validatePhone = validatePhone;
window.validateUnit = validateUnit;
window.validateName = validateName;
window.validateLength = validateLength;
window.validateNumeric = validateNumeric;
window.validateLocation = validateLocation;
window.showValidationError = showValidationError;
window.removeValidationError = removeValidationError;
window.validateForm = validateForm;
window.VALID_UNITS = VALID_UNITS;

