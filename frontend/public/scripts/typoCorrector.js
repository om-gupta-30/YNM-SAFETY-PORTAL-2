// Smart Typo Corrector + Auto Suggestion System
// Provides intelligent spelling correction and suggestions based on database values

/**
 * Normalize text for comparison
 * - Trim extra spaces
 * - Convert multiple spaces to single space
 * - Lowercase for comparison (but preserve original case in UI)
 */
function normalizeText(text) {
    if (!text || typeof text !== 'string') return '';
    return text.trim().toLowerCase().replace(/\s+/g, ' ');
}

/**
 * Calculate Levenshtein distance between two strings
 */
function levenshteinDistance(str1, str2) {
    const s1 = normalizeText(str1);
    const s2 = normalizeText(str2);
    
    if (s1 === s2) return 0;
    if (s1.length === 0) return s2.length;
    if (s2.length === 0) return s1.length;
    
    const matrix = [];
    
    for (let i = 0; i <= s2.length; i++) {
        matrix[i] = [i];
    }
    
    for (let j = 0; j <= s1.length; j++) {
        matrix[0][j] = j;
    }
    
    for (let i = 1; i <= s2.length; i++) {
        for (let j = 1; j <= s1.length; j++) {
            if (s2.charAt(i - 1) === s1.charAt(j - 1)) {
                matrix[i][j] = matrix[i - 1][j - 1];
            } else {
                matrix[i][j] = Math.min(
                    matrix[i - 1][j - 1] + 1, // substitution
                    matrix[i][j - 1] + 1,     // insertion
                    matrix[i - 1][j] + 1      // deletion
                );
            }
        }
    }
    
    return matrix[s2.length][s1.length];
}

/**
 * Calculate Jaro similarity between two strings
 */
function jaroSimilarity(str1, str2) {
    const s1 = normalizeText(str1);
    const s2 = normalizeText(str2);
    
    if (s1 === s2) return 1.0;
    if (s1.length === 0 || s2.length === 0) return 0.0;
    
    const matchWindow = Math.floor(Math.max(s1.length, s2.length) / 2) - 1;
    const s1Matches = new Array(s1.length).fill(false);
    const s2Matches = new Array(s2.length).fill(false);
    
    let matches = 0;
    let transpositions = 0;
    
    // Find matches
    for (let i = 0; i < s1.length; i++) {
        const start = Math.max(0, i - matchWindow);
        const end = Math.min(i + matchWindow + 1, s2.length);
        
        for (let j = start; j < end; j++) {
            if (s2Matches[j] || s1[i] !== s2[j]) continue;
            s1Matches[i] = true;
            s2Matches[j] = true;
            matches++;
            break;
        }
    }
    
    if (matches === 0) return 0.0;
    
    // Find transpositions
    let k = 0;
    for (let i = 0; i < s1.length; i++) {
        if (!s1Matches[i]) continue;
        while (!s2Matches[k]) k++;
        if (s1[i] !== s2[k]) transpositions++;
        k++;
    }
    
    const jaro = (
        matches / s1.length +
        matches / s2.length +
        (matches - transpositions / 2) / matches
    ) / 3.0;
    
    return jaro;
}

/**
 * Calculate Jaro-Winkler similarity (preferred for typo correction)
 */
function jaroWinklerSimilarity(str1, str2) {
    const jaro = jaroSimilarity(str1, str2);
    
    if (jaro < 0.7) return jaro;
    
    const s1 = normalizeText(str1);
    const s2 = normalizeText(str2);
    
    let prefix = 0;
    const maxPrefix = Math.min(4, Math.min(s1.length, s2.length));
    
    for (let i = 0; i < maxPrefix; i++) {
        if (s1[i] === s2[i]) {
            prefix++;
        } else {
            break;
        }
    }
    
    return jaro + (0.1 * prefix * (1 - jaro));
}

/**
 * Calculate similarity score using multiple methods
 * Returns the best score (0-1, where 1 is exact match)
 */
function getSimilarity(str1, str2) {
    if (!str1 || !str2) return 0;
    
    const normalized1 = normalizeText(str1);
    const normalized2 = normalizeText(str2);
    
    // Exact match after normalization
    if (normalized1 === normalized2) return 1.0;
    
    // Check if one contains the other
    if (normalized1.includes(normalized2) || normalized2.includes(normalized1)) {
        return 0.95;
    }
    
    // Use Jaro-Winkler (preferred)
    const jaroWinkler = jaroWinklerSimilarity(str1, str2);
    
    // Use Levenshtein as backup
    const maxLen = Math.max(normalized1.length, normalized2.length);
    const distance = levenshteinDistance(str1, str2);
    const levenshteinScore = 1 - (distance / maxLen);
    
    // Return the best score
    return Math.max(jaroWinkler, levenshteinScore);
}

/**
 * Get best matches from a list of valid names
 * Returns array of {value, score} sorted by score descending
 */
function getBestMatches(input, listOfValidNames, maxResults = 5) {
    if (!input || !listOfValidNames || listOfValidNames.length === 0) {
        return [];
    }
    
    const matches = [];
    
    for (const validName of listOfValidNames) {
        const score = getSimilarity(input, validName);
        if (score >= 0.6) { // Only include reasonable matches
            matches.push({
                value: validName,
                score: score
            });
        }
    }
    
    // Sort by score descending
    matches.sort((a, b) => b.score - a.score);
    
    // Return top matches
    return matches.slice(0, maxResults);
}

/**
 * Auto-correct input if confidence is high enough
 * Returns corrected value or original if no good match
 */
function autoCorrect(input, listOfValidNames, threshold = 0.92) {
    if (!input || !listOfValidNames || listOfValidNames.length === 0) {
        return input;
    }
    
    const matches = getBestMatches(input, listOfValidNames, 1);
    
    if (matches.length > 0 && matches[0].score >= threshold) {
        return matches[0].value;
    }
    
    return input; // Return original if no confident match
}

/**
 * Generate suggestions for dropdown
 * Returns array of suggestion strings
 */
function generateSuggestions(input, listOfValidNames, maxSuggestions = 5) {
    if (!input || input.trim().length < 2) {
        return [];
    }
    
    const matches = getBestMatches(input, listOfValidNames, maxSuggestions);
    return matches.map(m => m.value);
}

/**
 * Create and show suggestion dropdown
 */
function showSuggestions(inputElement, suggestions, onSelect) {
    // Remove existing dropdown
    hideSuggestions(inputElement);
    
    if (!suggestions || suggestions.length === 0) {
        return;
    }
    
    const dropdown = document.createElement('div');
    dropdown.className = 'typo-suggestions-dropdown';
    dropdown.style.cssText = `
        position: absolute;
        background: white;
        border: 1px solid #ddd;
        border-radius: 4px;
        box-shadow: 0 4px 12px rgba(0,0,0,0.15);
        max-height: 200px;
        overflow-y: auto;
        z-index: 10000;
        width: 100%;
        margin-top: 2px;
    `;
    
    suggestions.forEach(suggestion => {
        const item = document.createElement('div');
        item.className = 'typo-suggestion-item';
        item.style.cssText = `
            padding: 10px 15px;
            cursor: pointer;
            border-bottom: 1px solid #f0f0f0;
            transition: background 0.2s;
        `;
        item.textContent = suggestion;
        
        item.addEventListener('mouseenter', function() {
            this.style.background = '#f5f5f5';
        });
        
        item.addEventListener('mouseleave', function() {
            this.style.background = 'white';
        });
        
        item.addEventListener('click', function() {
            onSelect(suggestion);
            hideSuggestions(inputElement);
        });
        
        dropdown.appendChild(item);
    });
    
    // Position dropdown relative to input
    const rect = inputElement.getBoundingClientRect();
    const parent = inputElement.offsetParent || document.body;
    const parentRect = parent.getBoundingClientRect();
    
    dropdown.style.top = (rect.bottom - parentRect.top) + 'px';
    dropdown.style.left = (rect.left - parentRect.left) + 'px';
    dropdown.style.width = rect.width + 'px';
    
    // Append to parent or body
    if (parent !== document.body) {
        parent.style.position = 'relative';
        parent.appendChild(dropdown);
    } else {
        document.body.appendChild(dropdown);
    }
    
    // Store reference for cleanup
    inputElement._typoDropdown = dropdown;
    
    // Close on outside click
    const closeHandler = (e) => {
        if (!dropdown.contains(e.target) && e.target !== inputElement) {
            hideSuggestions(inputElement);
            document.removeEventListener('click', closeHandler);
        }
    };
    setTimeout(() => document.addEventListener('click', closeHandler), 100);
}

/**
 * Hide suggestion dropdown
 */
function hideSuggestions(inputElement) {
    if (inputElement._typoDropdown) {
        inputElement._typoDropdown.remove();
        inputElement._typoDropdown = null;
    }
}

/**
 * Setup typo correction for an input field
 */
function setupTypoCorrection(inputElement, getValidList, options = {}) {
    if (!inputElement || typeof getValidList !== 'function') {
        return;
    }
    
    // Don't apply typo correction to select elements - only text inputs
    if (inputElement.tagName === 'SELECT') {
        console.warn('Typo correction should not be applied to select elements');
        return;
    }
    
    const {
        autoCorrectThreshold = 0.92,
        suggestionThreshold = 0.85,
        minLength = 2,
        onCorrect = null,
        onSuggestionSelect = null
    } = options;
    
    let lastValue = inputElement.value;
    let correctionTimeout = null;
    
    inputElement.addEventListener('input', function() {
        const currentValue = this.value.trim();
        
        // Clear previous timeout
        if (correctionTimeout) {
            clearTimeout(correctionTimeout);
        }
        
        // Hide suggestions if input is cleared
        if (currentValue.length === 0) {
            hideSuggestions(this);
            lastValue = currentValue;
            return;
        }
        
        // Wait for user to stop typing (debounce)
        correctionTimeout = setTimeout(async () => {
            if (currentValue.length < minLength) {
                hideSuggestions(this);
                return;
            }
            
            // Get valid list (can be async)
            const validList = await getValidList();
            
            if (!validList || validList.length === 0) {
                hideSuggestions(this);
                return;
            }
            
            // Check if input already matches exactly
            const exactMatch = validList.some(v => 
                normalizeText(v) === normalizeText(currentValue)
            );
            
            if (exactMatch) {
                hideSuggestions(this);
                return;
            }
            
            // Try auto-correction if confidence is high
            const corrected = autoCorrect(currentValue, validList, autoCorrectThreshold);
            
            if (corrected !== currentValue) {
                // High confidence auto-correction
                this.value = corrected;
                lastValue = corrected;
                
                // Trigger input event to update other handlers
                this.dispatchEvent(new Event('input', { bubbles: true }));
                
                // Call onCorrect callback
                if (onCorrect) {
                    onCorrect(corrected, currentValue);
                }
                
                hideSuggestions(this);
                return;
            }
            
            // Generate suggestions for moderate matches
            const suggestions = generateSuggestions(currentValue, validList);
            
            if (suggestions.length > 0) {
                const bestMatch = suggestions[0];
                const bestScore = getSimilarity(currentValue, bestMatch);
                
                if (bestScore >= suggestionThreshold) {
                    showSuggestions(this, suggestions, (selected) => {
                        this.value = selected;
                        lastValue = selected;
                        
                        // Trigger input event
                        this.dispatchEvent(new Event('input', { bubbles: true }));
                        
                        // Call onSuggestionSelect callback
                        if (onSuggestionSelect) {
                            onSuggestionSelect(selected);
                        }
                    });
                } else {
                    hideSuggestions(this);
                }
            } else {
                hideSuggestions(this);
            }
        }, 300); // 300ms debounce
    });
    
    // Hide suggestions on blur (after a short delay to allow click)
    inputElement.addEventListener('blur', function() {
        setTimeout(() => hideSuggestions(this), 200);
    });
}

// Make functions globally accessible
window.normalizeText = normalizeText;
window.getSimilarity = getSimilarity;
window.getBestMatches = getBestMatches;
window.autoCorrect = autoCorrect;
window.generateSuggestions = generateSuggestions;
window.showSuggestions = showSuggestions;
window.hideSuggestions = hideSuggestions;
window.setupTypoCorrection = setupTypoCorrection;

