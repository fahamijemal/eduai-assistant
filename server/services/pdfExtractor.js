const fs = require('fs');
const pdfParse = require('pdf-parse');

/**
 * Extract text content from a PDF file
 * @param {string} filePath - Path to the PDF file
 * @returns {string} Extracted text
 */
async function extractText(filePath) {
  try {
    const dataBuffer = fs.readFileSync(filePath);
    const data = await pdfParse(dataBuffer);

    if (!data.text || data.text.trim().length === 0) {
      throw new Error('No readable text found in PDF. The document may be scanned or image-based.');
    }

    return data.text;
  } catch (error) {
    if (error.message.includes('No readable text')) {
      throw error;
    }
    console.error('PDF extraction error:', error.message);
    throw new Error('Failed to extract text from PDF. The file may be corrupted.');
  }
}

module.exports = { extractText };
