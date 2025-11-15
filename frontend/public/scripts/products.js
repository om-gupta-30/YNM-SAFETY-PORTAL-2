// Products page functionality
let allProducts = [];
let filteredProducts = [];
let currentSort = 'name-asc'; // Default sort

// Embedded CSV data (works without server)
const csvData = `Product_ID,Product_Name,Sub_Type,Unit,Notes
P001,W Beam Crash Barrier,W-Beam,Meter,Standard crash barrier
P002,W Beam Crash Barrier,Thrie-Beam,Meter,Heavy-duty barrier
P003,W Beam Crash Barrier,Double W-Beam,Meter,Double-layer safety
P004,W Beam Crash Barrier,Crash-Tested,Meter,Certified tested barrier
P005,Hot Thermoplastic Paint,White,Kg,Standard road paint
P006,Hot Thermoplastic Paint,Yellow,Kg,Standard road paint
P007,Hot Thermoplastic Paint,Reflective,Kg,High visibility paint
P008,Signages,Directional,Piece,"Arrows, route boards"
P009,Signages,Informational,Piece,"Speed limits, name boards"
P010,Signages,Cautionary,Piece,Warning signs`;

// Parse CSV text into array of objects
function parseCSV(csvText) {
    const lines = csvText.trim().split('\n');
    const headers = lines[0].split(',').map(h => h.trim());
    const products = [];

    for (let i = 1; i < lines.length; i++) {
        const line = lines[i];
        if (!line.trim()) continue;

        // Handle CSV with quoted fields that may contain commas
        const values = [];
        let currentValue = '';
        let inQuotes = false;

        for (let j = 0; j < line.length; j++) {
            const char = line[j];
            
            if (char === '"') {
                inQuotes = !inQuotes;
            } else if (char === ',' && !inQuotes) {
                values.push(currentValue.trim());
                currentValue = '';
            } else {
                currentValue += char;
            }
        }
        values.push(currentValue.trim()); // Add last value

        if (values.length === headers.length) {
            const product = {};
            headers.forEach((header, index) => {
                product[header] = values[index] || '';
            });
            products.push(product);
        }
    }

    return products;
}

// Save products - no longer using localStorage, data is in database
function saveProducts() {
    // Products are now stored in database via API
    updateHomepageProductCount();
}

// Load products from localStorage
function loadProductsFromStorage() {
    const saved = localStorage.getItem('products');
    if (saved) {
        try {
            return JSON.parse(saved);
        } catch (e) {
            return null;
        }
    }
    return null;
}

// Update homepage product count
async function updateHomepageProductCount() {
    const count = allProducts.length;
    // Update via API if available, otherwise just update local display
    if (typeof updateTotalProducts === 'function') {
        await updateTotalProducts();
    }
}

// Load and display products from API
async function loadProducts() {
    try {
        // Load from API
        const productsData = await productsAPI.getAll();
        allProducts = productsData.map(p => ({
            Product_ID: p.Product_ID,
            Product_Name: p.Product_Name,
            Sub_Type: p.Sub_Type,
            Unit: p.Unit,
            Notes: p.Notes || '',
            _id: p._id || p.id // Store MongoDB ID for deletion
        }));
        
        filteredProducts = [...allProducts];
        sortProducts(); // Apply sorting after loading
        updateHomepageProductCount();
        renderTable();
    } catch (error) {
        console.error('Error loading products:', error);
        // Fallback to CSV data if API fails
        allProducts = parseCSV(csvData);
        filteredProducts = [...allProducts];
        sortProducts();
        updateHomepageProductCount();
        renderTable();
    }
}

// Add new product via API
async function addProduct(productName, subType, unit, notes) {
    try {
        // Generate new Product_ID
        const maxId = allProducts.reduce((max, p) => {
            const idNum = parseInt(p.Product_ID.replace('P', '')) || 0;
            return Math.max(max, idNum);
        }, 0);
        const newId = `P${String(maxId + 1).padStart(3, '0')}`;
        
        const productData = {
            Product_ID: newId,
            Product_Name: productName,
            Sub_Type: subType,
            Unit: unit,
            Notes: notes || ''
        };
        
        // Save via API
        const savedProduct = await productsAPI.create(productData);
        
        // Add to local array
        const newProduct = {
            ...productData,
            _id: savedProduct._id || savedProduct.id
        };
        
        allProducts.push(newProduct);
        filteredProducts = [...allProducts];
        sortProducts(); // Apply sorting after adding
        updateHomepageProductCount();
        renderTable();
        
        return newProduct;
    } catch (error) {
        console.error('Error adding product:', error);
        throw error;
    }
}

// Delete product via API (make it globally accessible)
window.deleteProduct = async function(productId) {
    if (!confirm('Are you sure you want to delete this entry?')) {
        return;
    }
    
    try {
        // Find product to get MongoDB _id
        const product = allProducts.find(p => p.Product_ID === productId);
        if (!product || !product._id) {
            throw new Error('Product not found');
        }
        
        // Delete via API
        await productsAPI.delete(product._id);
        
        // Remove from local arrays
        allProducts = allProducts.filter(p => p.Product_ID !== productId);
        filteredProducts = filteredProducts.filter(p => p.Product_ID !== productId);
        
        // Re-render table
        renderTable();
        
        // Update homepage count
        updateHomepageProductCount();
        
        // Show success message
        showSuccessMessage('Entry deleted successfully.');
    } catch (error) {
        console.error('Error deleting product:', error);
        alert('Error deleting product. Please try again.');
    }
};

// Show success message
function showSuccessMessage(message) {
    // Create or get success message element
    let successMsg = document.getElementById('successMessage');
    if (!successMsg) {
        successMsg = document.createElement('div');
        successMsg.id = 'successMessage';
        successMsg.style.cssText = 'background: #d4edda; color: #155724; padding: 12px; border-radius: 8px; margin-bottom: 20px; text-align: center; font-size: 14px; position: fixed; top: 20px; right: 20px; z-index: 10000; box-shadow: 0 4px 12px rgba(0,0,0,0.15);';
        document.body.appendChild(successMsg);
    }
    
    successMsg.textContent = message;
    successMsg.style.display = 'block';
    
    // Hide after 3 seconds
    setTimeout(() => {
        successMsg.style.display = 'none';
    }, 3000);
}

// Render products table
function renderTable() {
    const tbody = document.getElementById('productsTableBody');
    const noResults = document.getElementById('noResults');

    if (filteredProducts.length === 0) {
        tbody.innerHTML = '';
        noResults.style.display = 'block';
        return;
    }

    noResults.style.display = 'none';
    
    tbody.innerHTML = filteredProducts.map((product, index) => {
        return `
            <tr>
                <td>${index + 1}</td>
                <td>${escapeHtml(product.Product_Name || '')}</td>
                <td>${escapeHtml(product.Sub_Type || '')}</td>
                <td>${escapeHtml(product.Unit || '')}</td>
                <td>${escapeHtml(product.Notes || '')}</td>
                <td>
                    <button class="delete-btn" onclick="deleteProduct('${escapeHtml(product.Product_ID || '')}')" title="Delete product" style="background: #dc3545; color: white; border: none; padding: 6px 12px; border-radius: 6px; cursor: pointer; font-size: 14px; transition: all 0.2s;" onmouseover="this.style.background='#c82333'; this.style.transform='scale(1.05)'" onmouseout="this.style.background='#dc3545'; this.style.transform='scale(1)'">
                        🗑️ Delete
                    </button>
                </td>
            </tr>
        `;
    }).join('');
}

// Escape HTML to prevent XSS
function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

// Sort products based on selected sort option
function sortProducts() {
    const sortValue = document.getElementById('sortSelect').value;
    currentSort = sortValue;
    
    filteredProducts = [...filteredProducts]; // Create a copy to avoid mutating
    
    switch(sortValue) {
        case 'name-asc':
            filteredProducts.sort((a, b) => {
                const nameA = (a.Product_Name || '').toLowerCase();
                const nameB = (b.Product_Name || '').toLowerCase();
                if (nameA !== nameB) {
                    return nameA.localeCompare(nameB);
                }
                // If names are same, sort by subtype
                const subA = (a.Sub_Type || '').toLowerCase();
                const subB = (b.Sub_Type || '').toLowerCase();
                return subA.localeCompare(subB);
            });
            break;
        case 'name-desc':
            filteredProducts.sort((a, b) => {
                const nameA = (a.Product_Name || '').toLowerCase();
                const nameB = (b.Product_Name || '').toLowerCase();
                if (nameA !== nameB) {
                    return nameB.localeCompare(nameA);
                }
                // If names are same, sort by subtype (descending)
                const subA = (a.Sub_Type || '').toLowerCase();
                const subB = (b.Sub_Type || '').toLowerCase();
                return subB.localeCompare(subA);
            });
            break;
        default:
            // Default to name-asc
            filteredProducts.sort((a, b) => {
                const nameA = (a.Product_Name || '').toLowerCase();
                const nameB = (b.Product_Name || '').toLowerCase();
                return nameA.localeCompare(nameB);
            });
    }
    
    renderTable();
}

// Filter products based on search query
function filterProducts(query) {
    const searchTerm = query.toLowerCase().trim();
    
    if (!searchTerm) {
        filteredProducts = [...allProducts];
    } else {
        filteredProducts = allProducts.filter(product => {
            const productType = (product.Product_Name || '').toLowerCase();
            const subtype = (product.Sub_Type || '').toLowerCase();
            return productType.includes(searchTerm) || subtype.includes(searchTerm);
        });
    }
    
    // Apply current sort after filtering
    sortProducts();
}

// Export to Excel
function exportToExcel() {
    try {
        // Prepare data for export
        const exportData = filteredProducts.map((product, index) => ({
            'Sr. No.': index + 1,
            'Product Name': product.Product_Name || '',
            'Product Type (Subtype)': product.Sub_Type || '',
            'Unit': product.Unit || '',
            'Notes': product.Notes || ''
        }));

        // Create workbook and worksheet
        const ws = XLSX.utils.json_to_sheet(exportData);
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, 'Products');

        // Set column widths
        const colWidths = [
            { wch: 10 }, // Sr. No.
            { wch: 25 }, // Product Name
            { wch: 25 }, // Product Type
            { wch: 10 }, // Unit
            { wch: 40 }  // Notes
        ];
        ws['!cols'] = colWidths;

        // Export file
        const fileName = `Products_${new Date().toISOString().split('T')[0]}.xlsx`;
        XLSX.writeFile(wb, fileName);
    } catch (error) {
        console.error('Error exporting to Excel:', error);
        alert('Error exporting to Excel. Please try again.');
    }
}

// Export to PDF
function exportToPDF() {
    try {
        const { jsPDF } = window.jspdf;
        const doc = new jsPDF('l', 'mm', 'a4'); // Landscape orientation

        // Title
        doc.setFontSize(16);
        doc.setFont(undefined, 'bold');
        doc.text('Products List', 14, 15);

        // Date
        doc.setFontSize(10);
        doc.setFont(undefined, 'normal');
        doc.text(`Generated on: ${new Date().toLocaleDateString()}`, 14, 22);

        // Prepare table data
        const tableData = filteredProducts.map((product, index) => [
            index + 1,
            product.Product_Name || '',
            product.Sub_Type || '',
            product.Unit || '',
            product.Notes || ''
        ]);

        // Create table
        doc.autoTable({
            startY: 28,
            head: [['Sr. No.', 'Product Name', 'Product Type (Subtype)', 'Unit', 'Notes']],
            body: tableData,
            theme: 'grid',
            headStyles: {
                fillColor: [102, 126, 234],
                textColor: 255,
                fontStyle: 'bold',
                fontSize: 10
            },
            bodyStyles: {
                fontSize: 9
            },
            columnStyles: {
                0: { cellWidth: 20 },
                1: { cellWidth: 50 },
                2: { cellWidth: 50 },
                3: { cellWidth: 25 },
                4: { cellWidth: 80 }
            },
            margin: { left: 14, right: 14 }
        });

        // Save PDF
        const fileName = `Products_${new Date().toISOString().split('T')[0]}.pdf`;
        doc.save(fileName);
    } catch (error) {
        console.error('Error exporting to PDF:', error);
        alert('Error exporting to PDF. Please try again.');
    }
}

// Check if user is logged in
function checkLogin() {
    const token = localStorage.getItem('authToken');
    
    if (!token) {
        window.location.href = 'login.html';
        return false;
    }
    
    return true;
}

// Initialize page
document.addEventListener('DOMContentLoaded', function() {
    // Check if user is logged in
    if (!checkLogin()) {
        return; // Redirect to login page
    }
    
    // Setup logout button
    const logoutBtn = document.getElementById('logoutBtn');
    if (logoutBtn) {
        logoutBtn.addEventListener('click', function(e) {
            e.preventDefault();
            e.stopPropagation();
            // Use global handleLogout if available, otherwise use local
            if (typeof window.handleLogout === 'function') {
                window.handleLogout(e);
            } else {
                // Clear all authentication data
                localStorage.removeItem('sessionActive');
                localStorage.removeItem('activeUser');
                localStorage.removeItem('rememberMe');
                localStorage.removeItem('authToken');
                localStorage.removeItem('userRole');
                // Redirect to login page
                window.location.href = 'login.html';
            }
        });
        logoutBtn.type = 'button';
    }
    
    loadProducts();

    // Add search functionality
    const searchInput = document.getElementById('searchInput');
    searchInput.addEventListener('input', function(e) {
        filterProducts(e.target.value);
    });

    // Add sort functionality
    const sortSelect = document.getElementById('sortSelect');
    if (sortSelect) {
        sortSelect.addEventListener('change', function() {
            sortProducts();
        });
    }

    // Add Product Modal functionality
    const addProductBtn = document.getElementById('addProductBtn');
    const addProductModal = document.getElementById('addProductModal');
    const closeProductModal = document.getElementById('closeProductModal');
    const cancelProductBtn = document.getElementById('cancelProductBtn');
    const addProductForm = document.getElementById('addProductForm');

    addProductBtn.addEventListener('click', function() {
        addProductModal.style.display = 'flex';
        addProductForm.reset();
    });

    closeProductModal.addEventListener('click', function() {
        addProductModal.style.display = 'none';
    });

    cancelProductBtn.addEventListener('click', function() {
        addProductModal.style.display = 'none';
    });

    // Close modal when clicking outside
    addProductModal.addEventListener('click', function(e) {
        if (e.target === addProductModal) {
            addProductModal.style.display = 'none';
        }
    });

    // Export to Excel
    const exportExcelBtn = document.getElementById('exportExcelBtn');
    if (exportExcelBtn) {
        exportExcelBtn.addEventListener('click', function() {
            exportToExcel();
        });
    }

    // Export to PDF
    const exportPdfBtn = document.getElementById('exportPdfBtn');
    if (exportPdfBtn) {
        exportPdfBtn.addEventListener('click', function() {
            exportToPDF();
        });
    }

    // Real-time duplicate detection for product name
    const productNameInput = document.getElementById('newProductName');
    const subTypeInput = document.getElementById('newSubType');
    
    // Setup typo correction for product name
    if (productNameInput && typeof setupTypoCorrection === 'function') {
        setupTypoCorrection(productNameInput, async () => {
            // Get unique product names from database
            const uniqueNames = [...new Set(allProducts.map(p => p.Product_Name || p.name))];
            return uniqueNames;
        }, {
            autoCorrectThreshold: 0.92,
            suggestionThreshold: 0.85,
            onCorrect: (corrected, original) => {
                console.log(`Auto-corrected "${original}" to "${corrected}"`);
            },
            onSuggestionSelect: (selected) => {
                console.log(`Selected suggestion: "${selected}"`);
            }
        });
    }
    
    if (productNameInput) {
        productNameInput.addEventListener('input', function() {
            const productName = this.value.trim();
            if (productName && allProducts.length > 0) {
                const duplicateCheck = isDuplicateProduct({ Product_Name: productName }, allProducts);
                if (duplicateCheck.isDuplicate) {
                    this.style.borderColor = duplicateCheck.score >= 0.95 ? '#dc3545' : '#ffc107';
                    this.style.backgroundColor = duplicateCheck.score >= 0.95 ? '#ffe6e6' : '#fff9e6';
                } else {
                    this.style.borderColor = '';
                    this.style.backgroundColor = '';
                }
            } else {
                this.style.borderColor = '';
                this.style.backgroundColor = '';
            }
        });
    }
    
    // Setup typo correction for product type/subtype
    if (subTypeInput && typeof setupTypoCorrection === 'function') {
        setupTypoCorrection(subTypeInput, async () => {
            // Get all subtypes from products
            const allSubtypes = [];
            allProducts.forEach(p => {
                if (p.Sub_Type) {
                    allSubtypes.push(p.Sub_Type);
                }
                // Also check if product has subtypes array
                if (p.subtypes && Array.isArray(p.subtypes)) {
                    allSubtypes.push(...p.subtypes);
                }
            });
            return [...new Set(allSubtypes)];
        }, {
            autoCorrectThreshold: 0.92,
            suggestionThreshold: 0.85,
            onCorrect: (corrected, original) => {
                console.log(`Auto-corrected subtype "${original}" to "${corrected}"`);
            }
        });
    }
    
    if (subTypeInput) {
        subTypeInput.addEventListener('input', function() {
            const productName = productNameInput?.value.trim() || '';
            const subType = this.value.trim();
            if (productName && subType && allProducts.length > 0) {
                const duplicateCheck = isDuplicateProduct({ 
                    Product_Name: productName, 
                    Sub_Type: subType 
                }, allProducts);
                if (duplicateCheck.isDuplicate) {
                    this.style.borderColor = duplicateCheck.score >= 0.95 ? '#dc3545' : '#ffc107';
                    this.style.backgroundColor = duplicateCheck.score >= 0.95 ? '#ffe6e6' : '#fff9e6';
                } else {
                    this.style.borderColor = '';
                    this.style.backgroundColor = '';
                }
            } else {
                this.style.borderColor = '';
                this.style.backgroundColor = '';
            }
        });
    }

    // Handle form submission with validation
    addProductForm.addEventListener('submit', async function(e) {
        e.preventDefault();
        
        // Remove previous errors
        const formContainer = addProductForm.closest('.modal-content') || addProductForm.parentElement;
        removeValidationError(formContainer);
        
        const productName = document.getElementById('newProductName').value.trim();
        const subType = document.getElementById('newSubType').value.trim();
        const unit = document.getElementById('newUnit').value.trim();
        const notes = document.getElementById('newNotes').value.trim();

        // Validate all fields
        let isValid = true;
        let firstError = '';

        // Validate product name
        const nameResult = validateName(productName, 'Product name', 160);
        if (!nameResult.valid) {
            isValid = false;
            firstError = nameResult.message;
            showValidationError(nameResult.message, formContainer);
            document.getElementById('newProductName').style.borderColor = '#c33';
        } else {
            document.getElementById('newProductName').style.borderColor = '';
        }

        // Validate product type/subtype
        if (isValid || !firstError) {
            const subTypeResult = validateName(subType, 'Product type', 160);
            if (!subTypeResult.valid) {
                isValid = false;
                if (!firstError) firstError = subTypeResult.message;
                if (isValid || !firstError) showValidationError(subTypeResult.message, formContainer);
                document.getElementById('newSubType').style.borderColor = '#c33';
            } else {
                document.getElementById('newSubType').style.borderColor = '';
            }
        }

        // Validate unit
        if (isValid || !firstError) {
            const unitResult = validateUnit(unit);
            if (!unitResult.valid) {
                isValid = false;
                if (!firstError) firstError = unitResult.message;
                if (isValid || !firstError) showValidationError(unitResult.message, formContainer);
                document.getElementById('newUnit').style.borderColor = '#c33';
            } else {
                document.getElementById('newUnit').style.borderColor = '';
            }
        }

        // Validate notes (optional, but if provided, validate length)
        if (notes && notes.length > 200) {
            isValid = false;
            if (!firstError) {
                firstError = 'Notes must be 200 characters or less';
                showValidationError(firstError, formContainer);
            }
            document.getElementById('newNotes').style.borderColor = '#c33';
        } else if (notes) {
            // Check for invalid characters in notes
            if (!/^[A-Za-z0-9\s\-\(\)\.,]+$/.test(notes)) {
                isValid = false;
                if (!firstError) {
                    firstError = 'Notes can only contain letters, numbers, spaces, and limited punctuation';
                    showValidationError(firstError, formContainer);
                }
                document.getElementById('newNotes').style.borderColor = '#c33';
            } else {
                document.getElementById('newNotes').style.borderColor = '';
            }
        }

        if (!isValid) {
            return; // Stop submission
        }

        // Check for duplicates before submission
        const newProduct = {
            Product_Name: productName,
            Sub_Type: subType,
            Unit: unit,
            Notes: notes
        };
        
        const duplicateCheck = isDuplicateProduct(newProduct, allProducts);
        
        if (duplicateCheck.isDuplicate) {
            const userChoice = await showDuplicateWarning(duplicateCheck, 'product');
            
            if (userChoice === 'cancel') {
                return; // User cancelled
            } else if (userChoice === 'view') {
                // Scroll to existing product (if possible) or just cancel
                alert('Please review the existing product in the table above.');
                return;
            }
            // If user chose 'proceed', continue with submission
        }

        try {
            await addProduct(productName, subType, unit, notes);
            addProductModal.style.display = 'none';
            addProductForm.reset();
            removeValidationError(formContainer);
            showSuccessMessage('Product added successfully.');
            
            // Notify orders page to reload products
            window.dispatchEvent(new CustomEvent('productAdded'));
        } catch (error) {
            console.error('Error adding product:', error);
            
            // Check if error is about duplicate (409 status)
            if (error.status === 409 || (error.message && (error.message.includes('duplicate') || error.message.includes('Duplicate')))) {
                const duplicateInfo = {
                    isDuplicate: true,
                    match: error.existing || null,
                    score: 0.95,
                    reason: error.message || 'A duplicate product already exists'
                };
                const userChoice = await showDuplicateWarning(duplicateInfo, 'product');
                if (userChoice === 'cancel' || userChoice === 'view') {
                    return;
                }
                // If user chose 'proceed', we can't continue because backend rejected it
                showValidationError('Cannot proceed with duplicate product. The backend has rejected this entry.', formContainer);
                return;
            }
            
            showValidationError('Failed to add product: ' + (error.message || 'Please try again.'), formContainer);
        }
    });
});

