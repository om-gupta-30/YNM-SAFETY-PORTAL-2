// Transport page functionality
const ratePerKm = 10;
let map = null;
let directionsService = null;
let directionsRenderer = null;
let calculationTriggeredByButton = false;

// Google Maps API Key
const GOOGLE_MAPS_API_KEY = 'AIzaSyAc0CFjsw2LjUHtFf68ngZ0ZVyUccOLL7U';

// Get coordinates from address using Google Maps Geocoding API (JavaScript API)
async function getCoordinatesFromAddress(address) {
    return new Promise((resolve, reject) => {
        // Check if Google Maps API is loaded
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

// Get driving distance using Google Maps Distance Matrix Service (JavaScript API)
async function getDrivingDistance(origin, destination) {
    return new Promise((resolve, reject) => {
        // Check if Google Maps API is loaded
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
                } else if (element.status === 'ZERO_RESULTS') {
                    reject(new Error('ZERO_RESULTS: No route found between these locations. They may be separated by water or have no road connection.'));
                } else if (element.status === 'NOT_FOUND') {
                    reject(new Error('NOT_FOUND: One or both locations could not be found.'));
                } else {
                    reject(new Error(`Distance calculation failed: ${element.status}`));
                }
            } else {
                reject(new Error(`Distance Matrix API error: ${status}`));
            }
        });
    });
}

// Calculate geodesic (straight-line) distance between two coordinates using Haversine formula
function calculateGeodesicDistance(coord1, coord2) {
    const R = 6371; // Earth's radius in kilometers
    const dLat = (coord2.lat - coord1.lat) * Math.PI / 180;
    const dLon = (coord2.lng - coord1.lng) * Math.PI / 180;
    const a = 
        Math.sin(dLat / 2) * Math.sin(dLat / 2) +
        Math.cos(coord1.lat * Math.PI / 180) * Math.cos(coord2.lat * Math.PI / 180) *
        Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    const distance = R * c; // Distance in kilometers
    return distance;
}

// Initialize Google Maps
function initMap(centerLat = null, centerLng = null) {
    if (!window.google || !window.google.maps) {
        console.error('Google Maps API not loaded');
        return;
    }

    const mapContainer = document.getElementById('map');
    if (!mapContainer) return;

    // Use provided center or default to India
    const defaultCenter = centerLat && centerLng 
        ? { lat: centerLat, lng: centerLng }
        : { lat: 20.5937, lng: 78.9629 }; // Center of India

    map = new google.maps.Map(mapContainer, {
        zoom: centerLat && centerLng ? 7 : 5,
        center: defaultCenter,
        mapTypeId: 'roadmap'
    });

    directionsService = new google.maps.DirectionsService();
    directionsRenderer = new google.maps.DirectionsRenderer();
    directionsRenderer.setMap(map);
}

// Display route on map
function displayRoute(origin, destination) {
    console.log('displayRoute called with:', origin, destination);
    
    if (!window.google || !window.google.maps) {
        console.error('Google Maps API not available');
        return;
    }

    // Initialize services if needed
    if (!directionsService) {
        directionsService = new google.maps.DirectionsService();
    }
    
    if (!directionsRenderer) {
        const mapDiv = document.getElementById('map');
        if (!mapDiv) {
            console.error('Map div not found');
            return;
        }
        
        // Initialize map if not already done
        if (!map) {
            map = new google.maps.Map(mapDiv, {
                zoom: 7,
                center: { lat: 20.5937, lng: 78.9629 }, // Center of India
                mapTypeId: 'roadmap'
            });
        }
        
        directionsRenderer = new google.maps.DirectionsRenderer();
        directionsRenderer.setMap(map);
    }

    const mapContainer = document.getElementById('mapContainer');
    const mapDiv = document.getElementById('map');
    
    // Ensure map div is visible
    if (mapDiv) {
        mapDiv.style.display = 'block';
    }

    console.log('Requesting directions from', origin, 'to', destination);
    directionsService.route({
        origin: origin,
        destination: destination,
        travelMode: google.maps.TravelMode.DRIVING,
        provideRouteAlternatives: false
    }, (result, status) => {
        console.log('Directions service response:', status);
        if (status === 'OK') {
            directionsRenderer.setDirections(result);
            
            // Adjust map bounds to fit the route
            const bounds = new google.maps.LatLngBounds();
            result.routes[0].legs.forEach(leg => {
                bounds.extend(leg.start_location);
                bounds.extend(leg.end_location);
            });
            map.fitBounds(bounds);
            
            // Show map container
            if (mapContainer) {
                mapContainer.style.display = 'block';
            }
            
            console.log('Route displayed successfully');
        } else {
            console.error('Directions request failed:', status);
            // Still show container and link even if route display fails
            if (mapContainer) {
                mapContainer.style.display = 'block';
            }
            if (mapDiv) {
                mapDiv.style.display = 'none';
            }
        }
    });
}

// Calculate distance - ONLY triggered by Confirm button
// Uses Google Maps REST APIs (like Streamlit code)
// Make it globally accessible
window.calculateDistance = async function(triggeredByButton = false) {
    // Only allow calculation if explicitly triggered by button
    if (!triggeredByButton) {
        console.warn('calculateDistance() called without button trigger - IGNORING');
        return;
    }
    
    console.log('=== calculateDistance() called by Confirm button ===');
    calculationTriggeredByButton = true;
    
    const loadingIndicator = document.getElementById('loadingIndicator');
    const errorMessage = document.getElementById('errorMessage');
    const summary = document.getElementById('transportSummary');
    const distanceDisplay = document.getElementById('distanceDisplay');
    const rateDisplay = document.getElementById('rateDisplay');
    const totalCostDisplay = document.getElementById('totalCostDisplay');
    const mapContainer = document.getElementById('mapContainer');

    // Hide error, summary, and map initially
    errorMessage.style.display = 'none';
    summary.style.display = 'none';
    if (mapContainer) {
        mapContainer.style.display = 'none';
    }

    // Get input values - only manual input now
    const fromLocation = document.getElementById('fromLocation').value.trim();
    const toLocation = document.getElementById('toLocation').value.trim();

    // Validate inputs
    if (!fromLocation || !toLocation) {
        errorMessage.innerHTML = '<p>Please enter both origin and destination addresses.</p>';
        errorMessage.style.display = 'block';
        summary.style.display = 'none';
        loadingIndicator.style.display = 'none';
        if (mapContainer) {
            mapContainer.style.display = 'none';
        }
        return;
    }

    if (fromLocation === toLocation) {
        errorMessage.innerHTML = '<p>Please enter different origin and destination addresses.</p>';
        errorMessage.style.display = 'block';
        summary.style.display = 'none';
        loadingIndicator.style.display = 'none';
        if (mapContainer) {
            mapContainer.style.display = 'none';
        }
        return;
    }

    try {
        // Show loading indicator
        loadingIndicator.style.display = 'block';
        loadingIndicator.innerHTML = '<p>🌍 Calculating driving distance and route...</p>';

        // Prepare addresses - use as-is (user should include location details)
        let fromAddress = fromLocation;
        let toAddress = toLocation;

        console.log('Getting coordinates for:', fromAddress, 'and', toAddress);

        // Get coordinates for both locations using Geocoding API
        // This works for both dropdown selections and manual addresses
        let fromCoords, toCoords;
        try {
            fromCoords = await getCoordinatesFromAddress(fromAddress);
            console.log('From coordinates:', fromCoords);
        } catch (error) {
            console.error('Geocoding error for origin:', error);
            errorMessage.innerHTML = '<p>Could not find the origin location. Please enter a valid address.</p>';
            errorMessage.style.display = 'block';
            summary.style.display = 'none';
            loadingIndicator.style.display = 'none';
            if (mapContainer) {
                mapContainer.style.display = 'none';
            }
            return;
        }

        try {
            toCoords = await getCoordinatesFromAddress(toAddress);
            console.log('To coordinates:', toCoords);
        } catch (error) {
            console.error('Geocoding error for destination:', error);
            errorMessage.innerHTML = '<p>Could not find the destination location. Please enter a valid address.</p>';
            errorMessage.style.display = 'block';
            summary.style.display = 'none';
            loadingIndicator.style.display = 'none';
            if (mapContainer) {
                mapContainer.style.display = 'none';
            }
            return;
        }

        // Update addresses with formatted addresses from geocoding
        fromAddress = fromCoords.formatted_address;
        toAddress = toCoords.formatted_address;

        console.log('Getting driving distance between:', fromAddress, 'and', toAddress);

        // Get driving distance using Distance Matrix API
        let distanceResult;
        try {
            distanceResult = await getDrivingDistance(fromAddress, toAddress);
            console.log('Distance result:', distanceResult);
        } catch (error) {
            console.error('Distance calculation error:', error);
            // Check for specific error cases
            if (error.message && (error.message.includes('ZERO_RESULTS') || error.message.includes('No route found'))) {
                errorMessage.innerHTML = '<p>No driving route found between these locations. Please check the addresses and try again.</p>';
            } else if (error.message && error.message.includes('NOT_FOUND')) {
                errorMessage.innerHTML = '<p>One or both locations could not be found. Please check your addresses and try again.</p>';
            } else {
                errorMessage.innerHTML = '<p>Unable to calculate driving distance. Please ensure both locations are valid.</p>';
            }
            errorMessage.style.display = 'block';
            summary.style.display = 'none';
            loadingIndicator.style.display = 'none';
            if (mapContainer) {
                mapContainer.style.display = 'none';
            }
            return;
        }
        
        const distanceKm = distanceResult.distance;

        if (isNaN(distanceKm) || distanceKm <= 0) {
            errorMessage.innerHTML = '<p>Invalid distance calculated. Please try again with different locations.</p>';
            errorMessage.style.display = 'block';
            summary.style.display = 'none';
            loadingIndicator.style.display = 'none';
            if (mapContainer) {
                mapContainer.style.display = 'none';
            }
            return;
        }

        // Calculate total cost
        const totalCost = distanceKm * ratePerKm;

        // Update display elements
        if (distanceDisplay) {
            distanceDisplay.textContent = `${distanceKm.toFixed(2)} km`;
        }
        
        // Display travel time
        const timeDisplay = document.getElementById('timeDisplay');
        if (timeDisplay && distanceResult.duration) {
            timeDisplay.textContent = distanceResult.duration;
        }
        
        if (rateDisplay) {
            rateDisplay.textContent = `₹${ratePerKm} per km`;
        }
        if (totalCostDisplay) {
            totalCostDisplay.textContent = `₹${totalCost.toFixed(2)}`;
        }

        // Hide loading, show summary
        loadingIndicator.style.display = 'none';
        errorMessage.style.display = 'none';
        summary.style.display = 'block';

        // Display route on map first
        try {
            displayRoute(fromAddress, toAddress);
        } catch (error) {
            console.error('Error displaying route on map:', error);
            // Continue even if map display fails
        }

        // ALWAYS show Google Maps link
        const googleMapsLink = document.getElementById('googleMapsLink');
        if (googleMapsLink && mapContainer) {
            const encodedOrigin = encodeURIComponent(fromAddress);
            const encodedDestination = encodeURIComponent(toAddress);
            googleMapsLink.href = `https://www.google.com/maps/dir/${encodedOrigin}/${encodedDestination}`;
            googleMapsLink.style.display = 'inline-block';
            googleMapsLink.textContent = 'View Route on Google Maps';
        }

        // Ensure map container is visible
        if (mapContainer) {
            mapContainer.style.display = 'block';
        }

    } catch (error) {
        console.error('Error calculating distance:', error);
        
        // Hide loading
        loadingIndicator.style.display = 'none';
        
        // Show error message with helpful details
        let errorMsg = 'Error calculating distance. ';
        const errorMessageText = error.message || '';
        
        if (errorMessageText.includes('ZERO_RESULTS') || errorMessageText.includes('No route found')) {
            errorMsg = 'No driving route found between these locations. Please check the addresses and try again.';
        } else if (errorMessageText.includes('NOT_FOUND')) {
            errorMsg = 'One or both locations could not be found. Please verify the addresses are correct and try again.';
        } else if (errorMessageText.includes('INVALID_REQUEST')) {
            errorMsg = 'Invalid request. Please check that both locations are provided correctly.';
        } else if (errorMessageText.includes('OVER_QUERY_LIMIT')) {
            errorMsg = 'API quota exceeded. Please try again later.';
        } else if (errorMessageText.includes('REQUEST_DENIED')) {
            errorMsg = 'Request denied. Please check API key configuration.';
        } else {
            errorMsg += errorMessageText || 'Please try again.';
        }
        
        errorMessage.innerHTML = `<p>${errorMsg}</p>`;
        errorMessage.style.display = 'block';
        
        // Hide summary and map
        summary.style.display = 'none';
        if (mapContainer) {
            mapContainer.style.display = 'none';
        }
    }
}

// Handle form changes - ONLY Confirm button triggers calculation
function setupFormListeners() {
    console.log('Setting up form listeners - ONLY Confirm button will trigger calculations');
    
    // Get elements
    const confirmButton = document.getElementById('confirmButton');
    const fromInput = document.getElementById('fromLocation');
    const toInput = document.getElementById('toLocation');
    
    // Setup Confirm button - simple and direct
    if (confirmButton) {
        confirmButton.addEventListener('click', function(e) {
            e.preventDefault();
            e.stopPropagation();
            console.log('=== Confirm button clicked - starting calculation ===');
            calculateDistance(true); // Pass true to indicate button trigger
            return false;
        });
    } else {
        console.error('Confirm button not found!');
    }
    
    // Manual input fields - NO calculation, only clear results when typing
    if (fromInput) {
        fromInput.addEventListener('input', function(e) {
            e.stopPropagation();
            // Clear results when user types (but don't calculate)
            document.getElementById('transportSummary').style.display = 'none';
            document.getElementById('errorMessage').style.display = 'none';
            document.getElementById('mapContainer').style.display = 'none';
            document.getElementById('loadingIndicator').style.display = 'none';
        });
    }
    
    if (toInput) {
        toInput.addEventListener('input', function(e) {
            e.stopPropagation();
            // Clear results when user types (but don't calculate)
            document.getElementById('transportSummary').style.display = 'none';
            document.getElementById('errorMessage').style.display = 'none';
            document.getElementById('mapContainer').style.display = 'none';
            document.getElementById('loadingIndicator').style.display = 'none';
        });
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
    
    // Prevent form submission
    const transportForm = document.getElementById('transportForm');
    if (transportForm) {
        transportForm.addEventListener('submit', function(e) {
            e.preventDefault();
            e.stopPropagation();
            return false;
        });
    }
    
    // Only manual input - no dropdowns needed
    setupFormListeners();
    
    // Initialize map when Google Maps API is loaded (for embedded map display)
    function checkAndInitMap() {
        if (window.google && window.google.maps) {
            console.log('Google Maps API loaded successfully');
            initMap();
        } else {
            // Wait a bit and try again (max 10 seconds)
            const maxAttempts = 100;
            let attempts = 0;
            const checkInterval = setInterval(() => {
                attempts++;
                if (window.google && window.google.maps) {
                    clearInterval(checkInterval);
                    console.log('Google Maps API loaded successfully');
                    initMap();
                } else if (attempts >= maxAttempts) {
                    clearInterval(checkInterval);
                    console.warn('Google Maps JavaScript API did not load - embedded map may not work, but link will still work');
                }
            }, 100);
        }
    }
    
    // Start checking for Google Maps JavaScript API (optional - for embedded map)
    // REST APIs work without this, but embedded map needs it
    checkAndInitMap();
});
