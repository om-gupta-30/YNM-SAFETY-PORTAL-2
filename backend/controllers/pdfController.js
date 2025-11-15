const axios = require('axios');
const FormData = require('form-data');
const fs = require('fs');
const path = require('path');

// @desc    Extract PDF data
// @route   POST /api/pdf/extract
// @access  Private
exports.extractPdf = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ success: false, message: 'No PDF file provided' });
    }

    const pythonServiceUrl = process.env.PYTHON_SERVICE_URL || 'http://localhost:5001';
    const pdfServiceUrl = `${pythonServiceUrl}/extract-pdf`;
    
    // Forward PDF to Python service
    const formData = new FormData();
    formData.append('file', fs.createReadStream(req.file.path));

    // Optionally send manufacturer list
    if (req.body.manufacturer_list) {
      formData.append('manufacturer_list', req.body.manufacturer_list);
    }

    const response = await axios.post(pdfServiceUrl, formData, {
      headers: formData.getHeaders(),
      maxContentLength: Infinity,
      maxBodyLength: Infinity
    });

    // Clean up uploaded file
    fs.unlinkSync(req.file.path);

    res.status(200).json({ success: true, data: response.data });
  } catch (error) {
    // Clean up uploaded file on error
    if (req.file && fs.existsSync(req.file.path)) {
      fs.unlinkSync(req.file.path);
    }

    if (error.response) {
      return res.status(error.response.status).json({
        success: false,
        message: error.response.data.error || 'PDF extraction failed'
      });
    }

    res.status(500).json({
      success: false,
      message: error.message || 'Error processing PDF'
    });
  }
};

