"""
Flask backend for PDF extraction using pdfminer.six
"""
from flask import Flask, request, jsonify
from flask_cors import CORS
from pdfminer.high_level import extract_text
import re
import os
from werkzeug.utils import secure_filename

app = Flask(__name__)
CORS(app)  # Enable CORS for frontend requests

# Configuration
UPLOAD_FOLDER = 'uploads'
ALLOWED_EXTENSIONS = {'pdf'}
MAX_FILE_SIZE = 10 * 1024 * 1024  # 10MB

# Create uploads directory if it doesn't exist
os.makedirs(UPLOAD_FOLDER, exist_ok=True)

app.config['UPLOAD_FOLDER'] = UPLOAD_FOLDER
app.config['MAX_CONTENT_LENGTH'] = MAX_FILE_SIZE


def allowed_file(filename):
    """Check if file extension is allowed"""
    return '.' in filename and filename.rsplit('.', 1)[1].lower() in ALLOWED_EXTENSIONS


def normalize_text(text):
    """Normalize extracted text"""
    if not text:
        return ""
    
    # Keep original for extraction, create normalized version for matching
    # Replace newlines with spaces
    text = text.replace('\n', ' ').replace('\r', ' ')
    
    # Remove extra spaces
    text = re.sub(r'\s+', ' ', text)
    
    # Normalize punctuation (standardize colons, dashes)
    text = re.sub(r'[:;]\s*', ': ', text)
    text = re.sub(r'[-–—]\s*', '-', text)
    
    return text.strip()


def extract_manufacturer(text, normalized_text, manufacturer_list=None):
    """Extract manufacturer name using regex patterns"""
    patterns = [
        r"Manufacturer[: ]+(.+)",
        r"manufacturer[: ]+(.+)",
        r"Mfr[: ]+(.+)",
        r"mfr[: ]+(.+)",
        r"Vendor[: ]+(.+)",
        r"vendor[: ]+(.+)",
        r"Supplier[: ]+(.+)",
        r"supplier[: ]+(.+)",
        r"Party\s+Name[: ]+(.+)",
        r"party\s+name[: ]+(.+)",
    ]
    
    for pattern in patterns:
        matches = re.finditer(pattern, text, re.IGNORECASE)
        for match in matches:
            manufacturer = match.group(1)
            if manufacturer:
                # Clean up the extracted value
                manufacturer = re.sub(r'^[\s:.-]+|[\s:.-]+$', '', manufacturer)
                manufacturer = re.sub(r'\s+', ' ', manufacturer).strip()
                # Remove common trailing words
                manufacturer = re.sub(r'\s+(product|quantity|price|from|to|$)', '', manufacturer, flags=re.IGNORECASE)
                if len(manufacturer) > 2:
                    return manufacturer
    
    return None


def extract_product(text, normalized_text):
    """Extract product name using regex patterns and keyword detection"""
    # Direct keyword detection first
    keywords = {
        'W Beam Crash Barrier': ['w beam', 'w-beam', 'wbeam', 'crash barrier'],
        'Thrie Beam': ['thrie beam', 'thrie-beam'],
        'Double W Beam': ['double w beam', 'double w-beam'],
        'Crash-Tested': ['crash tested', 'crash-tested'],
        'Hot Thermoplastic Paint': ['hot thermoplastic paint', 'thermoplastic paint', 'hot paint'],
        'Signages': ['signages', 'signage', 'signs']
    }
    
    normalized_lower = normalized_text.lower()
    for product_name, keyword_list in keywords.items():
        for keyword in keyword_list:
            if keyword in normalized_lower:
                return product_name
    
    # Regex patterns
    patterns = [
        r"Product[: ]+(.+)",
        r"product[: ]+(.+)",
        r"Item[: ]+(.+)",
        r"item[: ]+(.+)",
        r"Material[: ]+(.+)",
        r"material[: ]+(.+)",
    ]
    
    for pattern in patterns:
        matches = re.finditer(pattern, text, re.IGNORECASE)
        for match in matches:
            product = match.group(1)
            if product:
                product = re.sub(r'^[\s:.-]+|[\s:.-]+$', '', product)
                product = re.sub(r'\s+', ' ', product).strip()
                # Remove trailing words
                product = re.sub(r'\s+(type|quantity|price|from|to|$)', '', product, flags=re.IGNORECASE)
                if len(product) > 2:
                    return product
    
    return None


def extract_subtype(text, normalized_text):
    """Extract product type/subtype using regex patterns"""
    # Direct subtype keywords
    subtype_keywords = {
        'W-Beam': ['w-beam', 'w beam'],
        'Thrie-Beam': ['thrie-beam', 'thrie beam'],
        'Double W-Beam': ['double w-beam', 'double w beam'],
        'Crash-Tested': ['crash-tested', 'crash tested'],
        'White': ['white'],
        'Yellow': ['yellow'],
        'Reflective': ['reflective'],
        'Directional': ['directional'],
        'Informational': ['informational'],
        'Cautionary': ['cautionary']
    }
    
    normalized_lower = normalized_text.lower()
    for subtype_name, keyword_list in subtype_keywords.items():
        for keyword in keyword_list:
            if keyword in normalized_lower:
                return subtype_name
    
    # Regex patterns
    patterns = [
        r"Type[: ]+(.+)",
        r"type[: ]+(.+)",
        r"Product\s+Type[: ]+(.+)",
        r"product\s+type[: ]+(.+)",
        r"Subtype[: ]+(.+)",
        r"subtype[: ]+(.+)",
    ]
    
    for pattern in patterns:
        matches = re.finditer(pattern, text, re.IGNORECASE)
        for match in matches:
            subtype = match.group(1)
            if subtype:
                subtype = re.sub(r'^[\s:.-]+|[\s:.-]+$', '', subtype)
                subtype = re.sub(r'\s+', ' ', subtype).strip()
                # Remove trailing words
                subtype = re.sub(r'\s+(quantity|price|from|to|$)', '', subtype, flags=re.IGNORECASE)
                if len(subtype) > 1:
                    return subtype
    
    return None


def extract_quantity(text, normalized_text):
    """Extract quantity using regex patterns"""
    patterns = [
        r"Quantity[: ]+([0-9]+)",
        r"quantity[: ]+([0-9]+)",
        r"Qty[: ]+([0-9]+)",
        r"qty[: ]+([0-9]+)",
        r"Ordered[: ]+([0-9]+)",
        r"ordered[: ]+([0-9]+)",
    ]
    
    for pattern in patterns:
        matches = re.finditer(pattern, text, re.IGNORECASE)
        for match in matches:
            qty = match.group(1)
            if qty:
                # Extract just the number
                qty_match = re.search(r'(\d+)', qty)
                if qty_match:
                    return qty_match.group(1)
    
    return None


def extract_from_location(text, normalized_text):
    """Extract 'from' location using regex patterns"""
    patterns = [
        r"From[: ]+(.+)",
        r"from[: ]+(.+)",
        r"Origin[: ]+(.+)",
        r"origin[: ]+(.+)",
        r"Shipped\s+From[: ]+(.+)",
        r"shipped\s+from[: ]+(.+)",
    ]
    
    for pattern in patterns:
        matches = re.finditer(pattern, text, re.IGNORECASE)
        for match in matches:
            location = match.group(1)
            if location:
                # Clean up
                location = re.sub(r'^[\s:.-]+|[\s:.-]+$', '', location)
                location = re.sub(r'\s+', ' ', location).strip()
                # Remove trailing words
                location = re.sub(r'\s+(to|destination|delivery|transport|$)', '', location, flags=re.IGNORECASE)
                if len(location) > 2:
                    return location
    
    return None


def extract_to_location(text, normalized_text):
    """Extract 'to' location using regex patterns"""
    patterns = [
        r"To[: ]+(.+)",
        r"to[: ]+(.+)",
        r"Deliver\s+To[: ]+(.+)",
        r"deliver\s+to[: ]+(.+)",
        r"Destination[: ]+(.+)",
        r"destination[: ]+(.+)",
        r"Ship\s+To[: ]+(.+)",
        r"ship\s+to[: ]+(.+)",
    ]
    
    for pattern in patterns:
        matches = re.finditer(pattern, text, re.IGNORECASE)
        for match in matches:
            location = match.group(1)
            if location:
                # Clean up
                location = re.sub(r'^[\s:.-]+|[\s:.-]+$', '', location)
                location = re.sub(r'\s+', ' ', location).strip()
                # Remove trailing words
                location = re.sub(r'\s+(transport|rate|distance|estimated|$)', '', location, flags=re.IGNORECASE)
                if len(location) > 2:
                    return location
    
    return None


@app.route('/extract', methods=['POST'])
@app.route('/extract-pdf', methods=['POST'])
def extract_pdf():
    """Extract fields from uploaded PDF"""
    try:
        # Check if file is present
        if 'file' not in request.files:
            return jsonify({'success': False, 'error': 'No file provided'}), 400
        
        file = request.files['file']
        
        if file.filename == '':
            return jsonify({'success': False, 'error': 'No file selected'}), 400
        
        if not allowed_file(file.filename):
            return jsonify({'success': False, 'error': 'Invalid file type. Only PDF files are allowed.'}), 400
        
        # Save file temporarily
        filename = secure_filename(file.filename)
        filepath = os.path.join(app.config['UPLOAD_FOLDER'], filename)
        file.save(filepath)
        
        try:
            # Extract text using pdfminer
            raw_text = extract_text(filepath)
            
            if not raw_text or len(raw_text.strip()) == 0:
                return jsonify({
                    'success': False,
                    'error': 'Could not extract text from PDF. The PDF may be image-based or corrupted.'
                }), 400
            
            # Normalize text
            normalized_text = normalize_text(raw_text)
            
            # Get manufacturer list from request if provided
            manufacturer_list = request.form.get('manufacturer_list')
            if manufacturer_list:
                try:
                    import json
                    manufacturer_list = json.loads(manufacturer_list)
                except:
                    manufacturer_list = None
            else:
                manufacturer_list = None
            
            # Extract fields
            manufacturer = extract_manufacturer(raw_text, normalized_text, manufacturer_list)
            product = extract_product(raw_text, normalized_text)
            subtype = extract_subtype(raw_text, normalized_text)
            quantity = extract_quantity(raw_text, normalized_text)
            from_location = extract_from_location(raw_text, normalized_text)
            to_location = extract_to_location(raw_text, normalized_text)
            
            # Prepare response with success field
            result = {
                'success': True,
                'manufacturer': manufacturer or '',
                'product': product or '',
                'type': subtype or '',  # Changed from 'subtype' to 'type' to match frontend expectation
                'quantity': quantity or '',
                'from': from_location or '',
                'to': to_location or ''
            }
            
            return jsonify(result), 200
            
        finally:
            # Clean up uploaded file
            if os.path.exists(filepath):
                os.remove(filepath)
                
    except Exception as e:
        return jsonify({'success': False, 'error': f'Error processing PDF: {str(e)}'}), 500


@app.route('/health', methods=['GET'])
def health():
    """Health check endpoint"""
    return jsonify({'status': 'ok'}), 200


if __name__ == '__main__':
    port = int(os.environ.get('PORT', 5001))
    app.run(debug=True, host='0.0.0.0', port=port)

