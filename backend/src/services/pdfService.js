import fs from 'fs';
import pdfParse from 'pdf-parse';

/**
 * Extract text content from a PDF file on disk.
 * @param {string} filePath – absolute or relative path to the PDF
 * @returns {Promise<string>} – extracted text
 */
export async function extractTextFromPdf(filePath) {
  const buffer = fs.readFileSync(filePath);
  const data = await pdfParse(buffer);
  return data.text;
}

/**
 * Get metadata from a PDF file.
 * @param {string} filePath
 * @returns {Promise<{pages: number, info: object}>}
 */
export async function getPdfMetadata(filePath) {
  const buffer = fs.readFileSync(filePath);
  const data = await pdfParse(buffer);
  return {
    pages: data.numpages,
    info: data.info,
  };
}
