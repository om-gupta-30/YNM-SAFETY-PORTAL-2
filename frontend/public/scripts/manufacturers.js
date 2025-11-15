// Manufacturers page functionality
let allManufacturers = [];
let filteredManufacturers = [];
let productsData = [];
let currentSort = 'name-asc'; // Default sort

// Embedded products data to get unit information
const productsCSV = `Product_ID,Product_Name,Sub_Type,Unit,Notes
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

// Embedded CSV data (works without server)
const csvData = `Manufacturer_ID,Manufacturer_Name,Location,Contact_Number,Products_Offered,Product_Prices (Rs.)
M001,SafeRoad India Pvt Ltd,Pune,9876543210,"W-Beam, Thrie-Beam","W-Beam: 420, Thrie-Beam: 460"
M002,Highway Guard Systems,Nashik,9823412341,"Double W-Beam, Crash-Tested","Double W-Beam: 510, Crash-Tested: 570"
M003,Metro Safety Co.,Mumbai,9934112233,"W-Beam, Directional, Informational, Cautionary","W-Beam: 440, Directional: 300, Informational: 300, Cautionary: 300"
M004,RoadMark Solutions,Nagpur,9755543210,"Thermoplastic Paint (White, Yellow)","White: 270, Yellow: 290"
M005,ReflectoMark Pvt Ltd,Ahmedabad,8865432234,"Reflective Paint, Directional, Informational, Cautionary","Reflective Paint: 380, Directional: 310, Informational: 310, Cautionary: 310"
M006,Bharat InfraTech,Bengaluru,9900011111,"W-Beam, Crash-Tested","W-Beam: 450, Crash-Tested: 560"
M007,SafetyLine Industries,Hyderabad,9911122233,"Double W-Beam, Paints","Double W-Beam: 520, Paints: 310"
M008,Markwell Coatings,Chennai,9876509876,Thermoplastic Paints,"White: 260, Yellow: 280, Reflective: 360"
M009,Highway Essentials,Delhi,9810098100,"Directional, Informational, Cautionary, Reflective Paint","Directional: 320, Informational: 320, Cautionary: 320, Reflective Paint: 390"
M010,RoadShield Engineering,Jaipur,9800000009,"W-Beam, Thrie-Beam, Directional, Informational, Cautionary","W-Beam: 430, Thrie-Beam: 470, Directional: 330, Informational: 330, Cautionary: 330"
M011,InfraSafe Manufacturing,Surat,9876789098,"W-Beam, Paints","W-Beam: 440, Paints: 300"
M012,MetalGuard Ltd,Indore,9922245678,Crash-Tested Barriers,Crash-Tested: 580
M013,RoadPro India,Lucknow,9898989898,"Directional, Informational, Cautionary","Directional: 310, Informational: 310, Cautionary: 310"
M014,SmartRoad Systems,Kochi,9833344444,"Paints, Directional, Informational, Cautionary","Paints: 290, Directional: 300, Informational: 300, Cautionary: 300"
M015,BarrierMaster Pvt Ltd,Chandigarh,9812345678,"W-Beam, Crash-Tested","W-Beam: 440, Crash-Tested: 550"`;

// Parse CSV text into array of objects
function parseCSV(csvText) {
    const lines = csvText.trim().split('\n');
    const headers = lines[0].split(',').map(h => h.trim());
    const manufacturers = [];

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
            const manufacturer = {};
            headers.forEach((header, index) => {
                manufacturer[header] = values[index] || '';
            });
            manufacturers.push(manufacturer);
        }
    }

    return manufacturers;
}

// Get unit for a product based on product type and subtype
function getProductUnit(productName, productType) {
    // productName is the subtype (e.g., "W-Beam", "White", "Paints")
    // productType is the full product name (e.g., "W Beam Crash Barrier", "Hot Thermoplastic Paint")
    
    const nameLower = productName.toLowerCase();
    const typeLower = productType.toLowerCase();
    
    // Handle paint products - all paint products use "Kg" as unit
    if (typeLower === 'hot thermoplastic paint' || 
        typeLower.includes('hot thermoplastic paint') ||
        nameLower.includes('paint') || 
        nameLower.includes('paints') ||
        nameLower === 'white' || 
        nameLower === 'yellow' || 
        nameLower === 'reflective' ||
        nameLower === 'reflective paint') {
        return 'Kg';
    }
    
    // Find matching product in products data
    const product = productsData.find(p => {
        const pName = (p.Product_Name || '').toLowerCase();
        const pSubType = (p.Sub_Type || '').toLowerCase();
        
        // Product_Name from products.csv should match productType from manufacturer
        // Sub_Type from products.csv should match productName from manufacturer
        if (pName === typeLower && pSubType === nameLower) {
            return true;
        }
        
        // Additional fuzzy matching for edge cases
        // For Signages
        if (typeLower === 'signages' && pName === 'signages' && pSubType === nameLower) {
            return true;
        }
        
        // For W-Beam types
        if (typeLower === 'w beam crash barrier' && pName === 'w beam crash barrier') {
            if ((nameLower.includes('w-beam') && pSubType.includes('w-beam') && !nameLower.includes('double') && !pSubType.includes('double') && !nameLower.includes('thrie') && !pSubType.includes('thrie')) ||
                (nameLower.includes('thrie-beam') && pSubType.includes('thrie-beam')) ||
                (nameLower.includes('double') && pSubType.includes('double')) ||
                (nameLower.includes('crash-tested') && pSubType.includes('crash-tested'))) {
                return true;
            }
        }
        
        // For Paint types - specific matches
        if (typeLower === 'hot thermoplastic paint' && pName === 'hot thermoplastic paint') {
            if ((nameLower === 'white' && pSubType === 'white') ||
                (nameLower === 'yellow' && pSubType === 'yellow') ||
                (nameLower === 'reflective' && pSubType === 'reflective')) {
                return true;
            }
        }
        
        return false;
    });
    
    return product ? (product.Unit || 'N/A') : 'N/A';
}

// Expand manufacturers data - create separate rows for each product
function expandManufacturers(manufacturers) {
    const expanded = [];
    
    manufacturers.forEach(manufacturer => {
        const productsOffered = manufacturer['Products_Offered'] || '';
        const productPrices = manufacturer['Product_Prices (Rs.)'] || '';
        
        // Parse products and prices
        const products = parseProductsList(productsOffered);
        const prices = parsePrices(productPrices);
        
        // Create a row for each product
        products.forEach(product => {
            const productName = product.trim();
            const productType = getProductType(productName);
            
            // Try to find matching price - check multiple variations
            let price = findMatchingPrice(productName, productType, prices);
            
            // Get unit for this product - ensure it's always set
            let unit = getProductUnit(productName, productType);
            // If still N/A, try alternative matching
            if (!unit || unit === 'N/A' || unit === '') {
                // For paint products, always use Kg
                const nameLower = productName.toLowerCase();
                const typeLower = productType.toLowerCase();
                if (typeLower.includes('paint') || nameLower.includes('paint') || 
                    nameLower.includes('paints') || nameLower === 'white' || 
                    nameLower === 'yellow' || nameLower === 'reflective') {
                    unit = 'Kg';
                } else {
                    unit = getProductUnit(productName, productType) || 'N/A';
                }
            }
            
            expanded.push({
                Manufacturer_ID: manufacturer.Manufacturer_ID || '',
                Manufacturer_Name: manufacturer.Manufacturer_Name || '',
                Product_Name: productName || '',
                Product_Type: productType || '',
                Unit: unit || 'N/A',
                Location: manufacturer.Location || '',
                Contact_Number: manufacturer.Contact_Number || '',
                Product_Price: price || 'N/A',
                _id: manufacturer._id || manufacturer.id, // Preserve MongoDB ID for deletion
                Products_Offered_Array: manufacturer.Products_Offered_Array || [],
                Product_Prices_Object: manufacturer.Product_Prices_Object || {}
            });
        });
    });
    
    return expanded;
}

// Parse products list (handles commas, parentheses, etc.)
function parseProductsList(productsStr) {
    if (!productsStr) return [];
    
    // Check if it contains parentheses with color names
    const parenMatch = productsStr.match(/\(([^)]+)\)/);
    let expanded = [];
    
    if (parenMatch && productsStr.toLowerCase().includes('paint')) {
        // Handle "Thermoplastic Paint (White, Yellow)" case
        const colors = parenMatch[1].split(',').map(c => c.trim());
        const baseProduct = productsStr.replace(/\([^)]*\)/g, '').trim();
        
        colors.forEach(color => {
            expanded.push(`${color} Paint`);
        });
    } else {
        // Regular comma-separated list
        const products = productsStr.split(',').map(p => p.trim()).filter(p => p);
        
        products.forEach(product => {
            // Handle generic "Paints" - we'll keep it as is and match with price
            if (product.toLowerCase() === 'paints' || product.toLowerCase().includes('paints')) {
                expanded.push(product);
            } else {
                expanded.push(product);
            }
        });
    }
    
    return expanded;
}

// Parse prices string into object
function parsePrices(pricesStr) {
    const prices = {};
    if (!pricesStr) return prices;
    
    // Split by comma and parse each price entry
    const priceEntries = pricesStr.split(',').map(p => p.trim());
    
    priceEntries.forEach(entry => {
        const match = entry.match(/^(.+?):\s*(\d+)$/);
        if (match) {
            const productName = match[1].trim();
            const price = match[2].trim();
            prices[productName] = `Rs. ${price}`;
        }
    });
    
    return prices;
}

// Find matching price for a product
function findMatchingPrice(productName, productType, prices) {
    // Try exact match first
    if (prices[productName]) {
        return prices[productName];
    }
    
    // Try matching by product type keywords
    const nameLower = productName.toLowerCase();
    const typeLower = productType.toLowerCase();
    
    // Check all price keys for matches
    for (const priceKey in prices) {
        const keyLower = priceKey.toLowerCase();
        
        // Direct match
        if (keyLower === nameLower || keyLower === typeLower) {
            return prices[priceKey];
        }
        
        // Partial matches for paint colors
        if (nameLower.includes('white') && keyLower.includes('white')) {
            return prices[priceKey];
        }
        if (nameLower.includes('yellow') && keyLower.includes('yellow')) {
            return prices[priceKey];
        }
        if (nameLower.includes('reflective') && keyLower.includes('reflective')) {
            return prices[priceKey];
        }
        
        // Match barrier types
        if (nameLower.includes('w-beam') && keyLower.includes('w-beam')) {
            return prices[priceKey];
        }
        if (nameLower.includes('thrie-beam') && keyLower.includes('thrie-beam')) {
            return prices[priceKey];
        }
        if (nameLower.includes('double') && keyLower.includes('double')) {
            return prices[priceKey];
        }
        if (nameLower.includes('crash-tested') && keyLower.includes('crash-tested')) {
            return prices[priceKey];
        }
        
        // Match signages
        if (nameLower.includes('signage') && keyLower.includes('signage')) {
            return prices[priceKey];
        }
        
        // Generic paint match
        if ((nameLower.includes('paint') || nameLower.includes('paints')) && 
            (keyLower.includes('paint') || keyLower.includes('paints'))) {
            return prices[priceKey];
        }
    }
    
    return 'N/A';
}

// Get product type from product name
function getProductType(productName) {
    const name = productName.toLowerCase();
    
    if (name.includes('w-beam') || name.includes('thrie-beam') || name.includes('double w-beam') || name.includes('crash-tested')) {
        return 'W Beam Crash Barrier';
    } else if (name.includes('paint') || name.includes('white') || name.includes('yellow') || name.includes('reflective')) {
        return 'Hot Thermoplastic Paint';
    } else if (name.includes('signage') || name === 'directional' || name === 'informational' || name === 'cautionary') {
        return 'Signages';
    } else if (name.includes('paints')) {
        return 'Hot Thermoplastic Paint';
    }
    
    return productName;
}

// Save manufacturers to localStorage (save raw manufacturers, not expanded)
let rawManufacturersList = [];

// Save manufacturers to localStorage
function saveManufacturers() {
    // Manufacturers are now stored in database via API
    updateHomepageManufacturerCount();
}

// Load manufacturers from localStorage
function loadManufacturersFromStorage() {
    const saved = localStorage.getItem('manufacturers');
    if (saved) {
        try {
            return JSON.parse(saved);
        } catch (e) {
            return null;
        }
    }
    return null;
}

// Update homepage manufacturer count
async function updateHomepageManufacturerCount() {
    const uniqueManufacturers = new Set(rawManufacturersList.map(m => m.Manufacturer_Name));
    const count = uniqueManufacturers.size;
    // Update via API if available
    if (typeof updateTotalManufacturers === 'function') {
        await updateTotalManufacturers();
    }
}

// Load products from API only - no localStorage or CSV fallback
async function loadProductsData() {
    try {
        // Load products from API - this is the ONLY source of truth
        const productsFromAPI = await productsAPI.getAll();
        if (!Array.isArray(productsFromAPI) || productsFromAPI.length === 0) {
            console.warn('No products found in database. Please add products first.');
            productsData = [];
            return;
        }
        
        // Transform API data to expected format
        productsData = productsFromAPI.map(p => ({
            Product_ID: p.Product_ID,
            Product_Name: p.Product_Name,
            Sub_Type: p.Sub_Type,
            Unit: p.Unit,
            Notes: p.Notes || ''
        }));
        
        console.log(`Loaded ${productsData.length} products from database`);
    } catch (error) {
        console.error('Error loading products from API:', error);
        productsData = [];
        // Show error to user
        const formContainer = document.querySelector('.modal-content');
        if (formContainer) {
            showValidationError('Failed to load products. Please refresh the page or add products first in the Products page.', formContainer);
        }
    }
}

// Load and display manufacturers from API
async function loadManufacturers() {
    try {
        // Load products data first
        await loadProductsData();
        
        // Load manufacturers from API
        const manufacturersData = await manufacturersAPI.getAll();
        rawManufacturersList = manufacturersData.map(m => {
            // Backend returns Products_Offered as string and 'Product_Prices (Rs.)' as string
            // Also includes productsOffered array for structured access
            const productsOfferedArray = m.productsOffered ? m.productsOffered.map(p => p.productType) : [];
            const productPricesObject = {};
            if (m.productsOffered) {
                m.productsOffered.forEach(p => {
                    productPricesObject[p.productType] = p.price;
                });
            }
            
            return {
            Manufacturer_ID: m.Manufacturer_ID,
            Manufacturer_Name: m.Manufacturer_Name,
            Location: m.Location,
            Contact_Number: m.Contact_Number,
                'Products_Offered': m.Products_Offered || productsOfferedArray.join(', '),
                'Product_Prices (Rs.)': m['Product_Prices (Rs.)'] || Object.entries(productPricesObject).map(([k, v]) => `${k}: ${v}`).join(', '),
            _id: m._id || m.id, // Store MongoDB ID for deletion
                Products_Offered_Array: productsOfferedArray,
                Product_Prices_Object: productPricesObject
            };
        });
        
        // Always re-expand to ensure Unit field is present
        allManufacturers = expandManufacturers(rawManufacturersList);
        
        // Ensure all manufacturers have Unit field
        allManufacturers = allManufacturers.map(m => {
            if (!m.Unit || m.Unit === 'N/A' || m.Unit === '') {
                let unit = getProductUnit(m.Product_Name || '', m.Product_Type || '');
                // If still N/A, check if it's a paint product
                if (!unit || unit === 'N/A' || unit === '') {
                    const nameLower = (m.Product_Name || '').toLowerCase();
                    const typeLower = (m.Product_Type || '').toLowerCase();
                    if (typeLower.includes('paint') || nameLower.includes('paint') || 
                        nameLower.includes('paints') || nameLower === 'white' || 
                        nameLower === 'yellow' || nameLower === 'reflective') {
                        unit = 'Kg';
                    } else {
                        unit = 'N/A';
                    }
                }
                m.Unit = unit;
            }
            return m;
        });
        
        filteredManufacturers = [...allManufacturers];
        sortManufacturers(); // Apply sorting after loading (this also calls renderTable)
        renderTable(); // Ensure table is rendered
        updateHomepageManufacturerCount();
        populateProductDropdowns();
    } catch (error) {
        console.error('Error loading manufacturers:', error);
            document.getElementById('manufacturersTableBody').innerHTML = 
                '<tr><td colspan="9" style="text-align: center; color: #999; padding: 40px;">Error loading manufacturers. Please check the console for details.</td></tr>';
    }
}

// Populate product dropdowns in add manufacturer form - ONLY from database
function populateProductDropdowns() {
    const productSelect = document.getElementById('newManufacturerProductName');
    if (!productSelect) return;
    
    productSelect.innerHTML = '<option value="">Select product...</option>';
    
    if (!productsData || productsData.length === 0) {
        const option = new Option('No products available. Add products first.', '', true, true);
        option.disabled = true;
        productSelect.appendChild(option);
        productSelect.disabled = true;
        return;
    }
    
    productSelect.disabled = false;
    
    // Get unique product names from database ONLY
    const uniqueProducts = [...new Set(productsData.map(p => p.Product_Name))];
    
    if (uniqueProducts.length === 0) {
        const option = new Option('No products available. Add products first.', '', true, true);
        option.disabled = true;
        productSelect.appendChild(option);
        productSelect.disabled = true;
        return;
    }
    
    uniqueProducts.forEach(productName => {
        const option = new Option(productName, productName);
        productSelect.appendChild(option);
    });
    
    console.log(`Populated ${uniqueProducts.length} products in dropdown`);
}

// Update product type dropdown based on selected product - ONLY from database
function updateManufacturerProductTypes() {
    const productName = document.getElementById('newManufacturerProductName')?.value;
    const productTypeSelect = document.getElementById('newManufacturerProductType');
    const unitInput = document.getElementById('newManufacturerUnit');
    const formContainer = document.querySelector('.modal-content');
    
    if (!productTypeSelect) return;
    
    productTypeSelect.innerHTML = '<option value="">Select product type...</option>';
    productTypeSelect.disabled = !productName;
    if (unitInput) unitInput.value = '';
    
    // Remove any previous errors
    if (formContainer) {
        removeValidationError(formContainer);
    }
    
    if (productName) {
        // Verify product exists in database
        const productExists = productsData.some(p => p.Product_Name === productName);
        
        if (!productExists) {
            productTypeSelect.disabled = true;
            if (formContainer) {
                showValidationError('Product does not exist. Please add this product first in the Products page.', formContainer);
            }
            return;
        }
        
        // Get subtypes ONLY from database for this product
        const subtypes = productsData
            .filter(p => p.Product_Name === productName)
            .map(p => p.Sub_Type)
            .filter((value, index, self) => self.indexOf(value) === index); // Remove duplicates
        
        if (subtypes.length === 0) {
            productTypeSelect.disabled = true;
            if (formContainer) {
                showValidationError('No product types found for this product. Please add product types in the Products page.', formContainer);
            }
            return;
        }
        
        subtypes.forEach(subtype => {
            const option = new Option(subtype, subtype);
            productTypeSelect.appendChild(option);
        });
        productTypeSelect.disabled = false;
    }
}

// Update unit when product type is selected
function updateManufacturerUnit() {
    const productName = document.getElementById('newManufacturerProductName').value;
    const productType = document.getElementById('newManufacturerProductType').value;
    const unitInput = document.getElementById('newManufacturerUnit');
    
    if (productName && productType) {
        const product = productsData.find(p => 
            p.Product_Name === productName && p.Sub_Type === productType
        );
        if (product) {
            unitInput.value = product.Unit || '';
        }
    }
}

// Add new manufacturer
async function addManufacturer(manufacturerName, productName, productType, location, contact, price) {
    try {
        // Check if manufacturer already exists in the list
        let existingManufacturer = rawManufacturersList.find(m => m.Manufacturer_Name === manufacturerName);
        
        let manufacturerData;
        
        if (existingManufacturer) {
            // Update existing manufacturer - add new product to productsOffered
            const existingProducts = existingManufacturer.Products_Offered_Array || [];
            const existingPrices = existingManufacturer.Product_Prices_Object || {};
            
            // Check if product type already exists
            if (!existingProducts.includes(productType)) {
                existingProducts.push(productType);
                existingPrices[productType] = price;
            } else {
                // Update price if product already exists
                existingPrices[productType] = price;
            }
            
            // Prepare update data
            const productsOffered = existingProducts.map(pt => ({
                productType: pt,
                price: existingPrices[pt] || 0
            }));
            
            manufacturerData = {
                Manufacturer_Name: manufacturerName,
                Location: location,
                Contact_Number: contact,
                Products_Offered: existingProducts.join(', '),
                'Product_Prices (Rs.)': existingProducts.map(pt => `${pt}: ${existingPrices[pt]}`).join(', ')
            };
            
            // Update via API
            if (existingManufacturer._id) {
                try {
                    await manufacturersAPI.update(existingManufacturer._id, {
                        name: manufacturerName,
                        location: location,
                        contact: contact,
                        productsOffered: productsOffered
                    });
                } catch (error) {
                    throw new Error(error.message || 'Failed to update manufacturer');
                }
            }
    } else {
        // Create new manufacturer
            manufacturerData = {
            Manufacturer_Name: manufacturerName,
            Location: location,
            Contact_Number: contact,
                Products_Offered: productType,
            'Product_Prices (Rs.)': `${productType}: ${price}`
        };
        
            // Create via API
            const newManufacturer = await manufacturersAPI.create({
                name: manufacturerName,
                location: location,
                contact: contact,
                productsOffered: [{
                    productType: productType,
                    price: price
                }]
            });
            
            if (newManufacturer) {
                manufacturerData._id = newManufacturer._id || newManufacturer.id;
                manufacturerData.Manufacturer_ID = newManufacturer.Manufacturer_ID || `M${String(newManufacturer._id).slice(-3)}`;
            }
        }
        
        // Reload manufacturers from API to get updated data
        await loadManufacturers();
        
        // Update homepage count if function exists
        if (typeof updateTotalManufacturers === 'function') {
            updateTotalManufacturers();
        }
        
        // Notify orders page to reload manufacturers
        window.dispatchEvent(new CustomEvent('manufacturerAdded'));
        
        return manufacturerData;
    } catch (error) {
        console.error('Error adding manufacturer:', error);
        throw error;
    }
}

// Delete manufacturer entry (make it globally accessible)
window.deleteManufacturer = async function(manufacturerId, manufacturerName, productName, productType) {
    if (!confirm('Are you sure you want to delete this entry?')) {
        return;
    }
    
    try {
        // Find the manufacturer in rawManufacturersList by Manufacturer_ID
        let manufacturer = rawManufacturersList.find(m => m.Manufacturer_ID === manufacturerId);
        
        // If not found, try to find by _id from the expanded list
        if (!manufacturer) {
            const expandedManufacturer = allManufacturers.find(m => m.Manufacturer_ID === manufacturerId);
            if (expandedManufacturer && expandedManufacturer._id) {
                manufacturer = rawManufacturersList.find(m => m._id === expandedManufacturer._id);
            }
        }
        
        if (!manufacturer) {
            alert('Manufacturer entry not found.');
            return;
        }
        
        // Ensure we have the MongoDB _id
        if (!manufacturer._id) {
            alert('Cannot delete: Manufacturer ID not found. Please refresh the page and try again.');
            return;
        }
        
        // Check if we need to delete the entire manufacturer or just update it
        const productsOffered = manufacturer.Products_Offered_Array || [];
        const productPrices = manufacturer.Product_Prices_Object || {};
        
        // Check if this is the only product for this manufacturer
        const matchingProducts = productsOffered.filter(p => {
            return p === productType || p === productName;
        });
        
        if (productsOffered.length === 1 || matchingProducts.length === productsOffered.length) {
            // Delete entire manufacturer via API
            if (manufacturer._id) {
                await manufacturersAPI.delete(manufacturer._id);
                showSuccessMessage('Manufacturer deleted successfully.');
        } else {
                alert('Cannot delete: Manufacturer ID not found.');
                return;
            }
        } else {
            // Update manufacturer - remove only this product
            const updatedProducts = productsOffered.filter(p => {
                return !(p === productType || p === productName);
            });
            
            // Remove corresponding price
            const updatedPrices = { ...productPrices };
            delete updatedPrices[productType];
            delete updatedPrices[productName];
            
            // Prepare update data
            const productsOfferedArray = updatedProducts.map(pt => ({
                productType: pt,
                price: updatedPrices[pt] || 0
            }));
            
            // Update via API
            if (manufacturer._id) {
                await manufacturersAPI.update(manufacturer._id, {
                    name: manufacturer.Manufacturer_Name,
                    location: manufacturer.Location,
                    contact: manufacturer.Contact_Number,
                    productsOffered: productsOfferedArray
                });
                showSuccessMessage('Product removed from manufacturer successfully.');
                    } else {
                alert('Cannot update: Manufacturer ID not found.');
                return;
            }
        }
        
        // Reload manufacturers from API to get updated data
        await loadManufacturers();
        
        // Update homepage count if function exists
        if (typeof updateTotalManufacturers === 'function') {
            updateTotalManufacturers();
        }
        
    } catch (error) {
        console.error('Error deleting manufacturer:', error);
        alert('Failed to delete manufacturer: ' + (error.message || 'Please try again.'));
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

// Render manufacturers table
function renderTable() {
    const tbody = document.getElementById('manufacturersTableBody');
    const noResults = document.getElementById('noResults');

    if (filteredManufacturers.length === 0) {
        tbody.innerHTML = '';
        noResults.style.display = 'block';
        return;
    }

    noResults.style.display = 'none';
    
    tbody.innerHTML = filteredManufacturers.map((manufacturer, index) => {
        // Ensure all fields are present to prevent column misalignment
        let unit = manufacturer.Unit || getProductUnit(manufacturer.Product_Name || '', manufacturer.Product_Type || '');
        // If still N/A, check if it's a paint product
        if (!unit || unit === 'N/A' || unit === '') {
            const nameLower = (manufacturer.Product_Name || '').toLowerCase();
            const typeLower = (manufacturer.Product_Type || '').toLowerCase();
            if (typeLower.includes('paint') || nameLower.includes('paint') || 
                nameLower.includes('paints') || nameLower === 'white' || 
                nameLower === 'yellow' || nameLower === 'reflective') {
                unit = 'Kg';
            } else {
                unit = 'N/A';
            }
        }
        
        // Ensure all values are properly escaped and present
        const srNo = index + 1;
        const mfgName = escapeHtml(manufacturer.Manufacturer_Name || '');
        const prodName = escapeHtml(manufacturer.Product_Name || '');
        const prodType = escapeHtml(manufacturer.Product_Type || '');
        const unitValue = escapeHtml(String(unit));
        const location = escapeHtml(manufacturer.Location || '');
        const contact = escapeHtml(manufacturer.Contact_Number || '');
        const price = escapeHtml(String(manufacturer.Product_Price || 'N/A'));
        
        return `
            <tr>
                <td>${srNo}</td>
                <td>${mfgName}</td>
                <td>${prodName}</td>
                <td>${prodType}</td>
                <td>${unitValue}</td>
                <td>${location}</td>
                <td>${contact}</td>
                <td>${price}</td>
                <td>
                    <button class="delete-btn" onclick="deleteManufacturer('${escapeHtml(manufacturer.Manufacturer_ID || '')}', '${escapeHtml(manufacturer.Manufacturer_Name || '')}', '${escapeHtml(manufacturer.Product_Name || '')}', '${escapeHtml(manufacturer.Product_Type || '')}')" title="Delete manufacturer entry" style="background: #dc3545; color: white; border: none; padding: 6px 12px; border-radius: 6px; cursor: pointer; font-size: 14px; transition: all 0.2s;" onmouseover="this.style.background='#c82333'; this.style.transform='scale(1.05)'" onmouseout="this.style.background='#dc3545'; this.style.transform='scale(1)'">
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

// Sort manufacturers based on selected sort option
function sortManufacturers() {
    const sortSelect = document.getElementById('sortSelect');
    if (!sortSelect) return;
    
    const sortValue = sortSelect.value;
    currentSort = sortValue;
    
    filteredManufacturers = [...filteredManufacturers]; // Create a copy to avoid mutating
    
    switch(sortValue) {
        case 'name-asc':
            filteredManufacturers.sort((a, b) => {
                const nameA = (a.Manufacturer_Name || '').toLowerCase();
                const nameB = (b.Manufacturer_Name || '').toLowerCase();
                if (nameA !== nameB) {
                    return nameA.localeCompare(nameB);
                }
                // If names are same, sort by product name
                const prodA = (a.Product_Name || '').toLowerCase();
                const prodB = (b.Product_Name || '').toLowerCase();
                return prodA.localeCompare(prodB);
            });
            break;
        case 'name-desc':
            filteredManufacturers.sort((a, b) => {
                const nameA = (a.Manufacturer_Name || '').toLowerCase();
                const nameB = (b.Manufacturer_Name || '').toLowerCase();
                if (nameA !== nameB) {
                    return nameB.localeCompare(nameA);
                }
                // If names are same, sort by product name (descending)
                const prodA = (a.Product_Name || '').toLowerCase();
                const prodB = (b.Product_Name || '').toLowerCase();
                return prodB.localeCompare(prodA);
            });
            break;
        case 'price-asc':
            filteredManufacturers.sort((a, b) => {
                // Extract numeric price from Product_Price field
                const priceA = parseFloat(String(a.Product_Price || '0').replace(/[^0-9.]/g, '')) || 0;
                const priceB = parseFloat(String(b.Product_Price || '0').replace(/[^0-9.]/g, '')) || 0;
                if (priceA !== priceB) {
                    return priceA - priceB;
                }
                // If prices are same, sort by manufacturer name
                const nameA = (a.Manufacturer_Name || '').toLowerCase();
                const nameB = (b.Manufacturer_Name || '').toLowerCase();
                return nameA.localeCompare(nameB);
            });
            break;
        case 'price-desc':
            filteredManufacturers.sort((a, b) => {
                // Extract numeric price from Product_Price field
                const priceA = parseFloat(String(a.Product_Price || '0').replace(/[^0-9.]/g, '')) || 0;
                const priceB = parseFloat(String(b.Product_Price || '0').replace(/[^0-9.]/g, '')) || 0;
                if (priceA !== priceB) {
                    return priceB - priceA;
                }
                // If prices are same, sort by manufacturer name
                const nameA = (a.Manufacturer_Name || '').toLowerCase();
                const nameB = (b.Manufacturer_Name || '').toLowerCase();
                return nameA.localeCompare(nameB);
            });
            break;
        default:
            // Default to name-asc
            filteredManufacturers.sort((a, b) => {
                const nameA = (a.Manufacturer_Name || '').toLowerCase();
                const nameB = (b.Manufacturer_Name || '').toLowerCase();
                return nameA.localeCompare(nameB);
            });
    }
    
    renderTable();
}

// Filter manufacturers based on search query
function filterManufacturers(query) {
    const searchTerm = query.toLowerCase().trim();
    
    if (!searchTerm) {
        filteredManufacturers = [...allManufacturers];
    } else {
        filteredManufacturers = allManufacturers.filter(manufacturer => {
            const manufacturerName = (manufacturer.Manufacturer_Name || '').toLowerCase();
            const productName = (manufacturer.Product_Name || '').toLowerCase();
            const productType = (manufacturer.Product_Type || '').toLowerCase();
            
            return manufacturerName.includes(searchTerm) || 
                   productName.includes(searchTerm) || 
                   productType.includes(searchTerm);
        });
    }
    
    // Apply current sort after filtering
    sortManufacturers();
}

// Export to Excel
function exportToExcel() {
    try {
        // Prepare data for export
        const exportData = filteredManufacturers.map((manufacturer, index) => {
            let unit = manufacturer.Unit || getProductUnit(manufacturer.Product_Name || '', manufacturer.Product_Type || '');
            if (!unit || unit === 'N/A' || unit === '') {
                const nameLower = (manufacturer.Product_Name || '').toLowerCase();
                const typeLower = (manufacturer.Product_Type || '').toLowerCase();
                if (typeLower.includes('paint') || nameLower.includes('paint') || 
                    nameLower.includes('paints') || nameLower === 'white' || 
                    nameLower === 'yellow' || nameLower === 'reflective') {
                    unit = 'Kg';
                } else {
                    unit = 'N/A';
                }
            }
            
            return {
                'Sr. No.': index + 1,
                'Manufacturer Name': manufacturer.Manufacturer_Name || '',
                'Product Name': manufacturer.Product_Name || '',
                'Product Type': manufacturer.Product_Type || '',
                'Unit': unit,
                'Location': manufacturer.Location || '',
                'Contact Number': manufacturer.Contact_Number || '',
                'Product Price (₹)': manufacturer.Product_Price || 'N/A'
            };
        });

        // Create workbook and worksheet
        const ws = XLSX.utils.json_to_sheet(exportData);
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, 'Manufacturers');

        // Set column widths
        const colWidths = [
            { wch: 10 }, // Sr. No.
            { wch: 25 }, // Manufacturer Name
            { wch: 25 }, // Product Name
            { wch: 25 }, // Product Type
            { wch: 10 }, // Unit
            { wch: 25 }, // Location
            { wch: 15 }, // Contact Number
            { wch: 15 }  // Product Price
        ];
        ws['!cols'] = colWidths;

        // Export file
        const fileName = `Manufacturers_${new Date().toISOString().split('T')[0]}.xlsx`;
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
        doc.text('Manufacturers / Importers List', 14, 15);

        // Date
        doc.setFontSize(10);
        doc.setFont(undefined, 'normal');
        doc.text(`Generated on: ${new Date().toLocaleDateString()}`, 14, 22);

        // Prepare table data
        const tableData = filteredManufacturers.map((manufacturer, index) => {
            let unit = manufacturer.Unit || getProductUnit(manufacturer.Product_Name || '', manufacturer.Product_Type || '');
            if (!unit || unit === 'N/A' || unit === '') {
                const nameLower = (manufacturer.Product_Name || '').toLowerCase();
                const typeLower = (manufacturer.Product_Type || '').toLowerCase();
                if (typeLower.includes('paint') || nameLower.includes('paint') || 
                    nameLower.includes('paints') || nameLower === 'white' || 
                    nameLower === 'yellow' || nameLower === 'reflective') {
                    unit = 'Kg';
                } else {
                    unit = 'N/A';
                }
            }
            
            return [
                index + 1,
                manufacturer.Manufacturer_Name || '',
                manufacturer.Product_Name || '',
                manufacturer.Product_Type || '',
                unit,
                manufacturer.Location || '',
                manufacturer.Contact_Number || '',
                manufacturer.Product_Price ? `₹${manufacturer.Product_Price}` : 'N/A'
            ];
        });

        // Create table
        doc.autoTable({
            startY: 28,
            head: [['Sr. No.', 'Manufacturer Name', 'Product Name', 'Product Type', 'Unit', 'Location', 'Contact', 'Price (₹)']],
            body: tableData,
            theme: 'grid',
            headStyles: {
                fillColor: [102, 126, 234],
                textColor: 255,
                fontStyle: 'bold',
                fontSize: 9
            },
            bodyStyles: {
                fontSize: 8
            },
            columnStyles: {
                0: { cellWidth: 15 },
                1: { cellWidth: 35 },
                2: { cellWidth: 30 },
                3: { cellWidth: 30 },
                4: { cellWidth: 15 },
                5: { cellWidth: 30 },
                6: { cellWidth: 25 },
                7: { cellWidth: 20 }
            },
            margin: { left: 14, right: 14 }
        });

        // Save PDF
        const fileName = `Manufacturers_${new Date().toISOString().split('T')[0]}.pdf`;
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
    
    loadManufacturers();

    // Add search functionality
    const searchInput = document.getElementById('searchInput');
    searchInput.addEventListener('input', function(e) {
        filterManufacturers(e.target.value);
    });

    // Add sort functionality
    const sortSelect = document.getElementById('sortSelect');
    if (sortSelect) {
        sortSelect.addEventListener('change', function() {
            sortManufacturers();
        });
    }

    // Add Manufacturer Modal functionality
    const addManufacturerBtn = document.getElementById('addManufacturerBtn');
    const addManufacturerModal = document.getElementById('addManufacturerModal');
    const closeManufacturerModal = document.getElementById('closeManufacturerModal');
    const cancelManufacturerBtn = document.getElementById('cancelManufacturerBtn');
    const addManufacturerForm = document.getElementById('addManufacturerForm');
    const newManufacturerProductName = document.getElementById('newManufacturerProductName');
    const newManufacturerProductType = document.getElementById('newManufacturerProductType');

    if (addManufacturerBtn) {
        addManufacturerBtn.addEventListener('click', async function() {
            addManufacturerModal.style.display = 'flex';
            addManufacturerForm.reset();
            // Reload products data to get any newly added products - CRITICAL for validation
            await loadProductsData();
            populateProductDropdowns();
            
            // Reset product type dropdown
            const productTypeSelect = document.getElementById('newManufacturerProductType');
            if (productTypeSelect) {
                productTypeSelect.innerHTML = '<option value="">Select product first...</option>';
                productTypeSelect.disabled = true;
            }
            
            // Reset unit field
            const unitInput = document.getElementById('newManufacturerUnit');
            if (unitInput) {
                unitInput.value = '';
            }
            
            // Remove any validation errors
            const formContainer = document.querySelector('.modal-content');
            if (formContainer) {
                removeValidationError(formContainer);
            }
            
            // Reset duplicate detection styling
            const manufacturerNameInput = document.getElementById('newManufacturerName');
            if (manufacturerNameInput) {
                manufacturerNameInput.style.borderColor = '';
                manufacturerNameInput.style.backgroundColor = '';
            }
        });
    }
    
    // Real-time duplicate detection for manufacturer name
    const manufacturerNameInput = document.getElementById('newManufacturerName');
    const locationInput = document.getElementById('newManufacturerLocation');
    
    // Setup typo correction for manufacturer name
    if (manufacturerNameInput && typeof setupTypoCorrection === 'function') {
        setupTypoCorrection(manufacturerNameInput, async () => {
            // Get unique manufacturer names from database
            const uniqueNames = [...new Set(allManufacturers.map(m => m.Manufacturer_Name || m.name))];
            return uniqueNames;
        }, {
            autoCorrectThreshold: 0.92,
            suggestionThreshold: 0.85,
            onCorrect: (corrected, original) => {
                console.log(`Auto-corrected manufacturer name "${original}" to "${corrected}"`);
            }
        });
    }
    
    // Setup typo correction for location
    if (locationInput && typeof setupTypoCorrection === 'function') {
        setupTypoCorrection(locationInput, async () => {
            // Get unique locations from manufacturers and locations list
            const manufacturerLocations = [...new Set(allManufacturers.map(m => m.Location || m.location))];
            // Also get from locations API if available
            try {
                if (typeof locationsAPI !== 'undefined') {
                    const locations = await locationsAPI.getAll();
                    const locationNames = locations.map(l => l.City || l.city || l.name);
                    return [...new Set([...manufacturerLocations, ...locationNames])];
                }
            } catch (error) {
                console.error('Error loading locations:', error);
            }
            return manufacturerLocations;
        }, {
            autoCorrectThreshold: 0.92,
            suggestionThreshold: 0.85,
            onCorrect: (corrected, original) => {
                console.log(`Auto-corrected location "${original}" to "${corrected}"`);
            }
        });
    }
    
    if (manufacturerNameInput) {
        manufacturerNameInput.addEventListener('input', function() {
            const manufacturerName = this.value.trim();
            if (manufacturerName && allManufacturers.length > 0) {
                const duplicateCheck = isDuplicateManufacturer({ 
                    Manufacturer_Name: manufacturerName 
                }, allManufacturers);
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

    if (closeManufacturerModal) {
        closeManufacturerModal.addEventListener('click', function() {
            addManufacturerModal.style.display = 'none';
        });
    }

    if (cancelManufacturerBtn) {
        cancelManufacturerBtn.addEventListener('click', function() {
            addManufacturerModal.style.display = 'none';
        });
    }

    // Close modal when clicking outside
    if (addManufacturerModal) {
        addManufacturerModal.addEventListener('click', function(e) {
            if (e.target === addManufacturerModal) {
                addManufacturerModal.style.display = 'none';
            }
        });
    }

    // Update product types when product name changes
    if (newManufacturerProductName) {
        newManufacturerProductName.addEventListener('change', function() {
            updateManufacturerProductTypes();
        });
    }

    // Update unit when product type changes
    if (newManufacturerProductType) {
        newManufacturerProductType.addEventListener('change', function() {
            updateManufacturerUnit();
        });
    }

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

    // Handle form submission with validation
    if (addManufacturerForm) {
        addManufacturerForm.addEventListener('submit', async function(e) {
            e.preventDefault();
            
            // Remove previous errors
            const formContainer = addManufacturerForm.closest('.modal-content') || addManufacturerForm.parentElement;
            removeValidationError(formContainer);
            
            const manufacturerName = document.getElementById('newManufacturerName').value.trim();
            const productName = document.getElementById('newManufacturerProductName').value.trim();
            const productType = document.getElementById('newManufacturerProductType').value.trim();
            const location = document.getElementById('newManufacturerLocation').value.trim();
            const contact = document.getElementById('newManufacturerContact').value.trim();
            const priceInput = document.getElementById('newManufacturerPrice').value.trim();
            const unitInput = document.getElementById('newManufacturerUnit')?.value.trim() || '';

            // Validate all fields
            const validations = {
                manufacturerName: (val) => validateName(val, 'Manufacturer name', 160),
                productName: (val) => validateName(val, 'Product name', 160),
                productType: (val) => validateName(val, 'Product type', 160),
                location: (val) => validateLocation(val),
                contact: (val) => validatePhone(val),
                price: (val) => validateNumeric(val, 'Price', false, 0.01),
                unit: (val) => unitInput ? validateUnit(val) : { valid: true, message: '' }
            };

            let isValid = true;
            let firstError = '';

            // Validate manufacturer name
            const nameResult = validateName(manufacturerName, 'Manufacturer name', 160);
            if (!nameResult.valid) {
                isValid = false;
                firstError = nameResult.message;
                showValidationError(nameResult.message, formContainer);
                document.getElementById('newManufacturerName').style.borderColor = '#c33';
            } else {
                document.getElementById('newManufacturerName').style.borderColor = '';
            }

            // Validate product name - MUST exist in database
            if (isValid || !firstError) {
                if (!productName) {
                    isValid = false;
                    if (!firstError) firstError = 'Please select a product';
                    if (isValid || !firstError) showValidationError(firstError, formContainer);
                    document.getElementById('newManufacturerProductName').style.borderColor = '#c33';
                } else {
                    // Check if product exists in database
                    const productExists = productsData.some(p => p.Product_Name === productName);
                    if (!productExists) {
                        isValid = false;
                        if (!firstError) firstError = 'Product does not exist. Please add this product first in the Products page.';
                        if (isValid || !firstError) showValidationError(firstError, formContainer);
                        document.getElementById('newManufacturerProductName').style.borderColor = '#c33';
                    } else {
                        document.getElementById('newManufacturerProductName').style.borderColor = '';
                    }
                }
            }

            // Validate product type - MUST belong to selected product
            if (isValid || !firstError) {
                if (!productType) {
                    isValid = false;
                    if (!firstError) firstError = 'Please select a product type';
                    if (isValid || !firstError) showValidationError(firstError, formContainer);
                    document.getElementById('newManufacturerProductType').style.borderColor = '#c33';
                } else {
                    // Verify product type belongs to selected product
                    const productTypeExists = productsData.some(p => 
                        p.Product_Name === productName && p.Sub_Type === productType
                    );
                    
                    if (!productTypeExists) {
                        isValid = false;
                        if (!firstError) firstError = 'Product type does not belong to the selected product. Please select a valid product type.';
                        if (isValid || !firstError) showValidationError(firstError, formContainer);
                        document.getElementById('newManufacturerProductType').style.borderColor = '#c33';
                    } else {
                        document.getElementById('newManufacturerProductType').style.borderColor = '';
                    }
                }
            }

            // Validate location
            if (isValid || !firstError) {
                const locationResult = validateLocation(location);
                if (!locationResult.valid) {
                    isValid = false;
                    if (!firstError) firstError = locationResult.message;
                    if (isValid || !firstError) showValidationError(locationResult.message, formContainer);
                    document.getElementById('newManufacturerLocation').style.borderColor = '#c33';
                } else {
                    document.getElementById('newManufacturerLocation').style.borderColor = '';
                }
            }

            // Validate phone
            if (isValid || !firstError) {
                const phoneResult = validatePhone(contact);
                if (!phoneResult.valid) {
                    isValid = false;
                    if (!firstError) firstError = phoneResult.message;
                    if (isValid || !firstError) showValidationError(phoneResult.message, formContainer);
                    document.getElementById('newManufacturerContact').style.borderColor = '#c33';
                } else {
                    document.getElementById('newManufacturerContact').style.borderColor = '';
                }
            }

            // Validate price
            if (isValid || !firstError) {
                const priceResult = validateNumeric(priceInput, 'Price', false, 0.01);
                if (!priceResult.valid) {
                    isValid = false;
                    if (!firstError) firstError = priceResult.message;
                    if (isValid || !firstError) showValidationError(priceResult.message, formContainer);
                    document.getElementById('newManufacturerPrice').style.borderColor = '#c33';
                } else {
                    document.getElementById('newManufacturerPrice').style.borderColor = '';
                }
            }

            // Validate unit if present
            if (unitInput) {
                const unitResult = validateUnit(unitInput);
                if (!unitResult.valid) {
                    isValid = false;
                    if (!firstError) firstError = unitResult.message;
                    if (isValid || !firstError) showValidationError(unitResult.message, formContainer);
                    const unitField = document.getElementById('newManufacturerUnit');
                    if (unitField) unitField.style.borderColor = '#c33';
                } else {
                    const unitField = document.getElementById('newManufacturerUnit');
                    if (unitField) unitField.style.borderColor = '';
                }
            }

            if (!isValid) {
                return; // Stop submission
            }

            // Final verification: ensure product and product type exist in database
            const productExists = productsData.some(p => p.Product_Name === productName);
            const productTypeExists = productsData.some(p => 
                p.Product_Name === productName && p.Sub_Type === productType
            );

            if (!productExists) {
                showValidationError('Product does not exist. Please add this product first in the Products page.', formContainer);
                document.getElementById('newManufacturerProductName').style.borderColor = '#c33';
                return;
            }

            if (!productTypeExists) {
                showValidationError('Product type does not belong to the selected product. Please select a valid product type.', formContainer);
                document.getElementById('newManufacturerProductType').style.borderColor = '#c33';
                return;
            }

            // Check for duplicates before submission
            const newManufacturer = {
                Manufacturer_Name: manufacturerName,
                Product_Name: productName,
                Product_Type: productType,
                Location: location,
                Contact_Number: contact
            };
            
            const duplicateCheck = isDuplicateManufacturer(newManufacturer, allManufacturers);
            
            if (duplicateCheck.isDuplicate) {
                const userChoice = await showDuplicateWarning(duplicateCheck, 'manufacturer');
                
                if (userChoice === 'cancel') {
                    return; // User cancelled
                } else if (userChoice === 'view') {
                    // Scroll to existing manufacturer (if possible) or just cancel
                    alert('Please review the existing manufacturer in the table above.');
                    return;
                }
                // If user chose 'proceed', continue with submission
            }

            const price = parseFloat(priceInput);

                try {
                    await addManufacturer(manufacturerName, productName, productType, location, contact, price);
                addManufacturerModal.style.display = 'none';
                addManufacturerForm.reset();
                removeValidationError(formContainer);
                alert('Manufacturer added successfully!');
                } catch (error) {
                console.error('Error adding manufacturer:', error);
                const errorMessage = error.message || 'Please try again.';
                
                // Check if error is about duplicate (409 status)
                if (error.status === 409 || (errorMessage.includes('duplicate') || errorMessage.includes('Duplicate'))) {
                    const duplicateInfo = {
                        isDuplicate: true,
                        match: error.existing || null,
                        score: 0.95,
                        reason: errorMessage || 'A duplicate manufacturer entry already exists'
                    };
                    const userChoice = await showDuplicateWarning(duplicateInfo, 'manufacturer');
                    if (userChoice === 'cancel' || userChoice === 'view') {
                        return;
                    }
                    // If user chose 'proceed', we can't continue because backend rejected it
                    showValidationError('Cannot proceed with duplicate manufacturer. The backend has rejected this entry.', formContainer);
                    return;
                }
                
                // Check if error is about invalid product
                if (errorMessage.includes('Invalid product') || errorMessage.includes('does not exist')) {
                    showValidationError(errorMessage, formContainer);
                } else {
                    showValidationError('Failed to add manufacturer: ' + errorMessage, formContainer);
                }
            }
        });

        // Real-time validation for phone number
        const contactInput = document.getElementById('newManufacturerContact');
        if (contactInput) {
            contactInput.addEventListener('input', function() {
                const value = this.value.replace(/[^0-9]/g, ''); // Remove non-digits
                if (this.value !== value) {
                    this.value = value;
                }
                // Validate on blur
                if (this.value.length > 0) {
                    const result = validatePhone(this.value);
                    if (!result.valid) {
                        this.style.borderColor = '#c33';
                    } else {
                        this.style.borderColor = '';
                    }
                }
            });
        }
    }
});

