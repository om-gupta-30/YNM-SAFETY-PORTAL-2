// Duplicate Entry Prevention AI - Reusable Utility
// Provides fuzzy matching and duplicate detection across the application

/**
 * Normalize text for comparison
 * - Convert to lowercase
 * - Remove extra spaces
 * - Normalize common symbols/abbreviations
 */
function normalizeText(text) {
    if (!text || typeof text !== 'string') return '';
    
    let normalized = text.trim().toLowerCase();
    
    // Remove extra spaces
    normalized = normalized.replace(/\s+/g, ' ');
    
    // Normalize common symbols and abbreviations
    const normalizations = {
        'ft\\.': 'ft',
        'feet': 'ft',
        'mtr': 'meter',
        'mtrs': 'meter',
        'metre': 'meter',
        'kg\\.': 'kg',
        'kgs': 'kg',
        'kilogram': 'kg',
        'pcs': 'piece',
        'pcs\\.': 'piece',
        'pieces': 'piece',
        'ltr': 'litre',
        'ltrs': 'litre',
        'liters': 'litre',
        'unit\\.': 'unit',
        'units': 'unit'
    };
    
    for (const [pattern, replacement] of Object.entries(normalizations)) {
        const regex = new RegExp(`\\b${pattern}\\b`, 'gi');
        normalized = normalized.replace(regex, replacement);
    }
    
    return normalized;
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
 * Calculate fuzzy match score (0-1, where 1 is exact match)
 */
function fuzzyMatch(str1, str2) {
    if (!str1 || !str2) return 0;
    
    const normalized1 = normalizeText(str1);
    const normalized2 = normalizeText(str2);
    
    // Exact match after normalization
    if (normalized1 === normalized2) return 1.0;
    
    // Check if one contains the other
    if (normalized1.includes(normalized2) || normalized2.includes(normalized1)) {
        return 0.9;
    }
    
    // Calculate Levenshtein distance
    const maxLength = Math.max(normalized1.length, normalized2.length);
    if (maxLength === 0) return 1.0;
    
    const distance = levenshteinDistance(str1, str2);
    const similarity = 1 - (distance / maxLength);
    
    // If distance is small (≤2), boost similarity
    if (distance <= 2 && maxLength > 2) {
        return Math.max(similarity, 0.85);
    }
    
    return similarity;
}

/**
 * Check if a product is duplicate
 */
function isDuplicateProduct(newProduct, existingProducts) {
    if (!newProduct || !existingProducts || existingProducts.length === 0) {
        return { isDuplicate: false, match: null, score: 0 };
    }
    
    const newName = normalizeText(newProduct.Product_Name || newProduct.name || '');
    const newSubType = normalizeText(newProduct.Sub_Type || newProduct.subtype || '');
    
    for (const existing of existingProducts) {
        const existingName = normalizeText(existing.Product_Name || existing.name || '');
        const existingSubType = normalizeText(existing.Sub_Type || existing.subtype || '');
        
        // Check if product name matches
        const nameScore = fuzzyMatch(newName, existingName);
        
        // If same product name, check subtype
        if (nameScore >= 0.85) {
            if (newSubType && existingSubType) {
                const subtypeScore = fuzzyMatch(newSubType, existingSubType);
                if (subtypeScore >= 0.85) {
                    return {
                        isDuplicate: true,
                        match: existing,
                        score: (nameScore + subtypeScore) / 2,
                        reason: `Product "${existing.Product_Name || existing.name}" with subtype "${existing.Sub_Type || existing.subtype}" already exists`
                    };
                }
            } else if (nameScore >= 0.95) {
                // Very high name match even without subtype
                return {
                    isDuplicate: true,
                    match: existing,
                    score: nameScore,
                    reason: `Product "${existing.Product_Name || existing.name}" already exists`
                };
            }
        }
    }
    
    return { isDuplicate: false, match: null, score: 0 };
}

/**
 * Check if a manufacturer entry is duplicate
 */
function isDuplicateManufacturer(newEntry, existingManufacturers) {
    if (!newEntry || !existingManufacturers || existingManufacturers.length === 0) {
        return { isDuplicate: false, match: null, score: 0 };
    }
    
    const newName = normalizeText(newEntry.Manufacturer_Name || newEntry.name || '');
    const newProduct = normalizeText(newEntry.Product_Name || newEntry.productName || '');
    const newProductType = normalizeText(newEntry.Product_Type || newEntry.productType || '');
    
    for (const existing of existingManufacturers) {
        const existingName = normalizeText(existing.Manufacturer_Name || existing.name || '');
        
        // Check manufacturer name match
        const nameScore = fuzzyMatch(newName, existingName);
        
        if (nameScore >= 0.85) {
            // Same manufacturer, check if same product + productType combination
            const existingProduct = normalizeText(existing.Product_Name || existing.name || '');
            const existingProductType = normalizeText(existing.Product_Type || existing.productType || '');
            
            const productScore = fuzzyMatch(newProduct, existingProduct);
            const productTypeScore = fuzzyMatch(newProductType, existingProductType);
            
            if (productScore >= 0.85 && productTypeScore >= 0.85) {
                return {
                    isDuplicate: true,
                    match: existing,
                    score: (nameScore + productScore + productTypeScore) / 3,
                    reason: `Manufacturer "${existing.Manufacturer_Name || existing.name}" already has product "${existing.Product_Name || existing.name}" with type "${existing.Product_Type || existing.productType}"`
                };
            } else if (nameScore >= 0.95) {
                // Very high manufacturer name match
                return {
                    isDuplicate: true,
                    match: existing,
                    score: nameScore,
                    reason: `Manufacturer "${existing.Manufacturer_Name || existing.name}" already exists`
                };
            }
        }
    }
    
    return { isDuplicate: false, match: null, score: 0 };
}

/**
 * Check if an order is duplicate
 */
function isDuplicateOrder(newOrder, existingOrders) {
    if (!newOrder || !existingOrders || existingOrders.length === 0) {
        return { isDuplicate: false, match: null, score: 0 };
    }
    
    const newManufacturer = normalizeText(newOrder.manufacturer || newOrder.manufacturerName || '');
    const newProduct = normalizeText(newOrder.product || newOrder.productName || '');
    const newProductType = normalizeText(newOrder.productType || '');
    const newQuantity = parseFloat(newOrder.quantity) || 0;
    const newFromLocation = normalizeText(newOrder.fromLocation || '');
    const newToLocation = normalizeText(newOrder.toLocation || '');
    
    for (const existing of existingOrders) {
        const existingManufacturer = normalizeText(existing.manufacturer || existing.manufacturerName || '');
        const existingProduct = normalizeText(existing.product || existing.productName || '');
        const existingProductType = normalizeText(existing.productType || '');
        const existingQuantity = parseFloat(existing.quantity) || 0;
        const existingFromLocation = normalizeText(existing.fromLocation || '');
        const existingToLocation = normalizeText(existing.toLocation || '');
        
        // All fields must match
        const manufacturerScore = fuzzyMatch(newManufacturer, existingManufacturer);
        const productScore = fuzzyMatch(newProduct, existingProduct);
        const productTypeScore = fuzzyMatch(newProductType, existingProductType);
        const quantityMatch = Math.abs(newQuantity - existingQuantity) < 0.01; // Allow small floating point differences
        const fromLocationScore = fuzzyMatch(newFromLocation, existingFromLocation);
        const toLocationScore = fuzzyMatch(newToLocation, existingToLocation);
        
        if (manufacturerScore >= 0.85 && 
            productScore >= 0.85 && 
            productTypeScore >= 0.85 && 
            quantityMatch && 
            fromLocationScore >= 0.85 && 
            toLocationScore >= 0.85) {
            
            const avgScore = (manufacturerScore + productScore + productTypeScore + fromLocationScore + toLocationScore) / 5;
            
            return {
                isDuplicate: true,
                match: existing,
                score: avgScore,
                reason: `An identical order already exists: ${existing.manufacturer || existing.manufacturerName} - ${existing.product || existing.productName} (${existing.productType})`
            };
        }
    }
    
    return { isDuplicate: false, match: null, score: 0 };
}

/**
 * Check if a task is duplicate
 */
function isDuplicateTask(newTask, existingTasks) {
    if (!newTask || !existingTasks || existingTasks.length === 0) {
        return { isDuplicate: false, match: null, score: 0 };
    }
    
    const newTitle = normalizeText(newTask.title || newTask.taskText || '');
    const newEmployee = normalizeText(newTask.employee || newTask.assignedTo || '');
    const newDate = newTask.deadline || newTask.date;
    
    // Normalize date to compare only date part (ignore time)
    const newDateStr = newDate ? new Date(newDate).toISOString().split('T')[0] : '';
    
    for (const existing of existingTasks) {
        const existingTitle = normalizeText(existing.title || existing.taskText || '');
        const existingEmployee = normalizeText(existing.employee || existing.assignedTo || '');
        const existingDate = existing.deadline || existing.date;
        const existingDateStr = existingDate ? new Date(existingDate).toISOString().split('T')[0] : '';
        
        const titleScore = fuzzyMatch(newTitle, existingTitle);
        const employeeMatch = newEmployee === existingEmployee;
        const dateMatch = newDateStr === existingDateStr;
        
        if (titleScore >= 0.85 && employeeMatch && dateMatch) {
            return {
                isDuplicate: true,
                match: existing,
                score: titleScore,
                reason: `A similar task "${existing.title || existing.taskText}" is already assigned to ${existing.employee || existing.assignedTo} on ${existingDateStr}`
            };
        }
    }
    
    return { isDuplicate: false, match: null, score: 0 };
}

/**
 * Show duplicate warning popup
 * Returns a promise that resolves to user's choice: 'view', 'cancel', or 'proceed'
 */
function showDuplicateWarning(duplicateInfo, entryType = 'entry') {
    return new Promise((resolve) => {
        // Create modal overlay
        const overlay = document.createElement('div');
        overlay.style.cssText = 'position: fixed; top: 0; left: 0; width: 100%; height: 100%; background: rgba(0,0,0,0.5); z-index: 10000; display: flex; align-items: center; justify-content: center;';
        
        // Create modal content
        const modal = document.createElement('div');
        modal.style.cssText = 'background: white; padding: 30px; border-radius: 12px; max-width: 500px; width: 90%; box-shadow: 0 4px 20px rgba(0,0,0,0.3);';
        
        const match = duplicateInfo.match;
        const reason = duplicateInfo.reason || 'A similar entry already exists.';
        const score = (duplicateInfo.score * 100).toFixed(0);
        
        modal.innerHTML = `
            <div style="text-align: center; margin-bottom: 20px;">
                <div style="font-size: 48px; margin-bottom: 10px;">⚠️</div>
                <h2 style="margin: 0; color: #d32f2f; font-size: 24px;">Possible Duplicate Detected</h2>
            </div>
            
            <div style="background: #fff3cd; border: 1px solid #ffc107; border-radius: 8px; padding: 15px; margin-bottom: 20px;">
                <p style="margin: 0; color: #856404; font-weight: 500;">${reason}</p>
                <p style="margin: 5px 0 0 0; color: #856404; font-size: 0.9em;">Similarity: ${score}%</p>
            </div>
            
            ${match ? `
                <div style="background: #f5f5f5; border-radius: 8px; padding: 15px; margin-bottom: 20px; max-height: 200px; overflow-y: auto;">
                    <strong style="display: block; margin-bottom: 8px; color: #333;">Existing Entry Details:</strong>
                    <pre style="margin: 0; font-size: 0.9em; color: #666; white-space: pre-wrap; word-wrap: break-word;">${JSON.stringify(match, null, 2)}</pre>
                </div>
            ` : ''}
            
            <div style="display: flex; gap: 10px; justify-content: flex-end; margin-top: 25px;">
                <button id="duplicateCancelBtn" class="duplicate-btn-cancel" style="padding: 10px 20px; background: #6c757d; color: white; border: none; border-radius: 6px; cursor: pointer; font-size: 14px; font-weight: 500;">
                    Cancel
                </button>
                <button id="duplicateViewBtn" class="duplicate-btn-view" style="padding: 10px 20px; background: #667eea; color: white; border: none; border-radius: 6px; cursor: pointer; font-size: 14px; font-weight: 500;">
                    View Existing Entry
                </button>
                <button id="duplicateProceedBtn" class="duplicate-btn-proceed" style="padding: 10px 20px; background: #dc3545; color: white; border: none; border-radius: 6px; cursor: pointer; font-size: 14px; font-weight: 500;">
                    Proceed Anyway
                </button>
            </div>
        `;
        
        overlay.appendChild(modal);
        document.body.appendChild(overlay);
        
        // Button handlers
        document.getElementById('duplicateCancelBtn').addEventListener('click', () => {
            document.body.removeChild(overlay);
            resolve('cancel');
        });
        
        document.getElementById('duplicateViewBtn').addEventListener('click', () => {
            document.body.removeChild(overlay);
            resolve('view');
        });
        
        document.getElementById('duplicateProceedBtn').addEventListener('click', () => {
            document.body.removeChild(overlay);
            resolve('proceed');
        });
        
        // Close on overlay click
        overlay.addEventListener('click', (e) => {
            if (e.target === overlay) {
                document.body.removeChild(overlay);
                resolve('cancel');
            }
        });
        
        // Close on Escape key
        const handleEscape = (e) => {
            if (e.key === 'Escape') {
                document.body.removeChild(overlay);
                document.removeEventListener('keydown', handleEscape);
                resolve('cancel');
            }
        };
        document.addEventListener('keydown', handleEscape);
    });
}

// Make functions globally accessible
window.normalizeText = normalizeText;
window.fuzzyMatch = fuzzyMatch;
window.levenshteinDistance = levenshteinDistance;
window.isDuplicateProduct = isDuplicateProduct;
window.isDuplicateManufacturer = isDuplicateManufacturer;
window.isDuplicateOrder = isDuplicateOrder;
window.isDuplicateTask = isDuplicateTask;
window.showDuplicateWarning = showDuplicateWarning;

