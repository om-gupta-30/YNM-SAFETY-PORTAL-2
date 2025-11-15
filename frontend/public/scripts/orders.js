// Orders page functionality
let orders = [];
let manufacturers = [];
let products = [];
let locations = [];
const ratePerKm = 10;

// Google Maps API Key
const GOOGLE_MAPS_API_KEY = 'AIzaSyAc0CFjsw2LjUHtFf68ngZ0ZVyUccOLL7U';

// Embedded coordinates for transport calculation
const locationCoordinates = {
    'Pune, Maharashtra': { lat: 18.5204, lng: 73.8567 },
    'Mumbai, Maharashtra': { lat: 19.0760, lng: 72.8777 },
    'Nashik, Maharashtra': { lat: 19.9975, lng: 73.7898 },
    'Nagpur, Maharashtra': { lat: 21.1458, lng: 79.0882 },
    'Ahmedabad, Gujarat': { lat: 23.0225, lng: 72.5714 },
    'Surat, Gujarat': { lat: 21.1702, lng: 72.8311 },
    'Bengaluru, Karnataka': { lat: 12.9716, lng: 77.5946 },
    'Hyderabad, Telangana': { lat: 17.3850, lng: 78.4867 },
    'Chennai, Tamil Nadu': { lat: 13.0827, lng: 80.2707 },
    'Delhi, Delhi': { lat: 28.6139, lng: 77.2090 },
    'Jaipur, Rajasthan': { lat: 26.9124, lng: 75.7873 },
    'Lucknow, Uttar Pradesh': { lat: 26.8467, lng: 80.9462 },
    'Indore, Madhya Pradesh': { lat: 22.7196, lng: 75.8577 },
    'Kochi, Kerala': { lat: 9.9312, lng: 76.2673 },
    'Chandigarh, Punjab': { lat: 30.7333, lng: 76.7794 }
};

// Embedded data
const productsData = `Product_ID,Product_Name,Sub_Type,Unit,Notes
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

const manufacturersData = `Manufacturer_ID,Manufacturer_Name,Location,Contact_Number,Products_Offered,Product_Prices (Rs.)
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

const locationsData = `Location_ID,City,State
L001,Pune,Maharashtra
L002,Mumbai,Maharashtra
L003,Nashik,Maharashtra
L004,Nagpur,Maharashtra
L005,Ahmedabad,Gujarat
L006,Surat,Gujarat
L007,Bengaluru,Karnataka
L008,Hyderabad,Telangana
L009,Chennai,Tamil Nadu
L010,Delhi,Delhi
L011,Jaipur,Rajasthan
L012,Lucknow,Uttar Pradesh
L013,Indore,Madhya Pradesh
L014,Kochi,Kerala
L015,Chandigarh,Punjab`;

// Parse CSV
function parseCSV(csvText) {
    const lines = csvText.trim().split('\n');
    const headers = lines[0].split(',').map(h => h.trim());
    const data = [];

    for (let i = 1; i < lines.length; i++) {
        const line = lines[i];
        if (!line.trim()) continue;

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
        values.push(currentValue.trim());

        if (values.length === headers.length) {
            const item = {};
            headers.forEach((header, index) => {
                item[header] = values[index] || '';
            });
            data.push(item);
        }
    }
    return data;
}

// Parse prices from manufacturer data
function parsePrices(pricesStr) {
    const prices = {};
    if (!pricesStr) return prices;
    const priceEntries = pricesStr.split(',').map(p => p.trim());
    priceEntries.forEach(entry => {
        const match = entry.match(/^(.+?):\s*(\d+)$/);
        if (match) {
            const key = match[1].trim();
            const value = parseFloat(match[2].trim());
            prices[key] = value;
        }
    });
    return prices;
}

// Map manufacturer's Products_Offered to actual product names
function getManufacturerProducts(manufacturer) {
    // Handle both string and array formats
    let productsOffered = '';
    if (Array.isArray(manufacturer['Products_Offered'])) {
        productsOffered = manufacturer['Products_Offered'].join(', ');
    } else {
        productsOffered = manufacturer['Products_Offered'] || '';
    }
    
    const productNames = new Set();
    const productsOfferedLower = productsOffered.toLowerCase();
    
    // Check for W Beam Crash Barrier products
    if (productsOfferedLower.includes('w-beam') || 
        productsOfferedLower.includes('thrie-beam') || 
        productsOfferedLower.includes('double w-beam') || 
        productsOfferedLower.includes('crash-tested')) {
        productNames.add('W Beam Crash Barrier');
    }
    
    // Check for Hot Thermoplastic Paint products
    if (productsOfferedLower.includes('paint') || 
        productsOfferedLower.includes('white') || 
        productsOfferedLower.includes('yellow') || 
        productsOfferedLower.includes('reflective') ||
        productsOfferedLower.includes('thermoplastic')) {
        productNames.add('Hot Thermoplastic Paint');
    }
    
    // Check for Signages - now check for specific subtypes (Directional, Informational, Cautionary)
    if (productsOfferedLower.includes('directional') || 
        productsOfferedLower.includes('informational') || 
        productsOfferedLower.includes('cautionary') ||
        productsOfferedLower.includes('signage')) {
        productNames.add('Signages');
    }
    
    return Array.from(productNames);
}

// Get product types/subtypes that a manufacturer offers for a specific product
function getManufacturerProductTypes(manufacturer, productName) {
    const prices = parsePrices(manufacturer['Product_Prices (Rs.)']);
    
    // Get all subtypes for this product from products.csv
    const productSubtypes = products
        .filter(p => p.Product_Name === productName)
        .map(p => p.Sub_Type);
    
    // Special handling for Signages - check for specific subtypes (Directional, Informational, Cautionary)
    if (productName === 'Signages') {
        const availableSignageTypes = [];
        productSubtypes.forEach(subtype => {
            const subtypeLower = subtype.toLowerCase().trim();
            // Check if manufacturer has a price for this specific subtype
            for (const [priceKey, price] of Object.entries(prices)) {
                const keyLower = priceKey.toLowerCase().trim();
                if (keyLower === subtypeLower || keyLower.includes('signage')) {
                    availableSignageTypes.push(subtype);
                    break;
                }
            }
        });
        return availableSignageTypes;
    }
    
    // Filter subtypes based on what manufacturer actually offers
    const availableTypes = [];
    
    productSubtypes.forEach(subtype => {
        const subtypeLower = subtype.toLowerCase().trim();
        let matched = false;
        
        // First, try exact match
        for (const [priceKey, price] of Object.entries(prices)) {
            const keyLower = priceKey.toLowerCase().trim();
            if (keyLower === subtypeLower) {
                availableTypes.push(subtype);
                matched = true;
                break;
            }
        }
        
        // If no exact match, try fuzzy matching
        if (!matched) {
            for (const [priceKey, price] of Object.entries(prices)) {
                const keyLower = priceKey.toLowerCase().trim();
                
                // W-Beam Crash Barrier matching
                if (productName === 'W Beam Crash Barrier') {
                    // Thrie-Beam
                    if (subtypeLower.includes('thrie-beam') && keyLower.includes('thrie-beam')) {
                        availableTypes.push(subtype);
                        matched = true;
                        break;
                    }
                    // Double W-Beam
                    if (subtypeLower.includes('double') && keyLower.includes('double') && 
                        subtypeLower.includes('w-beam') && keyLower.includes('w-beam')) {
                        availableTypes.push(subtype);
                        matched = true;
                        break;
                    }
                    // Crash-Tested
                    if (subtypeLower.includes('crash-tested') && keyLower.includes('crash-tested')) {
                        availableTypes.push(subtype);
                        matched = true;
                        break;
                    }
                    // W-Beam (but not Double or Thrie)
                    if (subtypeLower === 'w-beam' && keyLower === 'w-beam') {
                        availableTypes.push(subtype);
                        matched = true;
                        break;
                    }
                }
                
                // Hot Thermoplastic Paint matching
                if (productName === 'Hot Thermoplastic Paint') {
                    // White
                    if (subtypeLower === 'white' && keyLower.includes('white')) {
                        availableTypes.push(subtype);
                        matched = true;
                        break;
                    }
                    // Yellow
                    if (subtypeLower === 'yellow' && keyLower.includes('yellow')) {
                        availableTypes.push(subtype);
                        matched = true;
                        break;
                    }
                    // Reflective
                    if (subtypeLower === 'reflective' && keyLower.includes('reflective')) {
                        availableTypes.push(subtype);
                        matched = true;
                        break;
                    }
                    // Generic "Paints" - if manufacturer has generic "Paints" price, include all paint subtypes
                    if (keyLower === 'paints' && (subtypeLower === 'white' || subtypeLower === 'yellow' || subtypeLower === 'reflective')) {
                        if (!availableTypes.includes(subtype)) {
                            availableTypes.push(subtype);
                        }
                        matched = true;
                    }
                }
            }
        }
    });
    
    return availableTypes;
}

// Calculate geodesic distance
function calculateGeodesicDistance(coord1, coord2) {
    const R = 6371;
    const dLat = (coord2.lat - coord1.lat) * Math.PI / 180;
    const dLon = (coord2.lng - coord1.lng) * Math.PI / 180;
    const a = 
        Math.sin(dLat / 2) * Math.sin(dLat / 2) +
        Math.cos(coord1.lat * Math.PI / 180) * Math.cos(coord2.lat * Math.PI / 180) *
        Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
}

// Get coordinates
function getCoordinates(locationName) {
    return locationCoordinates[locationName] || null;
}

// Load data from API
async function loadData() {
    try {
        console.log('Loading data from API...');
        
        // Load products from API
        console.log('Loading products...');
        let apiProducts;
        try {
            apiProducts = await productsAPI.getAll();
            console.log('Products API response:', apiProducts);
            console.log('Products loaded:', apiProducts?.length || 0);
        } catch (apiError) {
            console.error('Error calling productsAPI.getAll():', apiError);
            throw apiError; // Re-throw to trigger fallback
        }
        
        if (apiProducts && apiProducts.length > 0) {
            products = apiProducts.map(p => ({
                Product_ID: p.Product_ID || p._id,
                Product_Name: p.Product_Name || p.name,
                Sub_Type: p.Sub_Type || (p.subtypes && p.subtypes[0]) || '',
                Unit: p.Unit || p.unit,
                Notes: p.Notes || p.notes || '',
                _id: p._id || p.id
            }));
            console.log('Products processed:', products.length);
        } else {
            console.warn('No products returned from API');
            products = []; // Empty array instead of CSV fallback
        }
        
        // Load manufacturers from API
        console.log('Loading manufacturers...');
        let apiManufacturers;
        try {
            apiManufacturers = await manufacturersAPI.getAll();
            console.log('Manufacturers API response:', apiManufacturers);
            console.log('Manufacturers loaded:', apiManufacturers?.length || 0);
        } catch (apiError) {
            console.error('Error calling manufacturersAPI.getAll():', apiError);
            throw apiError; // Re-throw to trigger fallback
        }
        
        if (apiManufacturers && apiManufacturers.length > 0) {
            manufacturers = apiManufacturers.map(m => {
                // Handle Products_Offered - can be string or array
                let productsOfferedStr = '';
                if (Array.isArray(m.Products_Offered)) {
                    productsOfferedStr = m.Products_Offered.join(', ');
                } else if (typeof m.Products_Offered === 'string') {
                    productsOfferedStr = m.Products_Offered;
                } else if (m.productsOffered && Array.isArray(m.productsOffered)) {
                    // Backend format - array of objects with productType
                    productsOfferedStr = m.productsOffered.map(p => p.productType).join(', ');
                }
                
                // Handle Product_Prices - can be string or object
                let productPricesStr = '';
                if (m['Product_Prices (Rs.)']) {
                    productPricesStr = m['Product_Prices (Rs.)'];
                } else if (m.productsOffered && Array.isArray(m.productsOffered)) {
                    // Backend format - array of objects with productType and price
                    productPricesStr = m.productsOffered.map(p => `${p.productType}: ${p.price}`).join(', ');
                }
                
                return {
                    Manufacturer_ID: m.Manufacturer_ID || m._id,
                    Manufacturer_Name: m.Manufacturer_Name || m.name,
                    Location: m.Location || m.location,
                    Contact_Number: m.Contact_Number || m.contact,
                    Products_Offered: productsOfferedStr,
                    'Product_Prices (Rs.)': productPricesStr,
                    _id: m._id || m.id,
                    productsOffered: m.productsOffered // Keep original for filtering
                };
            });
            console.log('Manufacturers processed:', manufacturers.length);
        } else {
            console.warn('No manufacturers returned from API');
            manufacturers = []; // Empty array instead of CSV fallback
        }
        
        // Locations - keep using embedded data for now (can be moved to API later)
        locations = parseCSV(locationsData);
        
        console.log('Data loaded. Products:', products.length, 'Manufacturers:', manufacturers.length);
        
        populateDropdowns();
        await loadOrders();
        
        // Build Fuse indexes after data loads
        setTimeout(() => {
            if (typeof buildFuseIndexes === 'function') {
            buildFuseIndexes();
            }
        }, 100);
    } catch (error) {
        console.error('Error loading data from API:', error);
        console.error('Error details:', error.message, error.stack);
        
        // If API fails, use empty arrays (no CSV fallback)
        console.log('API failed, using empty data arrays');
        products = [];
        manufacturers = [];
        locations = parseCSV(locationsData); // Keep locations as they're not in API yet
        console.log('Using empty products and manufacturers arrays');
        populateDropdowns();
        await loadOrders();
    }
}

// Get coordinates from address using Google Maps Geocoding API
async function getCoordinatesFromAddress(address) {
    return new Promise((resolve, reject) => {
        if (!window.google || !window.google.maps) {
            reject(new Error('Google Maps API not loaded. Please refresh the page.'));
            return;
        }

        const geocoder = new google.maps.Geocoder();
        
        geocoder.geocode({ 
            address: address,
            region: 'IN' // Bias results to India
        }, (results, status) => {
            if (status === 'OK' && results && results.length > 0) {
                const location = results[0].geometry.location;
                resolve({
                    lat: location.lat(),
                    lng: location.lng(),
                    name: results[0].formatted_address || address,
                    formatted_address: results[0].formatted_address || address
                });
            } else {
                reject(new Error(`Geocoding failed: ${status}`));
            }
        });
    });
}

// Get driving distance using Google Maps Distance Matrix Service
async function getDrivingDistance(origin, destination) {
    return new Promise((resolve, reject) => {
        if (!window.google || !window.google.maps) {
            reject(new Error('Google Maps API not loaded. Please refresh the page.'));
            return;
        }

        const service = new google.maps.DistanceMatrixService();
        
        service.getDistanceMatrix({
            origins: [origin],
            destinations: [destination],
            travelMode: google.maps.TravelMode.DRIVING,
            unitSystem: google.maps.UnitSystem.METRIC,
            avoidHighways: false,
            avoidTolls: false
        }, (response, status) => {
            if (status === 'OK' && response.rows && response.rows[0] && response.rows[0].elements && response.rows[0].elements[0]) {
                const element = response.rows[0].elements[0];
                if (element.status === 'OK') {
                    resolve({
                        distance: element.distance.value / 1000, // Convert meters to kilometers
                        duration: element.duration.text,
                        distanceText: element.distance.text
                    });
                } else {
                    reject(new Error(`Distance calculation failed: ${element.status}`));
                }
            } else {
                reject(new Error(`Distance Matrix API error: ${status}`));
            }
        });
    });
}

// No map display needed - only distance calculation

// Populate dropdowns
function populateDropdowns() {
    console.log('Populating dropdowns...');
    console.log('Manufacturers array:', manufacturers);
    console.log('Manufacturers length:', manufacturers?.length || 0);
    
    // Manufacturers - get unique manufacturer names
    const manufacturerSelect = document.getElementById('manufacturerName');
    if (!manufacturerSelect) {
        console.error('Manufacturer select element not found');
        return;
    }
    
    // Clear existing options
    manufacturerSelect.innerHTML = '<option value="">Select manufacturer...</option>';
    
    if (manufacturers && manufacturers.length > 0) {
        const uniqueManufacturers = [...new Set(manufacturers.map(m => {
            const name = m.Manufacturer_Name || m.name || m.ManufacturerName;
            return name;
        }).filter(m => m && m.trim()))];
        
        console.log('Unique manufacturers to add:', uniqueManufacturers);
        
    uniqueManufacturers.forEach(manufacturerName => {
        const option = new Option(manufacturerName, manufacturerName);
        manufacturerSelect.appendChild(option);
    });
        console.log(`✅ Populated ${uniqueManufacturers.length} manufacturers in dropdown`);
    } else {
        console.warn('⚠️ No manufacturers available to populate dropdown');
        console.warn('Manufacturers array:', manufacturers);
    }

    // Products - will be filtered based on manufacturer selection
    // Initially empty, populated when manufacturer is selected
    const productSelect = document.getElementById('productName');
    if (productSelect) {
        productSelect.innerHTML = '<option value="">Select product...</option>';
        productSelect.disabled = true;
    }
    
    const productTypeSelect = document.getElementById('productType');
    if (productTypeSelect) {
        productTypeSelect.innerHTML = '<option value="">Select product type...</option>';
        productTypeSelect.disabled = true;
    }

    // Locations - no longer needed, using manual input
}

// Update products dropdown based on selected manufacturer
function updateProducts() {
    const manufacturerName = document.getElementById('manufacturerName')?.value;
    const productSelect = document.getElementById('productName');
    const productTypeSelect = document.getElementById('productType');
    const unitDisplay = document.getElementById('unitDisplay');
    
    if (!productSelect || !productTypeSelect) {
        console.error('Product select elements not found');
        return;
    }
    
    // Clear products and product types
    productSelect.innerHTML = '<option value="">Select product...</option>';
    productTypeSelect.innerHTML = '<option value="">Select product type...</option>';
    productSelect.disabled = !manufacturerName;
    productTypeSelect.disabled = true;
    
    if (unitDisplay) {
        unitDisplay.textContent = ''; // Clear unit display
    }
    
    if (manufacturerName) {
        const manufacturer = manufacturers.find(m => m.Manufacturer_Name === manufacturerName);
        if (manufacturer) {
            console.log('Found manufacturer:', manufacturer);
            console.log('Products_Offered:', manufacturer['Products_Offered']);
            const availableProducts = getManufacturerProducts(manufacturer);
            console.log('Available products:', availableProducts);
            
            if (availableProducts.length > 0) {
                availableProducts.forEach(productName => {
                    const option = new Option(productName, productName);
                    productSelect.appendChild(option);
                });
                productSelect.disabled = false;
            } else {
                console.warn('No products found for manufacturer:', manufacturerName);
                productSelect.disabled = true;
            }
        } else {
            console.error('Manufacturer not found:', manufacturerName);
            console.log('Available manufacturers:', manufacturers.map(m => m.Manufacturer_Name));
        }
    }
    
    // Rebuild products index after products are populated
    setTimeout(() => {
        if (typeof Fuse !== 'undefined' && productSelect) {
            const products = Array.from(productSelect.options)
                .filter(o => o.value)
                .map(o => ({ name: o.text || o.value, value: o.value, option: o }));
            
            fuseIndexes.products = new Fuse(products, {
                keys: ['name'],
                threshold: 0.35,
                includeScore: true,
                minMatchCharLength: 2,
                ignoreLocation: true,
                findAllMatches: false
            });
            
            if (window.ORDERS_PARSER_DEBUG) {
                console.log('Rebuilt products index:', products.length, 'items');
            }
        }
    }, 100);
    
    // Reset and recalculate costs
    calculateCosts();
}

// Get unit for a product type
function getUnitForProductType(productName, productType) {
    const product = products.find(p => {
        return p.Product_Name === productName && p.Sub_Type === productType;
    });
    return product ? (product.Unit || '') : '';
}

// Update product types based on selected manufacturer and product
function updateProductTypes() {
    const manufacturerName = document.getElementById('manufacturerName').value;
    const productName = document.getElementById('productName').value;
    const productTypeSelect = document.getElementById('productType');
    const unitDisplay = document.getElementById('unitDisplay');
    
    productTypeSelect.innerHTML = '<option value="">Select product type...</option>';
    productTypeSelect.disabled = !manufacturerName || !productName;
    unitDisplay.textContent = ''; // Clear unit display
    
    // Note: Subtype index is built on-the-fly in findBestOptionWithStrategy
    // No need to rebuild here as it's dynamic per product

    if (manufacturerName && productName) {
        const manufacturer = manufacturers.find(m => m.Manufacturer_Name === manufacturerName);
        if (manufacturer) {
            const availableTypes = getManufacturerProductTypes(manufacturer, productName);
            
            if (availableTypes.length > 0) {
                availableTypes.forEach(type => {
                    const option = new Option(type, type);
                    productTypeSelect.appendChild(option);
                });
                productTypeSelect.disabled = false;
            } else {
                productTypeSelect.disabled = true;
            }
        }
    }
    
    calculateCosts();
}

// Calculate costs - now uses Google Maps API for distance
async function calculateCosts() {
    console.log('=== calculateCosts() called ===');
    
    const manufacturerName = document.getElementById('manufacturerName').value;
    const productName = document.getElementById('productName').value;
    const productType = document.getElementById('productType').value;
    const quantity = parseFloat(document.getElementById('quantity').value) || 0;
    const fromLocation = document.getElementById('fromLocation').value.trim();
    const toLocation = document.getElementById('toLocation').value.trim();

    const summary = document.getElementById('orderSummary');
    let manufacturerCost = 0;
    let transportCost = 0;
    let pricePerUnit = 0;
    let unit = '';
    let distanceKm = 0;

    // Get unit for the selected product type
    if (productName && productType) {
        unit = getUnitForProductType(productName, productType);
    }

    // Calculate manufacturer cost and get price per unit
    if (manufacturerName && productType) {
        const manufacturer = manufacturers.find(m => m.Manufacturer_Name === manufacturerName);
        if (manufacturer) {
            const prices = parsePrices(manufacturer['Product_Prices (Rs.)']);
            const typeLower = productType.toLowerCase().trim();
            let matchedPrice = null;
            
            for (const [key, price] of Object.entries(prices)) {
                const keyLower = key.toLowerCase().trim();
                
                // Exact match
                if (keyLower === typeLower) {
                    matchedPrice = price;
                    break;
                }
                
                // Specific matches for W-Beam types
                if ((typeLower.includes('w-beam') && keyLower.includes('w-beam') && !typeLower.includes('double') && !keyLower.includes('double') && !typeLower.includes('thrie') && !keyLower.includes('thrie')) ||
                    (typeLower.includes('thrie-beam') && keyLower.includes('thrie-beam')) ||
                    (typeLower.includes('double') && keyLower.includes('double')) ||
                    (typeLower.includes('crash-tested') && keyLower.includes('crash-tested'))) {
                    matchedPrice = price;
                    break;
                }
                
                // Specific matches for Paint types
                if ((typeLower.includes('white') && keyLower.includes('white')) ||
                    (typeLower.includes('yellow') && keyLower.includes('yellow')) ||
                    (typeLower.includes('reflective') && keyLower.includes('reflective'))) {
                    matchedPrice = price;
                    break;
                }
                
                // Generic paint match (only if no specific match found)
                if (!matchedPrice && typeLower.includes('paint') && keyLower.includes('paint')) {
                    matchedPrice = price;
                }
                
                // Signage matches
                if (typeLower.includes('signage') && keyLower.includes('signage')) {
                    matchedPrice = price;
                    break;
                }
            }
            
            if (matchedPrice !== null) {
                pricePerUnit = matchedPrice;
                if (quantity > 0) {
                    manufacturerCost = matchedPrice * quantity;
                }
            }
        }
    }

    // Calculate transport cost using Google Maps API
    if (fromLocation && toLocation && fromLocation !== toLocation) {
        console.log('Calculating transport cost for:', fromLocation, 'to', toLocation);
        
        // Check if Google Maps API is loaded
        if (!window.google || !window.google.maps) {
            console.warn('Google Maps API not loaded yet');
            const distanceDisplay = document.getElementById('distanceDisplay');
            if (distanceDisplay) {
                distanceDisplay.textContent = 'Loading Google Maps...';
            }
            // Wait a bit and try again
            setTimeout(() => {
                calculateCosts().catch(err => console.error('Error in retry:', err));
            }, 1000);
            return;
        }
        
        try {
            // Get coordinates using Geocoding API
            console.log('Getting coordinates for addresses...');
            const fromCoords = await getCoordinatesFromAddress(fromLocation);
            const toCoords = await getCoordinatesFromAddress(toLocation);
            console.log('Coordinates obtained:', fromCoords, toCoords);
            
            // Get driving distance using Distance Matrix API
            console.log('Getting driving distance...');
            const distanceResult = await getDrivingDistance(fromCoords.formatted_address, toCoords.formatted_address);
            distanceKm = distanceResult.distance;
            transportCost = distanceKm * ratePerKm;
            console.log('Distance calculated:', distanceKm, 'km, Cost:', transportCost);
            
            // Display distance in summary
            const distanceDisplay = document.getElementById('distanceDisplay');
            if (distanceDisplay) {
                distanceDisplay.textContent = `${distanceKm.toFixed(2)} km`;
            }
        } catch (error) {
            console.error('Error calculating transport cost:', error);
            // Show error message
            const distanceDisplay = document.getElementById('distanceDisplay');
            if (distanceDisplay) {
                if (error.message && error.message.includes('Invalid')) {
                    distanceDisplay.textContent = 'Invalid address';
                } else {
                    distanceDisplay.textContent = 'Error calculating distance';
                }
            }
            transportCost = 0;
        }
    } else {
        // Clear distance if locations are not valid
        const distanceDisplay = document.getElementById('distanceDisplay');
        if (distanceDisplay) {
            distanceDisplay.textContent = '-';
        }
    }

    const totalCost = manufacturerCost + transportCost;

    // Update unit display
    const unitDisplay = document.getElementById('unitDisplay');
    if (unit) {
        unitDisplay.textContent = `(per ${unit})`;
    } else {
        unitDisplay.textContent = '';
    }

    // Update display
    if (manufacturerCost > 0 || transportCost > 0) {
        if (pricePerUnit > 0 && unit) {
            document.getElementById('pricePerUnitDisplay').textContent = `₹${pricePerUnit.toFixed(2)} per ${unit}`;
        } else {
            document.getElementById('pricePerUnitDisplay').textContent = '₹0';
        }
        document.getElementById('manufacturerCostDisplay').textContent = `₹${manufacturerCost.toFixed(2)}`;
        document.getElementById('transportCostDisplay').textContent = `₹${transportCost.toFixed(2)}`;
        document.getElementById('totalCostDisplay').textContent = `₹${totalCost.toFixed(2)}`;
        summary.style.display = 'block';
    } else {
        document.getElementById('pricePerUnitDisplay').textContent = '₹0';
        summary.style.display = 'none';
    }
}

// Save orders - no longer using localStorage, data is in database
async function saveOrders() {
    // Orders are now stored in database via API
    // Update homepage count
    if (typeof updateTotalOrders === 'function') {
        await updateTotalOrders();
    }
}

// Load orders from API (this function is already async and uses API, keeping for compatibility)
async function loadOrders() {
    try {
        console.log('Loading orders from API...');
        const fetchedOrders = await ordersAPI.getAll();
        console.log('Orders fetched:', fetchedOrders?.length || 0);
        
        if (fetchedOrders && fetchedOrders.length > 0) {
        orders = fetchedOrders.map(order => ({
                id: order._id || order.id,
                orderId: order.orderId || `ORD-${String(order._id || order.id).slice(-6)}`,
                date: order.createdAt ? new Date(order.createdAt).toLocaleDateString('en-IN', { year: 'numeric', month: 'short', day: 'numeric' }) : 'N/A',
                manufacturerName: order.manufacturer || order.manufacturerName || '',
                productName: order.product || order.productName || '',
                productType: order.productType || '',
                quantity: order.quantity || 0,
                fromLocation: order.fromLocation || '',
                toLocation: order.toLocation || '',
                manufacturerCost: order.productCost || order.manufacturerCost || 0,
                transportCost: order.transportCost || 0,
                totalCost: order.totalCost || 0
            }));
            console.log('Orders processed:', orders.length);
        } else {
            orders = [];
            console.log('No orders found');
        }
        
        displayOrders();
        
        // Update total orders count if function exists
        if (typeof updateTotalOrders === 'function') {
        updateTotalOrders();
        }
    } catch (error) {
        console.error('Error loading orders:', error);
        console.error('Error details:', error.message);
        orders = [];
        displayOrders();
        
        // Update total orders count if function exists
        if (typeof updateTotalOrders === 'function') {
        updateTotalOrders();
        }
    }
}

// Store order ID mapping for search
let orderIdMap = new Map(); // Maps "1", "2", "3" -> order object
let currentlyDisplayedOrders = []; // Store currently displayed/filtered orders for export

// Build order ID map from all orders (sorted by date)
function buildOrderIdMap() {
    orderIdMap.clear();
    
    if (orders.length === 0) {
        return;
    }
    
    // Sort all orders by date (newest first) for consistent ordering
    const sortedOrders = [...orders].sort((a, b) => {
        const dateA = new Date(a.createdAt || a.date || 0);
        const dateB = new Date(b.createdAt || b.date || 0);
        return dateB - dateA; // Newest first
    });
    
    // Build map: order ID (1, 2, 3...) -> order object
    sortedOrders.forEach((order, index) => {
        const orderId = index + 1;
        orderIdMap.set(String(orderId), order);
    });
}

// Display orders
function displayOrders(filteredOrders = null) {
    const tbody = document.getElementById('ordersTableBody');
    
    if (!tbody) {
        console.error('Orders table body element not found');
        return;
    }
    
    // Always rebuild the full order ID map from all orders
    buildOrderIdMap();
    
    const ordersToDisplay = filteredOrders || orders;
    
    // Store currently displayed orders for export
    currentlyDisplayedOrders = ordersToDisplay;
    
    if (ordersToDisplay.length === 0) {
        tbody.innerHTML = '<tr><td colspan="12" style="text-align: center; color: #999; padding: 40px;">No orders found.</td></tr>';
        currentlyDisplayedOrders = [];
        return;
    }

    // Sort orders to display by date (newest first) for consistent ordering
    const sortedOrders = [...ordersToDisplay].sort((a, b) => {
        const dateA = new Date(a.createdAt || a.date || 0);
        const dateB = new Date(b.createdAt || b.date || 0);
        return dateB - dateA; // Newest first
    });
    
    // Find the order ID for each order in the full sorted list
    const allSortedOrders = [...orders].sort((a, b) => {
        const dateA = new Date(a.createdAt || a.date || 0);
        const dateB = new Date(b.createdAt || b.date || 0);
        return dateB - dateA;
    });
    
    tbody.innerHTML = sortedOrders.map((order) => {
        // Find the index of this order in the full sorted list to get its order ID
        const orderIndex = allSortedOrders.findIndex(o => 
            (o.id || o._id) === (order.id || order._id)
        );
        const orderId = orderIndex >= 0 ? orderIndex + 1 : '?';
        
        return `
            <tr>
                <td>${orderId}</td>
                <td>${order.date}</td>
                <td>${escapeHtml(order.manufacturerName)}</td>
                <td>${escapeHtml(order.productName)}</td>
                <td>${escapeHtml(order.productType)}</td>
                <td>${order.quantity}</td>
                <td>${escapeHtml(order.fromLocation)}</td>
                <td>${escapeHtml(order.toLocation)}</td>
                <td>₹${order.manufacturerCost.toFixed(2)}</td>
                <td>₹${order.transportCost.toFixed(2)}</td>
                <td>₹${order.totalCost.toFixed(2)}</td>
                <td>
                    <button 
                        onclick="deleteOrder('${order.id}', '${orderId}')" 
                        class="delete-btn" 
                        style="background: #dc3545; color: white; border: none; padding: 6px 12px; border-radius: 4px; cursor: pointer; font-size: 0.9rem;"
                        title="Delete this order"
                    >
                        🗑️ Delete
                    </button>
                </td>
            </tr>
        `;
    }).join('');
}

function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

// Delete order function
async function deleteOrder(orderId, orderIdDisplay) {
    // Confirm deletion
    const confirmMessage = `Are you sure you want to delete order ${orderIdDisplay}?\n\nThis action cannot be undone.`;
    if (!confirm(confirmMessage)) {
        return;
    }

    try {
        // Call API to delete order
        await ordersAPI.delete(orderId);
        
        // Remove order from local array
        orders = orders.filter(order => order.id !== orderId);
        
        // Refresh display
        displayOrders();
        
        // Update total orders count if function exists
        if (typeof updateTotalOrders === 'function') {
            updateTotalOrders();
        }
        
        // Show success message
        alert(`Order ${orderIdDisplay} deleted successfully!`);
    } catch (error) {
        console.error('Error deleting order:', error);
        const errorMessage = error.message || 'Failed to delete order. Please try again.';
        
        // Check if it's an authorization error
        if (errorMessage.includes('401') || errorMessage.includes('Unauthorized') || errorMessage.includes('admin')) {
            alert('You do not have permission to delete orders. Only administrators can delete orders.');
        } else {
            alert(`Error: ${errorMessage}`);
        }
    }
}

// Make deleteOrder globally accessible
window.deleteOrder = deleteOrder;

// Handle form submission with validation
async function handleFormSubmit(e) {
    e.preventDefault();
    
    // Remove previous errors
    const orderForm = document.getElementById('orderForm');
    const formContainer = orderForm?.closest('.form-container') || orderForm?.parentElement || document.querySelector('.create-order-section');
    if (formContainer) {
        removeValidationError(formContainer);
    }
    
    const manufacturerName = document.getElementById('manufacturerName')?.value.trim();
    const productName = document.getElementById('productName')?.value.trim();
    const productType = document.getElementById('productType')?.value.trim();
    const quantityInput = document.getElementById('quantity')?.value.trim();
    const fromLocation = document.getElementById('fromLocation')?.value.trim();
    const toLocation = document.getElementById('toLocation')?.value.trim();

    // Validate all fields
    let isValid = true;
    let firstError = '';

    // Validate manufacturer
    if (!manufacturerName) {
        isValid = false;
        firstError = 'Please select a manufacturer';
        if (formContainer) showValidationError(firstError, formContainer);
        const field = document.getElementById('manufacturerName');
        if (field) field.style.borderColor = '#c33';
    } else {
        // Check if manufacturer exists in database
        const manufacturer = manufacturers.find(m => m.Manufacturer_Name === manufacturerName);
        if (!manufacturer) {
            isValid = false;
            firstError = 'Selected manufacturer does not exist in database';
            if (formContainer) showValidationError(firstError, formContainer);
            const field = document.getElementById('manufacturerName');
            if (field) field.style.borderColor = '#c33';
        } else {
            const field = document.getElementById('manufacturerName');
            if (field) field.style.borderColor = '';
        }
    }

    // Validate product name
    if (isValid || !firstError) {
        if (!productName) {
            isValid = false;
            if (!firstError) firstError = 'Please select a product';
            if (formContainer && isValid) showValidationError(firstError, formContainer);
            const field = document.getElementById('productName');
            if (field) field.style.borderColor = '#c33';
        } else {
            // Check if product belongs to selected manufacturer
            if (manufacturerName) {
                const manufacturer = manufacturers.find(m => m.Manufacturer_Name === manufacturerName);
                if (manufacturer) {
                    const availableProducts = getManufacturerProducts(manufacturer);
                    if (!availableProducts.includes(productName)) {
                        isValid = false;
                        if (!firstError) firstError = 'Selected product is not offered by this manufacturer';
                        if (formContainer && isValid) showValidationError(firstError, formContainer);
                        const field = document.getElementById('productName');
                        if (field) field.style.borderColor = '#c33';
                    } else {
                        const field = document.getElementById('productName');
                        if (field) field.style.borderColor = '';
                    }
                }
            } else {
                const field = document.getElementById('productName');
                if (field) field.style.borderColor = '';
            }
        }
    }

    // Validate product type
    if (isValid || !firstError) {
        if (!productType) {
            isValid = false;
            if (!firstError) firstError = 'Please select a product type';
            if (formContainer && isValid) showValidationError(firstError, formContainer);
            const field = document.getElementById('productType');
            if (field) field.style.borderColor = '#c33';
        } else {
            // Check if product type matches selected product
            if (manufacturerName && productName) {
                const manufacturer = manufacturers.find(m => m.Manufacturer_Name === manufacturerName);
                if (manufacturer) {
                    const availableTypes = getManufacturerProductTypes(manufacturer, productName);
                    if (!availableTypes.includes(productType)) {
                        isValid = false;
                        if (!firstError) firstError = 'Selected product type does not match the selected product';
                        if (formContainer && isValid) showValidationError(firstError, formContainer);
                        const field = document.getElementById('productType');
                        if (field) field.style.borderColor = '#c33';
                    } else {
                        const field = document.getElementById('productType');
                        if (field) field.style.borderColor = '';
                    }
                }
            } else {
                const field = document.getElementById('productType');
                if (field) field.style.borderColor = '';
            }
        }
    }

    // Validate quantity
    if (isValid || !firstError) {
        const quantityResult = validateNumeric(quantityInput, 'Quantity', false, 0.01);
        if (!quantityResult.valid) {
            isValid = false;
            if (!firstError) firstError = quantityResult.message;
            if (formContainer && isValid) showValidationError(firstError, formContainer);
            const field = document.getElementById('quantity');
            if (field) field.style.borderColor = '#c33';
        } else {
            const field = document.getElementById('quantity');
            if (field) field.style.borderColor = '';
        }
    }

    // Validate from location
    if (isValid || !firstError) {
        const fromLocationResult = validateLocation(fromLocation);
        if (!fromLocationResult.valid) {
            isValid = false;
            if (!firstError) firstError = 'From location: ' + fromLocationResult.message;
            if (formContainer && isValid) showValidationError(firstError, formContainer);
            const field = document.getElementById('fromLocation');
            if (field) field.style.borderColor = '#c33';
        } else {
            const field = document.getElementById('fromLocation');
            if (field) field.style.borderColor = '';
        }
    }

    // Validate to location
    if (isValid || !firstError) {
        const toLocationResult = validateLocation(toLocation);
        if (!toLocationResult.valid) {
            isValid = false;
            if (!firstError) firstError = 'To location: ' + toLocationResult.message;
            if (formContainer && isValid) showValidationError(firstError, formContainer);
            const field = document.getElementById('toLocation');
            if (field) field.style.borderColor = '#c33';
        } else {
            const field = document.getElementById('toLocation');
            if (field) field.style.borderColor = '';
        }
    }

    // Check if locations are different
    if (isValid && fromLocation && toLocation && fromLocation.toLowerCase() === toLocation.toLowerCase()) {
        isValid = false;
        if (!firstError) firstError = 'From location and To location cannot be the same';
        if (formContainer) showValidationError(firstError, formContainer);
        const fromField = document.getElementById('fromLocation');
        const toField = document.getElementById('toLocation');
        if (fromField) fromField.style.borderColor = '#c33';
        if (toField) toField.style.borderColor = '#c33';
    }

    if (!isValid) {
        return; // Stop submission
    }

    const quantity = parseFloat(quantityInput);

    // Recalculate costs
    let manufacturerCost = 0;
    let transportCost = 0;

    const manufacturer = manufacturers.find(m => m.Manufacturer_Name === manufacturerName);
    if (manufacturer && productType) {
        const prices = parsePrices(manufacturer['Product_Prices (Rs.)']);
        const typeLower = productType.toLowerCase().trim();
        let matchedPrice = null;
        
        for (const [key, price] of Object.entries(prices)) {
            const keyLower = key.toLowerCase().trim();
            
            // Exact match
            if (keyLower === typeLower) {
                matchedPrice = price;
                break;
            }
            
            // Specific matches for W-Beam types
            if ((typeLower.includes('w-beam') && keyLower.includes('w-beam') && !typeLower.includes('double') && !keyLower.includes('double') && !typeLower.includes('thrie') && !keyLower.includes('thrie')) ||
                (typeLower.includes('thrie-beam') && keyLower.includes('thrie-beam')) ||
                (typeLower.includes('double') && keyLower.includes('double')) ||
                (typeLower.includes('crash-tested') && keyLower.includes('crash-tested'))) {
                matchedPrice = price;
                break;
            }
            
            // Specific matches for Paint types
            if ((typeLower.includes('white') && keyLower.includes('white')) ||
                (typeLower.includes('yellow') && keyLower.includes('yellow')) ||
                (typeLower.includes('reflective') && keyLower.includes('reflective'))) {
                matchedPrice = price;
                break;
            }
            
            // Generic paint match (only if no specific match found)
            if (!matchedPrice && typeLower.includes('paint') && keyLower.includes('paint')) {
                matchedPrice = price;
            }
            
            // Signage matches
            if (typeLower.includes('signage') && keyLower.includes('signage')) {
                matchedPrice = price;
                break;
            }
        }
        
        if (matchedPrice !== null) {
            manufacturerCost = matchedPrice * quantity;
        }
    }

    // Calculate transport cost using Google Maps API
    if (fromLocation && toLocation && fromLocation !== toLocation) {
        try {
            // Get coordinates using Geocoding API
            const fromCoords = await getCoordinatesFromAddress(fromLocation);
            const toCoords = await getCoordinatesFromAddress(toLocation);
            
            // Get driving distance using Distance Matrix API
            const distanceResult = await getDrivingDistance(fromCoords.formatted_address, toCoords.formatted_address);
            const distanceKm = distanceResult.distance;
            transportCost = distanceKm * ratePerKm;
        } catch (error) {
            console.error('Error calculating transport cost in form submit:', error);
            // Set transport cost to 0 if calculation fails
            transportCost = 0;
        }
    }

    const totalCost = manufacturerCost + transportCost;
    const orderDate = new Date().toLocaleDateString('en-IN', { 
        year: 'numeric', 
        month: 'short', 
        day: 'numeric' 
    });

    // Check for duplicates before submission
    const orderData = {
        manufacturer: manufacturerName,  // Backend expects 'manufacturer'
        product: productName,          // Backend expects 'product'
        productType,
        quantity: parseFloat(quantity),
        fromLocation,
        toLocation,
        transportCost: parseFloat(transportCost) || 0,
        productCost: parseFloat(manufacturerCost) || 0,  // Backend expects 'productCost'
        totalCost: parseFloat(totalCost)
    };
    
    const duplicateCheck = isDuplicateOrder(orderData, orders);
    
    if (duplicateCheck.isDuplicate) {
        const userChoice = await showDuplicateWarning(duplicateCheck, 'order');
        
        if (userChoice === 'cancel') {
            return; // User cancelled
        } else if (userChoice === 'view') {
            // Scroll to existing order (if possible) or just cancel
            alert('Please review the existing order in the "Past Orders" tab above.');
            return;
        }
        // If user chose 'proceed', continue with submission
    }

    try {
        // Save order via API
        const savedOrder = await ordersAPI.create(orderData);
        
        if (!savedOrder) {
            throw new Error('No order data returned from server');
        }
        
        // Add to local array for display - map backend fields to frontend format
        const order = {
            id: savedOrder._id || savedOrder.id,
            orderId: savedOrder.orderId || `ORD-${Date.now()}`,
            manufacturerName: savedOrder.manufacturer || orderData.manufacturer,
            productName: savedOrder.product || orderData.product,
            productType: savedOrder.productType || orderData.productType,
            quantity: savedOrder.quantity || orderData.quantity,
            fromLocation: savedOrder.fromLocation || orderData.fromLocation,
            toLocation: savedOrder.toLocation || orderData.toLocation,
            transportCost: savedOrder.transportCost || orderData.transportCost,
            manufacturerCost: savedOrder.productCost || orderData.productCost,
            totalCost: savedOrder.totalCost || orderData.totalCost,
            date: orderDate
        };
        orders.push(order);
        displayOrders();
        
        // Update total orders count if function exists
        if (typeof updateTotalOrders === 'function') {
        updateTotalOrders();
        }
        
        // Show success message
        alert('Order added successfully!');
        
        // Notify other pages via localStorage event
        window.dispatchEvent(new CustomEvent('orderAdded'));
    } catch (error) {
        console.error('Error saving order:', error);
        
        // Check if error is about duplicate (409 status)
        if (error.status === 409 || (error.message && (error.message.includes('duplicate') || error.message.includes('Duplicate')))) {
            const duplicateInfo = {
                isDuplicate: true,
                match: error.existing || null,
                score: 0.95,
                reason: error.message || 'A duplicate order already exists'
            };
            const userChoice = await showDuplicateWarning(duplicateInfo, 'order');
            if (userChoice === 'cancel' || userChoice === 'view') {
                return;
            }
            // If user chose 'proceed', we can't continue because backend rejected it
            alert('Cannot proceed with duplicate order. The backend has rejected this entry.');
            return;
        }
        
        alert('Failed to save order: ' + (error.message || 'Please try again.'));
        return;
    }

    // Reset form
    document.getElementById('orderForm').reset();
    document.getElementById('productName').innerHTML = '<option value="">Select product...</option>';
    document.getElementById('productName').disabled = true;
    document.getElementById('productType').innerHTML = '<option value="">Select product type...</option>';
    document.getElementById('productType').disabled = true;
    document.getElementById('orderSummary').style.display = 'none';

    // Switch to view orders tab
    switchTab('view');
}

// Export to Excel
function exportToExcel() {
    try {
        // Use currently displayed orders (filtered results) instead of all orders
        const ordersToExport = currentlyDisplayedOrders.length > 0 ? currentlyDisplayedOrders : orders;
        
        if (ordersToExport.length === 0) {
            alert('No orders to export.');
            return;
        }

        // Sort orders by date for consistent ordering
        const sortedOrders = [...ordersToExport].sort((a, b) => {
            const dateA = new Date(a.createdAt || a.date || 0);
            const dateB = new Date(b.createdAt || b.date || 0);
            return dateB - dateA;
        });
        
        // Get all sorted orders to find correct order IDs
        const allSortedOrders = [...orders].sort((a, b) => {
            const dateA = new Date(a.createdAt || a.date || 0);
            const dateB = new Date(b.createdAt || b.date || 0);
            return dateB - dateA;
        });

        // Prepare data for export
        const exportData = sortedOrders.map((order) => {
            // Find the order ID in the full sorted list
            const orderIndex = allSortedOrders.findIndex(o => 
                (o.id || o._id) === (order.id || order._id)
            );
            const orderId = orderIndex >= 0 ? orderIndex + 1 : '?';
            
            return {
                'Order ID': orderId,
            'Date': order.date || '',
            'Manufacturer': order.manufacturerName || '',
            'Product': order.productName || '',
            'Product Type': order.productType || '',
            'Quantity': order.quantity || 0,
            'From Location': order.fromLocation || '',
            'To Location': order.toLocation || '',
            'Manufacturer Cost (₹)': order.manufacturerCost ? order.manufacturerCost.toFixed(2) : '0.00',
            'Transport Cost (₹)': order.transportCost ? order.transportCost.toFixed(2) : '0.00',
            'Total Cost (₹)': order.totalCost ? order.totalCost.toFixed(2) : '0.00'
            };
        });

        // Create workbook and worksheet
        const ws = XLSX.utils.json_to_sheet(exportData);
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, 'Orders');

        // Set column widths
        const colWidths = [
            { wch: 12 }, // Order ID
            { wch: 15 }, // Date
            { wch: 25 }, // Manufacturer
            { wch: 25 }, // Product
            { wch: 20 }, // Product Type
            { wch: 10 }, // Quantity
            { wch: 25 }, // From Location
            { wch: 25 }, // To Location
            { wch: 18 }, // Manufacturer Cost
            { wch: 18 }, // Transport Cost
            { wch: 15 }  // Total Cost
        ];
        ws['!cols'] = colWidths;

        // Export file
        const fileName = `Orders_${new Date().toISOString().split('T')[0]}.xlsx`;
        XLSX.writeFile(wb, fileName);
    } catch (error) {
        console.error('Error exporting to Excel:', error);
        alert('Error exporting to Excel. Please try again.');
    }
}

// Export to PDF
function exportToPDF() {
    try {
        // Use currently displayed orders (filtered results) instead of all orders
        const ordersToExport = currentlyDisplayedOrders.length > 0 ? currentlyDisplayedOrders : orders;
        
        if (ordersToExport.length === 0) {
            alert('No orders to export.');
            return;
        }

        const { jsPDF } = window.jspdf;
        const doc = new jsPDF('l', 'mm', 'a4'); // Landscape orientation

        // Title
        doc.setFontSize(16);
        doc.setFont(undefined, 'bold');
        doc.text('Past Orders', 14, 15);

        // Date
        doc.setFontSize(10);
        doc.setFont(undefined, 'normal');
        doc.text(`Generated on: ${new Date().toLocaleDateString()}`, 14, 22);
        
        // Show filter info if filtered
        if (currentlyDisplayedOrders.length > 0 && currentlyDisplayedOrders.length < orders.length) {
            doc.text(`Showing ${currentlyDisplayedOrders.length} of ${orders.length} orders`, 14, 28);
        }

        // Sort orders by date for consistent ordering
        const sortedOrders = [...ordersToExport].sort((a, b) => {
            const dateA = new Date(a.createdAt || a.date || 0);
            const dateB = new Date(b.createdAt || b.date || 0);
            return dateB - dateA;
        });
        
        // Get all sorted orders to find correct order IDs
        const allSortedOrders = [...orders].sort((a, b) => {
            const dateA = new Date(a.createdAt || a.date || 0);
            const dateB = new Date(b.createdAt || b.date || 0);
            return dateB - dateA;
        });

        // Prepare table data
        const tableData = sortedOrders.map((order) => {
            // Find the order ID in the full sorted list
            const orderIndex = allSortedOrders.findIndex(o => 
                (o.id || o._id) === (order.id || order._id)
            );
            const orderId = orderIndex >= 0 ? orderIndex + 1 : '?';
            
            return [
                orderId,
            order.date || '',
            order.manufacturerName || '',
            order.productName || '',
            order.productType || '',
            order.quantity || 0,
            order.fromLocation || '',
            order.toLocation || '',
            order.manufacturerCost ? `₹${order.manufacturerCost.toFixed(2)}` : '₹0.00',
            order.transportCost ? `₹${order.transportCost.toFixed(2)}` : '₹0.00',
            order.totalCost ? `₹${order.totalCost.toFixed(2)}` : '₹0.00'
            ];
        });

        // Create table
        const startY = currentlyDisplayedOrders.length > 0 && currentlyDisplayedOrders.length < orders.length ? 35 : 28;
        doc.autoTable({
            startY: startY,
            head: [['Order ID', 'Date', 'Manufacturer', 'Product', 'Product Type', 'Quantity', 'From', 'To', 'Mfg Cost (₹)', 'Trans Cost (₹)', 'Total (₹)']],
            body: tableData,
            theme: 'grid',
            headStyles: {
                fillColor: [102, 126, 234],
                textColor: 255,
                fontStyle: 'bold',
                fontSize: 8
            },
            bodyStyles: {
                fontSize: 7
            },
            columnStyles: {
                0: { cellWidth: 20 },
                1: { cellWidth: 20 },
                2: { cellWidth: 25 },
                3: { cellWidth: 25 },
                4: { cellWidth: 20 },
                5: { cellWidth: 15 },
                6: { cellWidth: 25 },
                7: { cellWidth: 25 },
                8: { cellWidth: 20 },
                9: { cellWidth: 20 },
                10: { cellWidth: 20 }
            },
            margin: { left: 14, right: 14 }
        });

        // Save PDF
        const fileName = `Orders_${new Date().toISOString().split('T')[0]}.pdf`;
        doc.save(fileName);
    } catch (error) {
        console.error('Error exporting to PDF:', error);
        alert('Error exporting to PDF. Please try again.');
    }
}

// Tab switching
function switchTab(tabName) {
    // Remove active class from all buttons
    document.querySelectorAll('.tab-button').forEach(btn => {
        btn.classList.remove('active');
    });
    
    // Remove active class from all tab contents
    document.querySelectorAll('.tab-content').forEach(content => {
        content.classList.remove('active');
    });
    
    // Add active class to selected button
    const selectedButton = document.querySelector(`[data-tab="${tabName}"]`);
    if (selectedButton) {
        selectedButton.classList.add('active');
    }
    
    // Show the corresponding tab content
    if (tabName === 'create') {
        const createSection = document.getElementById('createOrderSection');
        if (createSection) {
            createSection.classList.add('active');
        }
    } else if (tabName === 'view') {
        const viewSection = document.getElementById('viewOrdersSection');
        if (viewSection) {
            viewSection.classList.add('active');
        }
        // Refresh orders display when switching to view tab
        displayOrders();
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

// Initialize
document.addEventListener('DOMContentLoaded', async function() {
    console.log('Orders page DOMContentLoaded');
    
    // Check if user is logged in
    if (!checkLogin()) {
        console.log('User not logged in, redirecting...');
        return; // Redirect to login page
    }
    
    console.log('User is logged in, initializing page...');
    
    // Setup logout button - ensure it works properly
    const logoutBtn = document.getElementById('logoutBtn');
    if (logoutBtn) {
        // Remove any existing listeners by cloning
        const newLogoutBtn = logoutBtn.cloneNode(true);
        logoutBtn.parentNode.replaceChild(newLogoutBtn, logoutBtn);
        
        newLogoutBtn.type = 'button';
        newLogoutBtn.addEventListener('click', function(e) {
            e.preventDefault();
            e.stopPropagation();
            console.log('Logout button clicked');
            
            // Clear all authentication data
            localStorage.removeItem('sessionActive');
            localStorage.removeItem('activeUser');
            localStorage.removeItem('rememberMe');
            localStorage.removeItem('authToken');
            localStorage.removeItem('userRole');
            
            // Use global handleLogout if available
            if (typeof window.handleLogout === 'function') {
                window.handleLogout(e);
            } else {
                // Redirect to login page
                window.location.href = 'login.html';
            }
        });
        console.log('✅ Logout button event listener attached');
    } else {
        console.error('❌ Logout button element not found');
    }
    
    // Check if API functions are available
    if (typeof manufacturersAPI === 'undefined') {
        console.error('manufacturersAPI is not defined! Make sure api.js is loaded before orders.js');
        alert('Error: API functions not loaded. Please refresh the page.');
        return;
    }
    
    if (typeof productsAPI === 'undefined') {
        console.error('productsAPI is not defined! Make sure api.js is loaded before orders.js');
        alert('Error: API functions not loaded. Please refresh the page.');
        return;
    }
    
    if (typeof ordersAPI === 'undefined') {
        console.error('ordersAPI is not defined! Make sure api.js is loaded before orders.js');
        alert('Error: API functions not loaded. Please refresh the page.');
        return;
    }
    
    console.log('API functions are available, loading data...');
    
    // Load data and initialize page
    try {
        await loadData();
        console.log('✅ Data loading complete');
        
        // Set up form event listeners after data is loaded
        setTimeout(() => {
            setupFormEventListeners();
        }, 200);
    } catch (error) {
        console.error('❌ Error initializing page:', error);
        console.error('Error stack:', error.stack);
        // Still try to show the page even if data loading fails
        displayOrders();
        alert('Error loading data. Please check the console for details and ensure the backend is running.');
    }
    
    // Build Fuse.js indexes after data loads and dropdowns are populated
    // Wait a bit for cascading dropdowns to initialize
    setTimeout(() => {
        if (typeof buildFuseIndexes === 'function') {
        buildFuseIndexes();
        }
    }, 500);
    
    // Helper function to set up form event listeners
    function setupFormEventListeners() {
        console.log('Setting up form event listeners...');
        
        const manufacturerSelect = document.getElementById('manufacturerName');
        const productNameSelect = document.getElementById('productName');
        const productTypeSelect = document.getElementById('productType');
        const quantityInput = document.getElementById('quantity');
        
        if (manufacturerSelect) {
            // Remove old listener by replacing with new one
            const newManufacturerSelect = manufacturerSelect.cloneNode(true);
            manufacturerSelect.parentNode.replaceChild(newManufacturerSelect, manufacturerSelect);
            
            newManufacturerSelect.addEventListener('change', function() {
                console.log('Manufacturer changed to:', this.value);
                updateProducts();
            });
            console.log('✅ Manufacturer select event listener attached');
        } else {
            console.error('❌ Manufacturer select element not found');
        }
        
        if (productNameSelect) {
            // Remove old listener by replacing with new one
            const newProductNameSelect = productNameSelect.cloneNode(true);
            productNameSelect.parentNode.replaceChild(newProductNameSelect, productNameSelect);
            
            newProductNameSelect.addEventListener('change', updateProductTypes);
            console.log('✅ Product name select event listener attached');
        } else {
            console.error('❌ Product name select element not found');
        }
        
        if (productTypeSelect) {
            // Remove old listener by replacing with new one
            const newProductTypeSelect = productTypeSelect.cloneNode(true);
            productTypeSelect.parentNode.replaceChild(newProductTypeSelect, productTypeSelect);
            
            newProductTypeSelect.addEventListener('change', function() {
                // Update unit display when product type changes
                const productName = document.getElementById('productName')?.value;
                const productType = this.value;
                const unitDisplay = document.getElementById('unitDisplay');
                
                if (productName && productType) {
                    const unit = getUnitForProductType(productName, productType);
                    if (unit) {
                        unitDisplay.textContent = `(per ${unit})`;
                    } else {
                        unitDisplay.textContent = '';
                    }
                } else {
                    unitDisplay.textContent = '';
                }
                
                calculateCosts().catch(err => console.error('Error calculating costs:', err));
            });
            console.log('✅ Product type select event listener attached');
        } else {
            console.error('❌ Product type select element not found');
        }
        
        if (quantityInput) {
            quantityInput.addEventListener('input', function() {
                calculateCosts().catch(err => console.error('Error calculating costs:', err));
            });
            console.log('✅ Quantity input event listener attached');
        } else {
            console.error('❌ Quantity input element not found');
        }
        
        console.log('✅ All form event listeners set up');
    }

    // Tab switching
    document.querySelectorAll('.tab-button').forEach(btn => {
        btn.addEventListener('click', function() {
            const tab = this.getAttribute('data-tab');
            switchTab(tab);
        });
    });
    
    // Setup order search functionality
    setupOrderSearch();

    // Helper function to reload manufacturers data
    async function reloadManufacturersData() {
        try {
            // Reload manufacturers from API
            const manufacturersData = await manufacturersAPI.getAll();
            manufacturers = manufacturersData.map(m => {
                // Handle Products_Offered - can be string or array
                let productsOfferedStr = '';
                if (Array.isArray(m.Products_Offered)) {
                    productsOfferedStr = m.Products_Offered.join(', ');
                } else if (typeof m.Products_Offered === 'string') {
                    productsOfferedStr = m.Products_Offered;
                } else if (m.productsOffered && Array.isArray(m.productsOffered)) {
                    // Backend format - array of objects with productType
                    productsOfferedStr = m.productsOffered.map(p => p.productType).join(', ');
                }
                
                // Handle Product_Prices - can be string or object
                let productPricesStr = '';
                if (m['Product_Prices (Rs.)']) {
                    productPricesStr = m['Product_Prices (Rs.)'];
                } else if (m.productsOffered && Array.isArray(m.productsOffered)) {
                    // Backend format - array of objects with productType and price
                    productPricesStr = m.productsOffered.map(p => `${p.productType}: ${p.price}`).join(', ');
                }
                
                return {
                    Manufacturer_ID: m.Manufacturer_ID,
                    Manufacturer_Name: m.Manufacturer_Name,
                    Location: m.Location,
                    Contact_Number: m.Contact_Number,
                    Products_Offered: productsOfferedStr,
                    'Product_Prices (Rs.)': productPricesStr
                };
            });
            
            // Update manufacturer dropdown
            const manufacturerSelect = document.getElementById('manufacturerName');
            const currentValue = manufacturerSelect ? manufacturerSelect.value : '';
            if (manufacturerSelect) {
                manufacturerSelect.innerHTML = '<option value="">Select manufacturer...</option>';
                const uniqueManufacturers = [...new Set(manufacturers.map(m => m.Manufacturer_Name))];
                uniqueManufacturers.forEach(manufacturerName => {
                    const option = new Option(manufacturerName, manufacturerName);
                    manufacturerSelect.appendChild(option);
                });
                
                // Restore previous selection if it still exists
                if (currentValue) {
                    manufacturerSelect.value = currentValue;
                    updateProducts(); // Refresh products dropdown
                }
            }
        } catch (error) {
            console.error('Error reloading manufacturers:', error);
        }
    }
    
    // Listen for manufacturer updates from other pages
    window.addEventListener('manufacturerAdded', async function() {
        console.log('Manufacturer added event received, reloading manufacturers...');
        await reloadManufacturersData();
    });
    
    // Listen for product updates from other pages
    window.addEventListener('productAdded', async function() {
        console.log('Product added event received, reloading products...');
        try {
            // Reload products from API
            const productsData = await productsAPI.getAll();
            products = productsData.map(p => ({
                Product_ID: p.Product_ID,
                Product_Name: p.Product_Name,
                Sub_Type: p.Sub_Type,
                Unit: p.Unit,
                Notes: p.Notes || ''
            }));
            
            // If a manufacturer is selected, refresh the products dropdown
            const manufacturerName = document.getElementById('manufacturerName')?.value;
            if (manufacturerName) {
                updateProducts();
            }
        } catch (error) {
            console.error('Error reloading products:', error);
        }
    });

    // Form event listeners are now set up in setupFormEventListeners() function above
    // This ensures they're attached after data loads
    
    // Location inputs - debounce calculation to avoid too many API calls
    const fromLocationInput = document.getElementById('fromLocation');
    const toLocationInput = document.getElementById('toLocation');
    
    let locationDebounceTimer = null;
    
    function debouncedCalculateCosts() {
        clearTimeout(locationDebounceTimer);
        locationDebounceTimer = setTimeout(() => {
            const fromVal = fromLocationInput ? fromLocationInput.value.trim() : '';
            const toVal = toLocationInput ? toLocationInput.value.trim() : '';
            
            // Clear distance when typing
            const distanceDisplay = document.getElementById('distanceDisplay');
            if (distanceDisplay) {
                distanceDisplay.textContent = '-';
            }
            
            // Recalculate if both locations are filled
            if (fromVal && toVal && fromVal !== toVal) {
                console.log('Both locations filled, calculating costs...');
                calculateCosts().catch(err => {
                    console.error('Error calculating costs:', err);
                    const distanceDisplay = document.getElementById('distanceDisplay');
                    if (distanceDisplay) {
                        distanceDisplay.textContent = 'Error calculating distance';
                    }
                });
            }
        }, 800); // Wait 800ms after user stops typing
    }
    
    if (fromLocationInput) {
        fromLocationInput.addEventListener('input', debouncedCalculateCosts);
        
        // Setup typo correction for from location field
        if (typeof setupTypoCorrection === 'function') {
            setupTypoCorrection(fromLocationInput, async () => {
                const locationNames = [
                    ...new Set(manufacturers.map(m => m.Location || m.location)),
                    ...Object.keys(locationCoordinates)
                ];
                return locationNames;
            }, {
                autoCorrectThreshold: 0.92,
                suggestionThreshold: 0.85,
                onCorrect: (corrected, original) => {
                    console.log(`Auto-corrected from location "${original}" to "${corrected}"`);
                }
            });
        }
    }
    
    if (toLocationInput) {
        toLocationInput.addEventListener('input', debouncedCalculateCosts);
        
        // Setup typo correction for to location field
        if (typeof setupTypoCorrection === 'function') {
            setupTypoCorrection(toLocationInput, async () => {
                const locationNames = [
                    ...new Set(manufacturers.map(m => m.Location || m.location)),
                    ...Object.keys(locationCoordinates)
                ];
                return locationNames;
            }, {
                autoCorrectThreshold: 0.92,
                suggestionThreshold: 0.85,
                onCorrect: (corrected, original) => {
                    console.log(`Auto-corrected to location "${original}" to "${corrected}"`);
                }
            });
        }
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
    
    const orderForm = document.getElementById('orderForm');
    if (orderForm) {
        orderForm.addEventListener('submit', handleFormSubmit);
    } else {
        console.error('Order form element not found');
    }
    
    // PDF Upload functionality
    setupPdfUpload();
    
    // PDF Confirmation Modal
    setupPdfConfirmationModal();
});

// Setup order search functionality
function setupOrderSearch() {
    const orderIdInput = document.getElementById('orderSearchInput');
    const manufacturerInput = document.getElementById('manufacturerSearchInput');
    const productInput = document.getElementById('productSearchInput');
    const productTypeInput = document.getElementById('productTypeSearchInput');
    const searchBtn = document.getElementById('searchOrderBtn');
    const clearBtn = document.getElementById('clearSearchBtn');
    
    if (!orderIdInput || !manufacturerInput || !productInput || !productTypeInput || !searchBtn || !clearBtn) {
        console.warn('Order search elements not found');
        return;
    }
    
    const performSearch = () => {
        const orderIdTerm = orderIdInput.value.trim();
        const manufacturerTerm = manufacturerInput.value.trim().toLowerCase();
        const productTerm = productInput.value.trim().toLowerCase();
        const productTypeTerm = productTypeInput.value.trim().toLowerCase();
        
        // If no search terms, show all orders
        if (!orderIdTerm && !manufacturerTerm && !productTerm && !productTypeTerm) {
            displayOrders(); // Show all orders
            return;
        }
        
        // If only order ID is provided, use the map
        if (orderIdTerm && !manufacturerTerm && !productTerm && !productTypeTerm) {
            const orderNum = parseInt(orderIdTerm);
            
            if (isNaN(orderNum) || orderNum < 1) {
                const tbody = document.getElementById('ordersTableBody');
                if (tbody) {
                    tbody.innerHTML = '<tr><td colspan="12" style="text-align: center; color: #999; padding: 40px;">Please enter a valid order ID number (e.g., 1, 2, 3)</td></tr>';
                }
                return;
            }
            
            const matchedOrder = orderIdMap.get(String(orderNum));
            
            if (matchedOrder) {
                displayOrders([matchedOrder]);
            } else {
                const tbody = document.getElementById('ordersTableBody');
                if (tbody) {
                    tbody.innerHTML = '<tr><td colspan="12" style="text-align: center; color: #999; padding: 40px;">No order found with ID: ' + escapeHtml(orderIdTerm) + '</td></tr>';
                }
            }
            return;
        }
        
        // Filter orders based on search criteria
        let filteredOrders = orders;
        
        // Filter by order ID if provided
        if (orderIdTerm) {
            const orderNum = parseInt(orderIdTerm);
            if (!isNaN(orderNum) && orderNum >= 1) {
                const matchedOrder = orderIdMap.get(String(orderNum));
                if (matchedOrder) {
                    filteredOrders = [matchedOrder];
                } else {
                    filteredOrders = [];
                }
            } else {
                filteredOrders = [];
            }
        }
        
        // Filter by manufacturer
        if (manufacturerTerm) {
            filteredOrders = filteredOrders.filter(order => {
                const manufacturer = (order.manufacturerName || '').toLowerCase();
                return manufacturer.includes(manufacturerTerm);
            });
        }
        
        // Filter by product
        if (productTerm) {
            filteredOrders = filteredOrders.filter(order => {
                const product = (order.productName || '').toLowerCase();
                return product.includes(productTerm);
            });
        }
        
        // Filter by product type
        if (productTypeTerm) {
            filteredOrders = filteredOrders.filter(order => {
                const productType = (order.productType || '').toLowerCase();
                return productType.includes(productTypeTerm);
            });
        }
        
        // Display filtered results
        if (filteredOrders.length === 0) {
            const tbody = document.getElementById('ordersTableBody');
            if (tbody) {
                tbody.innerHTML = '<tr><td colspan="12" style="text-align: center; color: #999; padding: 40px;">No orders found matching your search criteria.</td></tr>';
            }
            currentlyDisplayedOrders = [];
        } else {
            displayOrders(filteredOrders);
        }
    };
    
    searchBtn.addEventListener('click', performSearch);
    clearBtn.addEventListener('click', () => {
        orderIdInput.value = '';
        manufacturerInput.value = '';
        productInput.value = '';
        productTypeInput.value = '';
        displayOrders();
    });
    
    // Allow Enter key to search on all inputs
    [orderIdInput, manufacturerInput, productInput, productTypeInput].forEach(input => {
        input.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                performSearch();
            }
        });
    });
    
    console.log('✅ Order search functionality set up');
}

// PDF Upload and Parsing Functions
function setupPdfUpload() {
    const pdfFileInput = document.getElementById('pdfFileInput');
    const pdfUploadBtn = document.getElementById('pdfUploadBtn');
    const pdfUploadStatus = document.getElementById('pdfUploadStatus');
    
    if (!pdfFileInput || !pdfUploadBtn) return;
    
    // Set up PDF.js worker
    // PDF extraction now handled by Python backend - no need for pdf.js
    
    // Click button to trigger file input
    pdfUploadBtn.addEventListener('click', () => {
        pdfFileInput.click();
    });
    
    // File input change
    pdfFileInput.addEventListener('change', (e) => {
        console.log('PDF file input changed:', e.target.files);
        const file = e.target.files[0];
        if (file) {
            console.log('Selected file:', file.name, file.type, file.size);
            if (file.type === 'application/pdf' || file.name.toLowerCase().endsWith('.pdf')) {
                handlePdfFile(file);
            } else {
                showPdfStatus('Please upload a valid PDF file.', 'error');
                pdfFileInput.value = '';
            }
        } else {
            console.log('No file selected');
            showPdfStatus('No file selected. Please select a PDF file.', 'error');
        }
    });
    
    // Also support drag and drop on the form area
    const orderForm = document.getElementById('orderForm');
    if (orderForm) {
        orderForm.addEventListener('dragover', (e) => {
            e.preventDefault();
            e.stopPropagation();
        });
        
        orderForm.addEventListener('drop', (e) => {
            e.preventDefault();
            e.stopPropagation();
            
            const files = e.dataTransfer.files;
            if (files.length > 0 && files[0].type === 'application/pdf') {
                handlePdfFile(files[0]);
            } else {
                showPdfStatus('Please upload a valid PDF file.', 'error');
            }
        });
    }
}

async function handlePdfFile(file) {
    showPdfStatus('Reading PDF...', 'info');
    
    try {
        // Get manufacturer list for better matching
        const manufacturerSelect = document.getElementById('manufacturerName');
        let manufacturerList = null;
        if (manufacturerSelect) {
            const manufacturerOptions = Array.from(manufacturerSelect.options)
                .filter(o => o.value)
                .map(o => o.text);
            if (manufacturerOptions.length > 0) {
                manufacturerList = manufacturerOptions;
            }
        }
        
        // Send PDF to Node backend, which forwards to Python service
        const response = await pdfAPI.extract(file, manufacturerList);
        
        // Check if extraction was successful
        if (!response || response.success === false) {
            const errorMsg = response?.error || response?.message || 'PDF extraction failed';
            showPdfStatus(`❌ ${errorMsg}`, 'error');
            return;
        }
        
        // Extract fields from response (Python service returns: success, manufacturer, product, type, quantity, from, to)
        let extractedManufacturer = response.manufacturer || '';
        let extractedProduct = response.product || '';
        let extractedProductType = response.type || ''; // Python service uses 'type' not 'subtype'
        let extractedQuantity = response.quantity || '';
        let extractedFrom = response.from || '';
        let extractedTo = response.to || '';
        
        // Apply typo correction to extracted fields before auto-filling
        let correctedManufacturer = extractedManufacturer;
        let correctedProduct = extractedProduct;
        let correctedProductType = extractedProductType;
        let correctedFrom = extractedFrom;
        let correctedTo = extractedTo;
        
        // Correct manufacturer name using fuzzy matching
        if (correctedManufacturer && typeof autoCorrect === 'function' && manufacturers.length > 0) {
            const manufacturerNames = manufacturers.map(m => m.Manufacturer_Name || m.name || m);
            correctedManufacturer = autoCorrect(correctedManufacturer, manufacturerNames, 0.85);
        }
        
        // Correct product name using fuzzy matching
        if (correctedProduct && typeof autoCorrect === 'function' && products.length > 0) {
            const productNames = [...new Set(products.map(p => p.Product_Name || p.name || p))];
            correctedProduct = autoCorrect(correctedProduct, productNames, 0.85);
        }
        
        // Correct product type using fuzzy matching
        if (correctedProductType && typeof autoCorrect === 'function' && products.length > 0) {
            const allSubtypes = [];
            products.forEach(p => {
                if (p.Sub_Type) allSubtypes.push(p.Sub_Type);
                if (p.subtypes && Array.isArray(p.subtypes)) allSubtypes.push(...p.subtypes);
            });
            correctedProductType = autoCorrect(correctedProductType, [...new Set(allSubtypes)], 0.85);
        }
        
        // Correct location names using fuzzy matching
        if (correctedFrom && typeof autoCorrect === 'function') {
            const locationNames = [
                ...new Set(manufacturers.map(m => m.Location || m.location).filter(Boolean)),
                ...Object.keys(locationCoordinates)
            ];
            correctedFrom = autoCorrect(correctedFrom, locationNames, 0.85);
        }
        
        if (correctedTo && typeof autoCorrect === 'function') {
            const locationNames = [
                ...new Set(manufacturers.map(m => m.Location || m.location).filter(Boolean)),
                ...Object.keys(locationCoordinates)
            ];
            correctedTo = autoCorrect(correctedTo, locationNames, 0.85);
        }
        
        // Convert backend response to the format expected by frontend
        const extractedData = {
            data: {
                manufacturer: correctedManufacturer,
                product: correctedProduct,
                productType: correctedProductType,
                quantity: extractedQuantity,
                from: correctedFrom,
                to: correctedTo
            },
            confidence: {},
            found: false
        };
        
        // Determine if any fields were extracted
        extractedData.found = Object.values(extractedData.data).some(v => v && v.length > 0);
        
        // Assign confidence levels based on whether field was extracted
        Object.keys(extractedData.data).forEach(key => {
            if (extractedData.data[key] && extractedData.data[key].length > 0) {
                // High confidence if field was extracted by backend
                extractedData.confidence[key] = 'high';
            } else {
                extractedData.confidence[key] = 'none';
            }
        });
        
        if (extractedData.found) {
            // Log parsing results for tuning
            logParsingResults(extractedData);
            
            // Directly auto-fill the form without showing modal
            await fillOrderFormFromParsed(extractedData);
            showPdfStatus('✅ PDF processed successfully! Form auto-filled.', 'success');
        } else {
            showPdfStatus('⚠️ Could not read the order details. Please upload a valid order PDF or fill the form manually.', 'warning');
        }
    } catch (error) {
        console.error('Error processing PDF:', error);
        
        // Check if it's a network error (backend not running)
        if (error.message.includes('fetch') || error.message.includes('Failed to fetch')) {
            showPdfStatus('❌ Cannot connect to backend server. Please check your connection.', 'error');
        } else {
            showPdfStatus(`❌ Error processing PDF: ${error.message}`, 'error');
        }
    }
}

// Enhanced PDF parsing with confidence scoring and fuzzy matching
function parsePdfTextWithConfidence(text) {
    const results = {
        data: {},
        confidence: {},
        found: false
    };
    
    // Advanced normalization: remove punctuation, newlines, collapse spaces, lowercase
    const normalizedText = text
        .toLowerCase()                           // Convert to lowercase
        .replace(/\n|\r/g, ' ')                  // Replace newlines with spaces
        .replace(/[^\w\s-]/g, ' ')               // Remove punctuation (keep spaces and hyphens)
        .replace(/\s+/g, ' ')                    // Collapse multiple spaces to single space
        .trim();
    
    // Also keep original lines for line-by-line matching
    const lines = text.split(/\n|\r/).map(line => line.trim()).filter(line => line.length > 0);
    
    // Enhanced extraction patterns with specific keywords as requested
    const patterns = {
        manufacturer: [
            // Keywords: "manufacturer", "mfr", "supplier name", "vendor", "party name"
            /manufacturer\s*[:\\-]\s*([A-Za-z0-9\s,\\.\\-]+?)(?:\s*(?:product|quantity|price|from|to|$|\n))/i,
            /manufacturer\s+name\s*[:\\-]\s*([A-Za-z0-9\s,\\.\\-]+)/i,
            /mfr\s*[:\\-]\s*([A-Za-z0-9\s,\\.\\-]+)/i,
            /mfr\.\s*[:\\-]\s*([A-Za-z0-9\s,\\.\\-]+)/i,
            /supplier\s+name\s*[:\\-]\s*([A-Za-z0-9\s,\\.\\-]+)/i,
            /supplier\s*[:\\-]\s*([A-Za-z0-9\s,\\.\\-]+)/i,
            /vendor\s*[:\\-]\s*([A-Za-z0-9\s,\\.\\-]+)/i,
            /party\s+name\s*[:\\-]\s*([A-Za-z0-9\s,\\.\\-]+)/i,
            /party\s*[:\\-]\s*([A-Za-z0-9\s,\\.\\-]+)/i
        ],
        product: [
            // Keywords: "product", "item", "material", specific keywords (w beam, thrie beam etc.)
            /product\s*[:\\-]\s*([A-Za-z0-9\s,\\.\\-]+?)(?:\s*(?:type|quantity|price|from|to|$|\n))/i,
            /product\s+name\s*[:\\-]\s*([A-Za-z0-9\s,\\.\\-]+)/i,
            /item\s*[:\\-]\s*([A-Za-z0-9\s,\\.\\-]+)/i,
            /material\s*[:\\-]\s*([A-Za-z0-9\s,\\.\\-]+)/i,
            // Specific product keywords
            /(?:w\s*beam|thrie\s*beam|double\s*w\s*beam|crash\s*barrier|thermoplastic\s*paint|signages?)\s*[:\\-]?\s*([A-Za-z0-9\s,\\.\\-]+)/i,
            /(?:w\s*beam|thrie\s*beam|double\s*w\s*beam|crash\s*barrier|thermoplastic\s*paint|signages?)/i
        ],
        productType: [
            // Keywords: "type", "subtype", subtype keywords
            /product\s+type\s*[:\\-]\s*([A-Za-z0-9\s,\\.\\-]+?)(?:\s*(?:quantity|price|from|to|$|\n))/i,
            /type\s*[:\\-]\s*([A-Za-z0-9\s,\\.\\-]+?)(?:\s*(?:quantity|price|from|to|$|\n))/i,
            /subtype\s*[:\\-]\s*([A-Za-z0-9\s,\\.\\-]+)/i,
            /variant\s*[:\\-]\s*([A-Za-z0-9\s,\\.\\-]+)/i,
            // Specific subtype keywords
            /(?:w\s*beam|thrie\s*beam|double\s*w\s*beam|crash\s*tested|white|yellow|reflective|directional|informational|cautionary)\s*[:\\-]?\s*([A-Za-z0-9\s,\\.\\-]+)/i
        ],
        quantity: [
            // Keywords: qty, quantity, ordered, digit-based fallback
            /quantity\s*[:\\-]\s*(\d+)\s*(?:metre|meter|m|kg|piece|pcs|unit|units|mt|mt\.)?/i,
            /qty\s*[:\\-]\s*(\d+)\s*(?:metre|meter|m|kg|piece|pcs|unit|units|mt|mt\.)?/i,
            /qty\.\s*[:\\-]\s*(\d+)\s*(?:metre|meter|m|kg|piece|pcs|unit|units|mt|mt\.)?/i,
            /ordered\s*[:\\-]\s*(\d+)/i,
            /order\s+quantity\s*[:\\-]\s*(\d+)/i,
            // Digit-based fallback - standalone numbers that might be quantities
            /\b(\d{2,})\s*(?:metre|meter|m|kg|piece|pcs|unit|units|mt|mt\.)/i
        ],
        from: [
            // Keywords: "from", "origin", "deliver to", "to", "ship to", "destination"
            /from\s*[:\\-]\s*([A-Za-z0-9\s,\\.\\-]+?)(?:\s*(?:to|destination|delivery|transport|$|\n))/i,
            /origin\s*[:\\-]\s*([A-Za-z0-9\s,\\.\\-]+)/i,
            /deliver\s+from\s*[:\\-]\s*([A-Za-z0-9\s,\\.\\-]+)/i,
            /ship\s+from\s*[:\\-]\s*([A-Za-z0-9\s,\\.\\-]+)/i,
            /pickup\s*[:\\-]\s*([A-Za-z0-9\s,\\.\\-]+)/i,
            /source\s*[:\\-]\s*([A-Za-z0-9\s,\\.\\-]+)/i
        ],
        to: [
            // Keywords: "to", "deliver to", "ship to", "destination"
            /to\s*[:\\-]\s*([A-Za-z0-9\s,\\.\\-]+?)(?:\s*(?:transport|rate|distance|estimated|$|\n))/i,
            /deliver\s+to\s*[:\\-]\s*([A-Za-z0-9\s,\\.\\-]+)/i,
            /ship\s+to\s*[:\\-]\s*([A-Za-z0-9\s,\\.\\-]+)/i,
            /destination\s*[:\\-]\s*([A-Za-z0-9\s,\\.\\-]+)/i,
            /delivery\s*[:\\-]\s*([A-Za-z0-9\s,\\.\\-]+)/i,
            /drop\s*[:\\-]\s*([A-Za-z0-9\s,\\.\\-]+)/i
        ],
        price: [
            /price\s+per\s+(?:metre|meter|m|kg|piece|unit)\s*[:\\-]\s*([^\n\r,;]+)/i,
            /price\s*[:\\-]\s*([^\n\r,;]+)/i,
            /rate\s*[:\\-]\s*([^\n\r,;]+)/i,
            /unit\s+price\s*[:\\-]\s*([^\n\r,;]+)/i,
            /cost\s*[:\\-]\s*([^\n\r,;]+)/i
        ]
    };
    
    // Try labeled extraction first (high confidence)
    for (const [key, patternList] of Object.entries(patterns)) {
        let matched = false;
        for (const pattern of patternList) {
            // Try both normalized text and original lines
            let match = normalizedText.match(pattern);
            if (!match) {
                // Try matching against individual lines
                for (const line of lines) {
                    match = line.match(pattern);
                    if (match) break;
                }
            }
            
            if (match) {
                let value = match[1] ? match[1].trim() : match[0].trim();
                
                // Special handling for product keyword matches (where match[1] might be undefined)
                if (key === 'product' && !match[1] && match[0]) {
                    // Extract the product keyword itself (e.g., "W Beam", "Thrie Beam")
                    const productKeywords = ['w beam', 'thrie beam', 'double w beam', 'crash barrier', 'thermoplastic paint', 'signage', 'signages'];
                    const matchedKeyword = productKeywords.find(kw => match[0].toLowerCase().includes(kw));
                    if (matchedKeyword) {
                        value = matchedKeyword;
                    } else {
                        value = match[0].replace(/[^\w\s-]/g, ' ').replace(/\s+/g, ' ').trim();
                    }
                }
                
                // Special cleaning for different field types
                if (key === 'quantity') {
                    // Extract only numbers from quantity - handle "Qty: 250 MT." or "250 metre"
                    const numMatch = value.match(/(\d+)/);
                    if (numMatch) {
                        value = numMatch[1];
                    }
                } else if (key === 'from' || key === 'to') {
                    // Clean location - remove extra words like "Location", "Address", "Deliver To:"
                    value = value.replace(/\s*(location|address|city|state|deliver\s+to|deliver\s+from)\s*:?\s*/gi, '').trim();
                    // Remove trailing commas, semicolons, periods
                    value = value.replace(/[,;.]+$/, '').trim();
                    // Remove leading "To:" or "From:" if still present
                    value = value.replace(/^(to|from)\s*:?\s*/i, '').trim();
                } else if (key === 'productType') {
                    // Normalize product type - handle variations like "Double W Beam" vs "Double W-Beam"
                    value = value.replace(/\s+/g, ' ').trim();
                    // Normalize hyphens
                    value = value.replace(/\s*-\s*/g, '-');
                } else if (key === 'manufacturer') {
                    // Clean manufacturer name - remove common suffixes but keep the name
                    value = value.replace(/\s*[,;.]+$/, '').trim();
                } else {
                    // General cleanup
                    value = value.replace(/[,;.]+$/, '').trim();
                }
                
                if (value && value.length > 0) {
                    results.data[key] = value;
                    results.confidence[key] = 'high';
                    matched = true;
                    break;
                }
            }
        }
        if (!matched) {
            results.confidence[key] = 'none';
        }
    }
    
    // If some fields are missing, try fuzzy matching
    const missingFields = Object.keys(patterns).filter(key => !results.data[key]);
    
    if (missingFields.length > 0) {
        // Get reference lists for fuzzy matching
        const referenceLists = getReferenceLists();
        
        // Try fuzzy matching for missing fields
        for (const field of missingFields) {
            const fuzzyResult = fuzzyMatchField(field, lines, referenceLists[field]);
            if (fuzzyResult) {
                results.data[field] = fuzzyResult.value;
                results.confidence[field] = fuzzyResult.confidence;
            }
        }
    }
    
    // Check if we found at least one field
    results.found = Object.keys(results.data).length > 0;
    
    return results;
}

// Get reference lists for fuzzy matching
function getReferenceLists() {
    const lists = {
        manufacturer: [],
        product: [],
        productType: [],
        from: [],
        to: []
    };
    
    // Get manufacturers
    const manufacturerSelect = document.getElementById('manufacturerName');
    if (manufacturerSelect) {
        for (let i = 0; i < manufacturerSelect.options.length; i++) {
            if (manufacturerSelect.options[i].value) {
                lists.manufacturer.push(manufacturerSelect.options[i].text);
            }
        }
    }
    
    // Get products
    const productSelect = document.getElementById('productName');
    if (productSelect) {
        for (let i = 0; i < productSelect.options.length; i++) {
            if (productSelect.options[i].value) {
                lists.product.push(productSelect.options[i].text);
            }
        }
    }
    
    // Get product types (from products data)
    if (products && products.length > 0) {
        const uniqueTypes = new Set();
        products.forEach(p => {
            if (p.Sub_Type) uniqueTypes.add(p.Sub_Type);
        });
        lists.productType = Array.from(uniqueTypes);
    }
    
    // Get locations (from locations data)
    if (locations && locations.length > 0) {
        locations.forEach(loc => {
            const locationStr = `${loc.City}, ${loc.State}`;
            lists.from.push(locationStr);
            lists.to.push(locationStr);
        });
    }
    
    return lists;
}

// Fuzzy match a field against reference list (improved with custom similarity)
function fuzzyMatchField(fieldName, textLines, referenceList) {
    if (!referenceList || referenceList.length === 0) {
        return null;
    }
    
    // Use Fuse.js if available, otherwise fall back to custom similarity
    if (typeof Fuse !== 'undefined') {
        const fuse = new Fuse(referenceList, {
            threshold: 0.5, // More lenient threshold
            includeScore: true,
            minMatchCharLength: 2,
            ignoreLocation: true,
            findAllMatches: false
        });
        
        // Search through text lines
        for (const line of textLines) {
            const search = fuse.search(line);
            if (search && search.length > 0 && search[0].score < 0.5) {
                const confidence = search[0].score < 0.2 ? 'high' : search[0].score < 0.35 ? 'medium' : 'low';
                return {
                    value: search[0].item,
                    confidence: confidence,
                    score: search[0].score
                };
            }
        }
    }
    
    // Fallback: Use custom similarity scoring
    let bestMatch = null;
    let bestScore = 0;
    const threshold = 0.3;
    
    for (const line of textLines) {
        for (const refItem of referenceList) {
            const score = calculateSimilarity(line, refItem);
            if (score > bestScore && score >= threshold) {
                bestScore = score;
                bestMatch = refItem;
            }
        }
    }
    
    if (bestMatch) {
        const confidence = bestScore >= 0.8 ? 'high' : bestScore >= 0.6 ? 'medium' : 'low';
        return {
            value: bestMatch,
            confidence: confidence,
            score: 1 - bestScore // Convert similarity to distance-like score
        };
    }
    
    return null;
}

// Log parsing results for tuning
function logParsingResults(extractedData) {
    const logEntry = {
        timestamp: new Date().toISOString(),
        fields: {},
        overallConfidence: calculateOverallConfidence(extractedData.confidence)
    };
    
    for (const [key, value] of Object.entries(extractedData.data)) {
        logEntry.fields[key] = {
            value: value,
            confidence: extractedData.confidence[key] || 'none'
        };
    }
    
    // Store in localStorage for later analysis
    // PDF parsing logs - no longer stored in localStorage
    const logs = [];
    logs.push(logEntry);
    // Keep only last 100 logs
    if (logs.length > 100) {
        logs.shift();
    }
    // PDF parsing logs - no longer stored in localStorage
    // Logs are only kept in memory for current session
    
    console.log('PDF Parsing Results:', logEntry);
}

// Calculate overall confidence
function calculateOverallConfidence(confidenceMap) {
    const confidences = Object.values(confidenceMap).filter(c => c !== 'none');
    if (confidences.length === 0) return 'none';
    
    const highCount = confidences.filter(c => c === 'high').length;
    const mediumCount = confidences.filter(c => c === 'medium').length;
    const lowCount = confidences.filter(c => c === 'low').length;
    const total = confidences.length;
    
    if (highCount / total >= 0.7) return 'high';
    if ((highCount + mediumCount) / total >= 0.6) return 'medium';
    return 'low';
}

// Show confirmation modal with parsed fields
function showPdfConfirmationModal(extractedData) {
    const modal = document.getElementById('pdfConfirmationModal');
    const fieldsContainer = document.getElementById('pdfParsedFields');
    
    if (!modal || !fieldsContainer) return;
    
    // Build fields display
    let html = '<div style="background: #f8f9fa; padding: 15px; border-radius: 6px; margin-bottom: 15px;">';
    html += '<h3 style="margin-top: 0; margin-bottom: 15px; color: var(--primary-maroon);">Parsed Fields:</h3>';
    html += '<div style="display: grid; gap: 12px;">';
    
    const fieldLabels = {
        manufacturer: 'Manufacturer',
        product: 'Product',
        productType: 'Product Type',
        quantity: 'Quantity',
        from: 'From Location',
        to: 'To Location',
        price: 'Price'
    };
    
    for (const [key, label] of Object.entries(fieldLabels)) {
        if (extractedData.data[key]) {
            const confidence = extractedData.confidence[key] || 'none';
            const confidenceColor = {
                'high': '#28a745',
                'medium': '#ffc107',
                'low': '#dc3545',
                'none': '#6c757d'
            };
            const confidenceIcon = {
                'high': '✅',
                'medium': '⚠️',
                'low': '❌',
                'none': '❓'
            };
            
            html += `
                <div style="display: flex; justify-content: space-between; align-items: center; padding: 10px; background: white; border-radius: 4px; border-left: 4px solid ${confidenceColor[confidence]};">
                    <div>
                        <strong>${label}:</strong> ${extractedData.data[key]}
                    </div>
                    <div style="display: flex; align-items: center; gap: 5px;">
                        <span>${confidenceIcon[confidence]}</span>
                        <span style="font-size: 0.85rem; color: ${confidenceColor[confidence]}; font-weight: 500;">
                            ${confidence.toUpperCase()}
                        </span>
                    </div>
                </div>
            `;
        }
    }
    
    html += '</div></div>';
    
    // Show warning for low confidence fields
    const lowConfidenceFields = Object.entries(extractedData.confidence)
        .filter(([key, conf]) => conf === 'low' && extractedData.data[key])
        .map(([key]) => fieldLabels[key]);
    
    if (lowConfidenceFields.length > 0) {
        html += `<div style="background: #fff3cd; padding: 12px; border-radius: 6px; border-left: 4px solid #ffc107; margin-bottom: 15px;">
            <strong>⚠️ Low Confidence Fields:</strong> ${lowConfidenceFields.join(', ')}<br>
            <small>Please verify these fields before confirming.</small>
        </div>`;
    }
    
    // Show warnings for missing fields
    const missingFields = [];
    if (!extractedData.data.manufacturer) missingFields.push('Manufacturer');
    if (!extractedData.data.product) missingFields.push('Product');
    if (!extractedData.data.productType) missingFields.push('Product Type');
    if (!extractedData.data.quantity) missingFields.push('Quantity');
    if (!extractedData.data.from) missingFields.push('From Location');
    if (!extractedData.data.to) missingFields.push('To Location');
    
    if (missingFields.length > 0) {
        html += `<div style="background: #f8d7da; padding: 12px; border-radius: 6px; border-left: 4px solid #dc3545; margin-bottom: 15px;">
            <strong>⚠️ Missing Fields:</strong> ${missingFields.join(', ')}<br>
            <small>Please enter these fields manually.</small>
        </div>`;
    }
    
    fieldsContainer.innerHTML = html;
    modal.style.display = 'block';
    
    // Store extracted data for later use
    modal.dataset.extractedData = JSON.stringify(extractedData);
}

// Setup modal event listeners
function setupPdfConfirmationModal() {
    const modal = document.getElementById('pdfConfirmationModal');
    const closeBtn = document.getElementById('closePdfModal');
    const cancelBtn = document.getElementById('cancelPdfModal');
    const confirmBtn = document.getElementById('confirmPdfModal');
    
    if (!modal) return;
    
    const closeModal = () => {
        modal.style.display = 'none';
    };
    
    if (closeBtn) closeBtn.addEventListener('click', closeModal);
    if (cancelBtn) cancelBtn.addEventListener('click', closeModal);
    
    if (confirmBtn) {
        confirmBtn.addEventListener('click', () => {
            const extractedDataStr = modal.dataset.extractedData;
            if (extractedDataStr) {
                const extractedData = JSON.parse(extractedDataStr);
                // Call fillOrderFormFromParsed as requested - this uses fuzzy matching
                fillOrderFormFromParsed(extractedData);
                closeModal();
                showPdfStatus('✅ Form filled with parsed data. Please review and submit.', 'success');
            }
        });
    }
    
    // Close on outside click
    modal.addEventListener('click', (e) => {
        if (e.target === modal) {
            closeModal();
        }
    });
}

// ============================================
// PDF PARSING AND AUTOFILL SYSTEM - UPGRADED
// ============================================
// Enhanced PDF extraction and fuzzy matching system
// Features:
// - Robust PDF text extraction using pdf.js
// - Advanced normalization (removes pvt, ltd, punctuation)
// - Fuse.js fuzzy matching with multi-step strategy
// - Reliable cascading dropdown handling with timing
// - Visual feedback and confidence scoring
// - Debug mode for troubleshooting
// ============================================

// Debug mode flag
window.ORDERS_PARSER_DEBUG = window.ORDERS_PARSER_DEBUG || false;

// Confidence thresholds
const CONFIDENCE_HIGH = 0.75;
const CONFIDENCE_MEDIUM = 0.55;
const CONFIDENCE_THRESHOLD = 0.3; // Lowered threshold to allow more matches

// Fuse.js indexes (built at page load)
let fuseIndexes = {
    manufacturers: null,
    products: null,
    subtypes: {} // keyed by product ID
};

// Utility: robust normalization with advanced cleaning
function norm(s) {
    if (!s && s !== 0) return "";
    let normalized = s.toString().trim().toLowerCase();
    
    // Remove punctuation, periods, commas, colons
    normalized = normalized.replace(/[^\w\s-]/g, ' ');
    
    // Collapse multiple spaces to single space
    normalized = normalized.replace(/\s+/g, ' ').trim();
    
    // Remove leading/trailing hyphens
    normalized = normalized.replace(/^-+|-+$/g, '').trim();
    
    return normalized;
}

// Normalize without company suffixes for fuzzy matching
function normWithoutSuffixes(s) {
    if (!s && s !== 0) return "";
    let normalized = s.toString().trim().toLowerCase();
    
    // Remove common business suffixes and words
    normalized = normalized.replace(/\b(pvt|pvt\.|ltd|ltd\.|limited|private|inc|incorporated|llc|corp|corporation|co|company)\b/gi, '');
    
    // Remove punctuation, periods, commas, colons
    normalized = normalized.replace(/[^\w\s-]/g, ' ');
    
    // Collapse multiple spaces to single space
    normalized = normalized.replace(/\s+/g, ' ').trim();
    
    // Remove leading/trailing hyphens
    normalized = normalized.replace(/^-+|-+$/g, '').trim();
    
    return normalized;
}

// Remove stopwords for relaxed matching
function removeStopwords(text) {
    const stopwords = ['the', 'and', 'of', 'in', 'to', 'a', 'an', 'for', 'on', 'at', 'by'];
    const words = text.split(/\s+/);
    return words.filter(w => w.length > 2 && !stopwords.includes(w)).join(' ');
}

// Levenshtein distance calculation
function levenshteinDistance(str1, str2) {
    const len1 = str1.length;
    const len2 = str2.length;
    const matrix = [];
    
    // Initialize matrix
    for (let i = 0; i <= len1; i++) {
        matrix[i] = [i];
    }
    for (let j = 0; j <= len2; j++) {
        matrix[0][j] = j;
    }
    
    // Fill matrix
    for (let i = 1; i <= len1; i++) {
        for (let j = 1; j <= len2; j++) {
            if (str1[i - 1] === str2[j - 1]) {
                matrix[i][j] = matrix[i - 1][j - 1];
            } else {
                matrix[i][j] = Math.min(
                    matrix[i - 1][j] + 1,     // deletion
                    matrix[i][j - 1] + 1,     // insertion
                    matrix[i - 1][j - 1] + 1  // substitution
                );
            }
        }
    }
    
    return matrix[len1][len2];
}

// Calculate similarity score (0-1, higher is better)
function calculateSimilarity(str1, str2) {
    const normalized1 = norm(str1);
    const normalized2 = norm(str2);
    
    // Exact match
    if (normalized1 === normalized2) return 1.0;
    
    // One contains the other
    if (normalized1.includes(normalized2) || normalized2.includes(normalized1)) {
        return 0.9;
    }
    
    // Token overlap score
    const tokens1 = normalized1.split(/\s+/).filter(t => t.length > 2);
    const tokens2 = normalized2.split(/\s+/).filter(t => t.length > 2);
    
    if (tokens1.length === 0 || tokens2.length === 0) {
        // Fallback to Levenshtein
        const maxLen = Math.max(normalized1.length, normalized2.length);
        if (maxLen === 0) return 0;
        const distance = levenshteinDistance(normalized1, normalized2);
        return 1 - (distance / maxLen);
    }
    
    // Count matching tokens
    let matchCount = 0;
    for (const token of tokens1) {
        if (tokens2.some(t => t.includes(token) || token.includes(t))) {
            matchCount++;
        }
    }
    
    const tokenOverlapScore = matchCount / Math.max(tokens1.length, tokens2.length);
    
    // Levenshtein score
    const maxLen = Math.max(normalized1.length, normalized2.length);
    const distance = levenshteinDistance(normalized1, normalized2);
    const levenshteinScore = maxLen > 0 ? 1 - (distance / maxLen) : 0;
    
    // Combined score (weighted average)
    return (tokenOverlapScore * 0.6) + (levenshteinScore * 0.4);
}

// Build Fuse.js indexes at page load
function buildFuseIndexes() {
    if (typeof Fuse === 'undefined') {
        console.warn('Fuse.js not loaded. Falling back to basic matching.');
        return;
    }
    
    // Build manufacturers index
    const manufacturerSelect = document.getElementById('manufacturerName');
    if (manufacturerSelect) {
        const manufacturers = Array.from(manufacturerSelect.options)
            .filter(o => o.value)
            .map(o => ({ name: o.text || o.value, value: o.value, option: o }));
        
        fuseIndexes.manufacturers = new Fuse(manufacturers, {
            keys: ['name'],
            threshold: 0.35,
            includeScore: true,
            minMatchCharLength: 2,
            ignoreLocation: true,
            findAllMatches: false
        });
        
        if (window.ORDERS_PARSER_DEBUG) {
            console.log('Built manufacturers index:', manufacturers.length, 'items');
        }
    }
    
    // Build products index
    const productSelect = document.getElementById('productName');
    if (productSelect) {
        const products = Array.from(productSelect.options)
            .filter(o => o.value)
            .map(o => ({ name: o.text || o.value, value: o.value, option: o }));
        
        fuseIndexes.products = new Fuse(products, {
            keys: ['name'],
            threshold: 0.35,
            includeScore: true,
            minMatchCharLength: 2,
            ignoreLocation: true,
            findAllMatches: false
        });
        
        if (window.ORDERS_PARSER_DEBUG) {
            console.log('Built products index:', products.length, 'items');
        }
    }
}

// Wait for dropdown options to populate (with polling)
async function waitForOptions(selectElement, minOptions = 1, timeout = 2000) {
    const startTime = Date.now();
    while (Date.now() - startTime < timeout) {
        const optionCount = Array.from(selectElement.options).filter(o => o.value).length;
        if (optionCount >= minOptions) {
            if (window.ORDERS_PARSER_DEBUG) {
                console.log(`Options populated: ${optionCount} options found`);
            }
            return true;
        }
        await new Promise(r => setTimeout(r, 50)); // Poll every 50ms
    }
    if (window.ORDERS_PARSER_DEBUG) {
        console.warn(`Timeout waiting for options. Current count: ${Array.from(selectElement.options).filter(o => o.value).length}`);
    }
    return false;
}

// Multi-step matching strategy for select elements
function findBestOptionWithStrategy(selectEl, extractedText, fieldName = 'field') {
    if (!selectEl || !extractedText) {
        if (window.ORDERS_PARSER_DEBUG) {
            console.log(`[${fieldName}] Missing parameters`);
        }
        return { option: null, method: 'none', score: 0 };
    }
    
    const normalizedExtracted = norm(extractedText);
    if (!normalizedExtracted) {
        if (window.ORDERS_PARSER_DEBUG) {
            console.log(`[${fieldName}] Empty normalized text`);
        }
        return { option: null, method: 'none', score: 0 };
    }
    
    // Build options array
    const opts = Array.from(selectEl.options)
        .filter(o => o.value)
        .map(o => ({
            option: o,
            text: o.text || o.value || '',
            value: o.value,
            normalized: norm(o.text || o.value || '')
        }));
    
    if (opts.length === 0) {
        if (window.ORDERS_PARSER_DEBUG) {
            console.log(`[${fieldName}] No options available`);
        }
        return { option: null, method: 'none', score: 0 };
    }
    
    console.log(`[${fieldName}] Matching "${extractedText}" (normalized: "${normalizedExtracted}") against ${opts.length} options`);
    console.log(`[${fieldName}] Available options:`, opts.map(o => o.text));
    
    // Step a) Exact normalized match (highest priority)
    for (const opt of opts) {
        if (opt.normalized === normalizedExtracted) {
            console.log(`[${fieldName}] ✅ Exact match: "${opt.text}"`);
            return { option: opt.option, method: 'exact', score: 1.0, matchedText: opt.text };
        }
    }
    
    // Step b) Option value exact match
    for (const opt of opts) {
        if (norm(opt.value) === normalizedExtracted) {
            console.log(`[${fieldName}] ✅ Value exact match: "${opt.text}"`);
            return { option: opt.option, method: 'value-exact', score: 1.0, matchedText: opt.text };
        }
    }
    
    // Step c) Match on first word/prefix (for manufacturer/product matching)
    if (fieldName === 'manufacturer' || fieldName === 'product') {
        const normalizedExtractedNoSuffix = normWithoutSuffixes(extractedText);
        const extractedFirstWord = normalizedExtractedNoSuffix.split(/\s+/)[0];
        
        if (extractedFirstWord && extractedFirstWord.length >= 3) {
            let bestPrefixMatch = null;
            let bestPrefixScore = 0;
            
            for (const opt of opts) {
                const optNormalizedNoSuffix = normWithoutSuffixes(opt.text);
                const optFirstWord = optNormalizedNoSuffix.split(/\s+/)[0];
                
                // Check if first words match
                if (extractedFirstWord === optFirstWord && extractedFirstWord.length >= 3) {
                    // Calculate score based on how much of the name matches
                    const fullMatchScore = optNormalizedNoSuffix === normalizedExtractedNoSuffix ? 0.95 : 0.85;
                    if (fullMatchScore > bestPrefixScore) {
                        bestPrefixScore = fullMatchScore;
                        bestPrefixMatch = opt;
                    }
                }
            }
            
            if (bestPrefixMatch) {
                console.log(`[${fieldName}] ✅ First word match: "${bestPrefixMatch.text}" (first word: "${extractedFirstWord}")`);
                return { option: bestPrefixMatch.option, method: 'first-word', score: bestPrefixScore, matchedText: bestPrefixMatch.text };
            }
        }
    }
    
    // Step d) Case-insensitive includes - but require longer match (at least 3 chars for products, 4 for others)
    const minLength = fieldName === 'product' ? 3 : 4;
    if (normalizedExtracted.length >= minLength) {
        let bestIncludeMatch = null;
        let bestIncludeScore = 0;
        
        for (const opt of opts) {
            // Check if either contains the other
            if (opt.normalized.includes(normalizedExtracted) || normalizedExtracted.includes(opt.normalized)) {
                const shorterLen = Math.min(opt.normalized.length, normalizedExtracted.length);
                const longerLen = Math.max(opt.normalized.length, normalizedExtracted.length);
                const matchRatio = shorterLen / longerLen;
                
                // Lower threshold for products (50%) vs others (60%)
                const threshold = fieldName === 'product' ? 0.5 : 0.6;
                if (matchRatio >= threshold) {
                    const score = Math.min(0.9, Math.max(0.75, matchRatio));
                    if (score > bestIncludeScore) {
                        bestIncludeScore = score;
                        bestIncludeMatch = opt;
                    }
                }
            }
        }
        
        if (bestIncludeMatch) {
            console.log(`[${fieldName}] ✅ Includes match: "${bestIncludeMatch.text}" (score: ${bestIncludeScore.toFixed(2)})`);
            return { option: bestIncludeMatch.option, method: 'includes', score: bestIncludeScore, matchedText: bestIncludeMatch.text };
        }
    }
    
    // Step d) Fuzzy search with Fuse.js
    let fuseIndex = null;
    let searchArray = null;
    
    if (fieldName === 'manufacturer' && fuseIndexes.manufacturers) {
        fuseIndex = fuseIndexes.manufacturers;
        searchArray = Array.from(selectEl.options).filter(o => o.value).map(o => ({ name: o.text || o.value, value: o.value, option: o }));
    } else if (fieldName === 'product' && fuseIndexes.products) {
        fuseIndex = fuseIndexes.products;
        searchArray = Array.from(selectEl.options).filter(o => o.value).map(o => ({ name: o.text || o.value, value: o.value, option: o }));
    } else if (fieldName === 'subtype') {
        // Build subtype index on the fly
        const subtypeArray = Array.from(selectEl.options)
            .filter(o => o.value)
            .map(o => ({ name: o.text || o.value, value: o.value, option: o }));
        
        if (typeof Fuse !== 'undefined' && subtypeArray.length > 0) {
            fuseIndex = new Fuse(subtypeArray, {
                keys: ['name'],
                threshold: 0.35,
                includeScore: true,
                minMatchCharLength: 2,
                ignoreLocation: true
            });
            searchArray = subtypeArray;
        }
    }
    
    if (fuseIndex && typeof Fuse !== 'undefined') {
        const results = fuseIndex.search(extractedText);
        console.log(`[${fieldName}] Fuse.js results (top 5):`, results.slice(0, 5).map(r => ({
            text: r.item.name,
            score: r.score,
            similarity: (1 - r.score).toFixed(3)
        })));
        
        if (results.length > 0) {
            const best = results[0];
            const score = 1 - best.score; // Convert distance to similarity
            
            // Lower threshold for products (0.4) vs manufacturers (0.6)
            const threshold = fieldName === 'product' ? 0.4 : 0.6;
            if (score >= threshold) {
                const matchedOption = searchArray.find(item => item.name === best.item.name);
                
                if (matchedOption) {
                    console.log(`[${fieldName}] ✅ Fuse match: "${matchedOption.name}" (score: ${score.toFixed(3)})`);
                    return { option: matchedOption.option, method: 'fuse', score: score, matchedText: matchedOption.name };
                }
            } else {
                console.log(`[${fieldName}] ⚠️ Fuse match score too low: ${score.toFixed(3)} (need >= ${threshold})`);
            }
        }
    }
    
    // Step e) Fallback: Token overlap scoring
    const extractedTokens = normalizedExtracted.split(/\s+/).filter(t => t.length > 2);
    let bestOption = null;
    let bestTokenScore = 0;
    
    for (const opt of opts) {
        const optTokens = opt.normalized.split(/\s+/).filter(t => t.length > 2);
        let overlap = 0;
        for (const token of extractedTokens) {
            if (optTokens.some(ot => ot.includes(token) || token.includes(ot))) {
                overlap++;
            }
        }
        const tokenScore = overlap / Math.max(extractedTokens.length, optTokens.length);
        if (tokenScore > bestTokenScore) {
            bestTokenScore = tokenScore;
            bestOption = opt;
        }
    }
    
    if (bestTokenScore > 0 && bestOption) {
        if (window.ORDERS_PARSER_DEBUG) {
            console.log(`[${fieldName}] ⚠️ Token overlap match: "${bestOption.text}" (score: ${bestTokenScore.toFixed(3)})`);
        }
        return { option: bestOption.option, method: 'token-overlap', score: bestTokenScore, matchedText: bestOption.text };
    }
    
    if (window.ORDERS_PARSER_DEBUG) {
        console.log(`[${fieldName}] ❌ No match found`);
    }
    return { option: null, method: 'none', score: 0 };
}

// Match and select function with multi-step strategy and visual feedback
function matchAndSelect(selectElement, extractedText, fieldName = null) {
    if (!selectElement || !extractedText) {
        if (window.ORDERS_PARSER_DEBUG) {
            console.log('matchAndSelect: Missing parameters');
        }
        return { success: false, score: 0, method: 'none' };
    }
    
    const field = fieldName || selectElement.id;
    
    // Reset styling
    selectElement.style.background = '';
    selectElement.style.borderColor = '';
    selectElement.style.borderWidth = '';
    
    // Find best match using multi-step strategy
    const matchResult = findBestOptionWithStrategy(selectElement, extractedText, field);
    
    // Always try to set if we have a match, even if score is low
    if (matchResult.option && matchResult.option.value) {
        // Set the value
        selectElement.value = matchResult.option.value;
        
        // Dispatch change event to trigger cascading dropdowns
        const changeEvent = new Event('change', { bubbles: true });
        selectElement.dispatchEvent(changeEvent);
        
        // Visual feedback based on confidence
        if (matchResult.score >= CONFIDENCE_HIGH) {
            // High confidence - green
            selectElement.style.background = '#d4edda';
            selectElement.style.borderColor = '#28a745';
            selectElement.style.borderWidth = '2px';
        } else if (matchResult.score >= CONFIDENCE_MEDIUM) {
            // Medium confidence - yellow
            selectElement.style.background = '#fff3cd';
            selectElement.style.borderColor = '#ffc107';
            selectElement.style.borderWidth = '2px';
            selectElement.title = 'Medium confidence match — please confirm.';
        } else {
            // Low confidence but still set - light yellow
            selectElement.style.background = '#fff9e6';
            selectElement.style.borderColor = '#ffd700';
            selectElement.style.borderWidth = '2px';
            selectElement.title = 'Low confidence match — please verify.';
        }
        
        // Log result
        console.log(`✅ { field: '${field}', extracted: '${extractedText}', matched: '${matchResult.matchedText}', method: '${matchResult.method}', score: ${matchResult.score.toFixed(2)} }`);
        
        return { 
            success: true, 
            score: matchResult.score, 
            method: matchResult.method,
            matchedText: matchResult.matchedText 
        };
    } else {
        // No match found - highlight red and focus
        selectElement.style.background = '#f8d7da';
        selectElement.style.borderColor = '#dc3545';
        selectElement.style.borderWidth = '2px';
        selectElement.title = 'No match found — please select manually.';
        selectElement.focus();
        
        console.log(`❌ { field: '${field}', extracted: '${extractedText}', matched: null, method: '${matchResult.method}', score: ${matchResult.score.toFixed(2)} }`);
        
        return { success: false, score: matchResult.score || 0, method: matchResult.method };
    }
}

// Set select by best match and dispatch change. Returns true if matched.
function setSelectByText(selectId, candidateText) {
    const sel = document.getElementById(selectId);
    if (!sel) {
        console.log('Select element not found:', selectId);
        return false;
    }
    
    const result = matchAndSelect(sel, candidateText);
    return result.success;
}

// Set plain input and style according to confidence
function setInputByText(inputId, value, good = true) {
    const el = document.getElementById(inputId);
    if (!el) {
        console.log('Input element not found:', inputId);
        return;
    }
    el.value = value || '';
    el.style.background = good ? '#e8ffe8' : '#fff3f3';
}

// Main fill function - called from preview modal confirmation
async function fillOrderFormFromParsed(parsed) {
    // parsed: { data: { manufacturer, product, productType, quantity, from, to }, confidence: {...} }
    // This is the entry point called when user confirms in the preview modal
    await autoFillFormWithConfidence(parsed);
}

// Enhanced auto-fill with confidence indicators and reliable matching
async function autoFillFormWithConfidence(extractedData) {
    const data = extractedData.data;
    const confidence = extractedData.confidence;
    
    // Clear previous highlights
    clearFormHighlights();
    
    console.log('Auto-filling form with data:', data);
    
    // 1) Manufacturer -> set select, trigger change to populate products
    const manufacturerSelect = document.getElementById('manufacturerName');
    let manuResult = { success: false, score: 0, method: 'none' };
    
    if (manufacturerSelect && data.manufacturer) {
        // Enable select if disabled
        if (manufacturerSelect.disabled) {
            manufacturerSelect.disabled = false;
        }
        
        console.log('Attempting to match manufacturer:', data.manufacturer);
        manuResult = matchAndSelect(manufacturerSelect, data.manufacturer, 'manufacturer');
        console.log('Manufacturer match result:', manuResult);
        
        if (manuResult.success) {
            console.log('✅ Manufacturer matched successfully, waiting for products to populate...');
            // Dispatch change event and wait for products to populate
            const changeEvent = new Event('change', { bubbles: true });
            manufacturerSelect.dispatchEvent(changeEvent);
            
            // Wait longer and poll for product options
            await new Promise(r => setTimeout(r, 600));
            const productSelect = document.getElementById('productName');
            if (productSelect) {
                const optionsPopulated = await waitForOptions(productSelect, 1, 3000);
                if (optionsPopulated) {
                    console.log('✅ Products populated, available options:', Array.from(productSelect.options).filter(o => o.value).map(o => o.text));
                } else {
                    console.warn('⚠️ Products did not populate in time');
                }
            }
        } else {
            console.warn('❌ Manufacturer match failed. Extracted:', data.manufacturer);
            console.warn('Available manufacturer options:', Array.from(manufacturerSelect.options).map(o => o.text));
        }
    }
    const manuOk = manuResult.success;
    
    // 2) Product -> set select, trigger change to populate subtype
    const productSelect = document.getElementById('productName');
    let prodResult = { success: false, score: 0, method: 'none' };
    
    if (productSelect && data.product) {
        // Enable select if disabled
        if (productSelect.disabled) {
            productSelect.disabled = false;
        }
        
        console.log('Attempting to match product:', data.product);
        prodResult = matchAndSelect(productSelect, data.product, 'product');
        console.log('Product match result:', prodResult);
        
        if (prodResult.success) {
            console.log('✅ Product matched successfully, waiting for product types to populate...');
            // Dispatch change event and wait for subtypes to populate
            const changeEvent = new Event('change', { bubbles: true });
            productSelect.dispatchEvent(changeEvent);
            
            // Wait longer and poll for subtype options
            await new Promise(r => setTimeout(r, 600));
            const productTypeSelect = document.getElementById('productType');
            if (productTypeSelect) {
                const optionsPopulated = await waitForOptions(productTypeSelect, 1, 3000);
                if (optionsPopulated) {
                    console.log('✅ Product types populated, available options:', Array.from(productTypeSelect.options).filter(o => o.value).map(o => o.text));
                } else {
                    console.warn('⚠️ Product types did not populate in time');
                }
            }
        } else {
            console.warn('❌ Product match failed. Extracted:', data.product);
            console.warn('Available product options:', Array.from(productSelect.options).map(o => o.text));
        }
    }
    const prodOk = prodResult.success;
    
    // 3) Product Type / Subtype
    const productTypeSelect = document.getElementById('productType');
    let subtypeResult = { success: false, score: 0, method: 'none' };
    
    if (productTypeSelect && data.productType) {
        // Enable select if disabled
        if (productTypeSelect.disabled) {
            productTypeSelect.disabled = false;
        }
        
        console.log('Attempting to match product type:', data.productType);
        subtypeResult = matchAndSelect(productTypeSelect, data.productType, 'subtype');
        console.log('Product type match result:', subtypeResult);
        
        if (!subtypeResult.success) {
            console.warn('Product type match failed. Extracted:', data.productType, 'Available options:', Array.from(productTypeSelect.options).map(o => o.text));
        }
    }
    const subtypeOk = subtypeResult.success;
    
    // 4) Plain inputs
    if (data.quantity) {
        // Extract just the number - handle noisy text like "Qty: 250 MT."
        let qtyValue = data.quantity.toString();
        const qtyMatch = qtyValue.match(/(\d+)/);
        if (qtyMatch) {
            setInputByText('quantity', qtyMatch[1], true);
            // Trigger input event for cost calculation
            const quantityInput = document.getElementById('quantity');
            if (quantityInput) {
                quantityInput.dispatchEvent(new Event('input', { bubbles: true }));
            }
        }
    } else {
        setInputByText('quantity', '', false);
    }
    
    // Handle location fields - clean, match, and set
    if (data.from) {
        let fromValue = data.from.trim();
        // Remove "Deliver From:" or "From:" prefixes if present
        fromValue = fromValue.replace(/^(deliver\s+from|from)\s*:?\s*/i, '').trim();
        
        // Try to match against known locations for better accuracy
        const referenceLists = getReferenceLists();
        if (referenceLists.from && referenceLists.from.length > 0) {
            const locationMatch = fuzzyMatchField('from', [fromValue], referenceLists.from);
            if (locationMatch && locationMatch.confidence !== 'none') {
                fromValue = locationMatch.value; // Use matched location
                console.log(`✅ Matched location (from): "${data.from}" -> "${fromValue}"`);
            }
        }
        
        setInputByText('fromLocation', fromValue, true);
    } else {
        setInputByText('fromLocation', '', false);
    }
    
    if (data.to) {
        let toValue = data.to.trim();
        // Remove "Deliver To:" or "To:" prefixes if present
        toValue = toValue.replace(/^(deliver\s+to|to)\s*:?\s*/i, '').trim();
        
        // Try to match against known locations for better accuracy
        const referenceLists = getReferenceLists();
        if (referenceLists.to && referenceLists.to.length > 0) {
            const locationMatch = fuzzyMatchField('to', [toValue], referenceLists.to);
            if (locationMatch && locationMatch.confidence !== 'none') {
                toValue = locationMatch.value; // Use matched location
                console.log(`✅ Matched location (to): "${data.to}" -> "${toValue}"`);
            }
        }
        
        setInputByText('toLocation', toValue, true);
    } else {
        setInputByText('toLocation', '', false);
    }
    
    // Trigger input events for location fields to calculate distance
    setTimeout(() => {
        const fromInput = document.getElementById('fromLocation');
        const toInput = document.getElementById('toLocation');
        if (fromInput && fromInput.value) {
            fromInput.dispatchEvent(new Event('input', { bubbles: true }));
        }
        if (toInput && toInput.value) {
            toInput.dispatchEvent(new Event('input', { bubbles: true }));
        }
    }, 500);
    
    // 5) After force-setting, recompute costs if function exists
    if (typeof calculateCosts === 'function') {
        setTimeout(() => {
            calculateCosts().catch(err => console.error('Error calculating costs:', err));
        }, 800);
    }
    
    // 6) Show inline warnings for missing fields
    const pdfUploadStatus = document.getElementById('pdfUploadStatus');
    if (pdfUploadStatus) {
        const warnings = [];
        if (!data.productType || !subtypeOk) {
            warnings.push('Could not extract product type from PDF — please enter manually.');
        }
        if (!data.manufacturer || !manuOk) {
            warnings.push('Could not extract manufacturer from PDF — please select manually.');
        }
        if (!data.product || !prodOk) {
            warnings.push('Could not extract product from PDF — please select manually.');
        }
        if (!data.quantity) {
            warnings.push('Could not extract quantity from PDF — please enter manually.');
        }
        if (!data.from) {
            warnings.push('Could not extract from location from PDF — please enter manually.');
        }
        if (!data.to) {
            warnings.push('Could not extract to location from PDF — please enter manually.');
        }
        
        if (warnings.length > 0) {
            showPdfStatus(warnings.join(' '), 'warning');
        }
    }
    
    // 7) If any of manufacturer/product/subtype were not matched, focus on that field
    if (!manuOk) {
        const el = document.getElementById('manufacturerName');
        if (el) {
            el.focus();
            highlightFieldWithConfidence(el, confidence.manufacturer || 'none');
        }
    } else if (!prodOk) {
        const el = document.getElementById('productName');
        if (el) {
            el.focus();
            highlightFieldWithConfidence(el, confidence.product || 'none');
        }
    } else if (!subtypeOk) {
        const el = document.getElementById('productType');
        if (el) {
            el.focus();
            highlightFieldWithConfidence(el, confidence.productType || 'none');
        }
    }
}

// Legacy function for backward compatibility
function autoFillForm(data) {
    const extractedData = {
        data: data,
        confidence: {}
    };
    // Set all to medium confidence for legacy calls
    Object.keys(data).forEach(key => {
        extractedData.confidence[key] = 'medium';
    });
    autoFillFormWithConfidence(extractedData);
}

// Highlight field with confidence indicator
function highlightFieldWithConfidence(field, confidence) {
    if (!field) return;
    
    const colors = {
        'high': { bg: '#d4edda', border: '#28a745' },
        'medium': { bg: '#fff3cd', border: '#ffc107' },
        'low': { bg: '#f8d7da', border: '#dc3545' },
        'none': { bg: '#fffacd', border: '#ffd700' }
    };
    
    const color = colors[confidence] || colors['none'];
    field.style.backgroundColor = color.bg;
    field.style.borderColor = color.border;
    field.style.borderWidth = '2px';
    field.style.borderStyle = 'solid';
    
    // Add title attribute for tooltip
    const confidenceText = {
        'high': 'High confidence - Verified match',
        'medium': 'Medium confidence - Please verify',
        'low': 'Low confidence - Manual correction recommended',
        'none': 'Not found - Please fill manually'
    };
    field.title = confidenceText[confidence] || '';
}

function highlightField(field) {
    if (field) {
        field.style.backgroundColor = '#fffacd'; // Light yellow
        field.style.borderColor = '#ffd700'; // Gold border
    }
}

function clearFormHighlights() {
    const fields = [
        document.getElementById('manufacturerName'),
        document.getElementById('productName'),
        document.getElementById('productType'),
        document.getElementById('quantity'),
        document.getElementById('fromLocation'),
        document.getElementById('toLocation')
    ];
    
    fields.forEach(field => {
        if (field) {
            field.style.backgroundColor = '';
            field.style.borderColor = '';
        }
    });
}

function showPdfStatus(message, type) {
    const pdfUploadStatus = document.getElementById('pdfUploadStatus');
    if (!pdfUploadStatus) return;
    
    pdfUploadStatus.style.display = 'block';
    pdfUploadStatus.textContent = message;
    
    // Set color based on type
    switch(type) {
        case 'success':
            pdfUploadStatus.style.background = '#d4edda';
            pdfUploadStatus.style.color = '#155724';
            pdfUploadStatus.style.border = '1px solid #c3e6cb';
            break;
        case 'error':
            pdfUploadStatus.style.background = '#f8d7da';
            pdfUploadStatus.style.color = '#721c24';
            pdfUploadStatus.style.border = '1px solid #f5c6cb';
            break;
        case 'warning':
            pdfUploadStatus.style.background = '#fff3cd';
            pdfUploadStatus.style.color = '#856404';
            pdfUploadStatus.style.border = '1px solid #ffeaa7';
            break;
        case 'info':
        default:
            pdfUploadStatus.style.background = '#d1ecf1';
            pdfUploadStatus.style.color = '#0c5460';
            pdfUploadStatus.style.border = '1px solid #bee5eb';
            break;
    }
}


