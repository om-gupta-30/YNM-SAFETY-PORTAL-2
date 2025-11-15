const Manufacturer = require('../models/Manufacturer');
const Product = require('../models/Product');
const { validatePhone, validateName, validateLocation, validateNumeric, validateUnit } = require('../middleware/validation');

// Helper function for fuzzy matching
function normalizeText(text) {
    if (!text || typeof text !== 'string') return '';
    return text.trim().toLowerCase().replace(/\s+/g, ' ');
}

function fuzzyMatch(str1, str2) {
    const s1 = normalizeText(str1);
    const s2 = normalizeText(str2);
    if (s1 === s2) return 1.0;
    if (s1.includes(s2) || s2.includes(s1)) return 0.9;
    
    const maxLen = Math.max(s1.length, s2.length);
    if (maxLen === 0) return 1.0;
    
    let distance = 0;
    const minLen = Math.min(s1.length, s2.length);
    for (let i = 0; i < minLen; i++) {
        if (s1[i] !== s2[i]) distance++;
    }
    distance += Math.abs(s1.length - s2.length);
    
    const similarity = 1 - (distance / maxLen);
    return distance <= 2 && maxLen > 2 ? Math.max(similarity, 0.85) : similarity;
}

// @desc    Get all manufacturers
// @route   GET /api/manufacturers
// @access  Private
exports.getManufacturers = async (req, res) => {
  try {
    const manufacturers = await Manufacturer.find().sort({ name: 1 });
    
    // Transform to frontend format
    const transformedManufacturers = manufacturers.map(manufacturer => {
      // Convert productsOffered array to comma-separated string
      const productsOffered = manufacturer.productsOffered.map(p => p.productType).join(', ');
      
      // Convert productsOffered to price string format
      const productPrices = manufacturer.productsOffered.map(p => `${p.productType}: ${p.price}`).join(', ');
      
      return {
        _id: manufacturer._id,
        id: manufacturer._id,
        Manufacturer_ID: `M${String(manufacturer._id).slice(-3)}`,
        Manufacturer_Name: manufacturer.name,
        Location: manufacturer.location,
        Contact_Number: manufacturer.contact,
        Products_Offered: productsOffered,
        'Product_Prices (Rs.)': productPrices,
        // Also include structured data for easier access
        productsOffered: manufacturer.productsOffered
      };
    });
    
    res.status(200).json(transformedManufacturers);
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Create manufacturer
// @route   POST /api/manufacturers
// @access  Private/Admin
exports.createManufacturer = async (req, res) => {
  try {
    // Support both frontend format and backend format
    let name, location, contact, productsOffered;
    
    if (req.body.Manufacturer_Name) {
      // Frontend format - parse Products_Offered and Product_Prices
      name = req.body.Manufacturer_Name;
      location = req.body.Location;
      contact = req.body.Contact_Number;
      
      // Parse products offered and prices
      const productsStr = req.body.Products_Offered || '';
      const pricesStr = req.body['Product_Prices (Rs.)'] || '';
      
      const productTypes = productsStr.split(',').map(p => p.trim()).filter(p => p);
      const priceMap = {};
      
      // Parse prices string like "W-Beam: 420, Thrie-Beam: 460"
      if (pricesStr) {
        pricesStr.split(',').forEach(item => {
          const match = item.trim().match(/(.+?):\s*(\d+)/);
          if (match) {
            priceMap[match[1].trim()] = parseInt(match[2]);
          }
        });
      }
      
      productsOffered = productTypes.map(type => ({
        productType: type,
        price: priceMap[type] || 0
      }));
    } else {
      // Backend format
      name = req.body.name;
      location = req.body.location;
      contact = req.body.contact;
      productsOffered = req.body.productsOffered || [];
    }

    // Validate required fields
    if (!name || !location || !contact) {
      return res.status(400).json({ success: false, message: 'Please provide name/Manufacturer_Name, location/Location, and contact/Contact_Number' });
    }

    // Validate name
    const nameValidation = validateName(name, 'Manufacturer name', 160);
    if (!nameValidation.valid) {
      return res.status(400).json({ success: false, message: nameValidation.message });
    }

    // Validate location
    const locationValidation = validateLocation(location);
    if (!locationValidation.valid) {
      return res.status(400).json({ success: false, message: locationValidation.message });
    }

    // Validate phone
    const phoneValidation = validatePhone(contact);
    if (!phoneValidation.valid) {
      return res.status(400).json({ success: false, message: phoneValidation.message });
    }

    // Validate productsOffered
    if (!Array.isArray(productsOffered) || productsOffered.length === 0) {
      return res.status(400).json({ success: false, message: 'At least one product must be provided' });
    }

    // Validate each product - MUST exist in Products database
    for (const product of productsOffered) {
      if (!product.productType || !product.price) {
        return res.status(400).json({ success: false, message: 'Each product must have productType and price' });
      }

      const productTypeValidation = validateName(product.productType, 'Product type', 160);
      if (!productTypeValidation.valid) {
        return res.status(400).json({ success: false, message: productTypeValidation.message });
      }

      const priceValidation = validateNumeric(product.price, 'Product price', false, 0.01);
      if (!priceValidation.valid) {
        return res.status(400).json({ success: false, message: priceValidation.message });
      }

      // CRITICAL: Verify product exists in Products database
      // Extract product name from productType (frontend sends productType as subtype)
      // We need to find which product this subtype belongs to
      const allProducts = await Product.find();
      let productFound = false;
      let productName = null;

      // Check if productType matches any product's subtype
      for (const dbProduct of allProducts) {
        if (dbProduct.subtypes && dbProduct.subtypes.includes(product.productType)) {
          productFound = true;
          productName = dbProduct.name;
          break;
        }
      }

      if (!productFound) {
        return res.status(400).json({ 
          success: false, 
          message: `Invalid product. Product type "${product.productType}" does not exist in the Products database. Please add this product in the Products page first.` 
        });
      }
    }

    // Check for duplicate manufacturers
    const allManufacturers = await Manufacturer.find();
    for (const existingManufacturer of allManufacturers) {
      const nameScore = fuzzyMatch(name, existingManufacturer.name);
      
      if (nameScore >= 0.85) {
        // Check if same product + productType combination exists
        for (const newProduct of productsOffered) {
          for (const existingProduct of existingManufacturer.productsOffered) {
            const productTypeScore = fuzzyMatch(newProduct.productType, existingProduct.productType);
            if (productTypeScore >= 0.85) {
              return res.status(409).json({
                success: false,
                message: 'Duplicate entry detected',
                existing: {
                  name: existingManufacturer.name,
                  location: existingManufacturer.location,
                  productType: existingProduct.productType,
                  price: existingProduct.price
                }
              });
            }
          }
        }
        
        if (nameScore >= 0.95) {
          // Very high name match
          return res.status(409).json({
            success: false,
            message: 'Duplicate entry detected',
            existing: {
              name: existingManufacturer.name,
              location: existingManufacturer.location,
              contact: existingManufacturer.contact
            }
          });
        }
      }
    }

    const manufacturer = await Manufacturer.create({
      name,
      location,
      contact,
      productsOffered: productsOffered
    });

    // Return in frontend format
    const productsOfferedStr = manufacturer.productsOffered.map(p => p.productType).join(', ');
    const productPricesStr = manufacturer.productsOffered.map(p => `${p.productType}: ${p.price}`).join(', ');
    
    const response = {
      _id: manufacturer._id,
      id: manufacturer._id,
      Manufacturer_ID: `M${String(manufacturer._id).slice(-3)}`,
      Manufacturer_Name: manufacturer.name,
      Location: manufacturer.location,
      Contact_Number: manufacturer.contact,
      Products_Offered: productsOfferedStr,
      'Product_Prices (Rs.)': productPricesStr,
      productsOffered: manufacturer.productsOffered
    };

    res.status(201).json({ success: true, data: response });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Update manufacturer
// @route   PUT /api/manufacturers/:id
// @access  Private/Admin
exports.updateManufacturer = async (req, res) => {
  try {
    const manufacturer = await Manufacturer.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    );

    if (!manufacturer) {
      return res.status(404).json({ success: false, message: 'Manufacturer not found' });
    }

    // Return in frontend format
    const productsOfferedStr = manufacturer.productsOffered.map(p => p.productType).join(', ');
    const productPricesStr = manufacturer.productsOffered.map(p => `${p.productType}: ${p.price}`).join(', ');
    
    const response = {
      _id: manufacturer._id,
      id: manufacturer._id,
      Manufacturer_ID: `M${String(manufacturer._id).slice(-3)}`,
      Manufacturer_Name: manufacturer.name,
      Location: manufacturer.location,
      Contact_Number: manufacturer.contact,
      Products_Offered: productsOfferedStr,
      'Product_Prices (Rs.)': productPricesStr,
      productsOffered: manufacturer.productsOffered
    };

    res.status(200).json({ success: true, data: response });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Delete manufacturer
// @route   DELETE /api/manufacturers/:id
// @access  Private/Admin
exports.deleteManufacturer = async (req, res) => {
  try {
    const manufacturer = await Manufacturer.findById(req.params.id);

    if (!manufacturer) {
      return res.status(404).json({ success: false, message: 'Manufacturer not found' });
    }

    await Manufacturer.findByIdAndDelete(req.params.id);

    res.status(200).json({ success: true, message: 'Manufacturer deleted successfully' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
