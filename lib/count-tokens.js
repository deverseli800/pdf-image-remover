import * as mupdf from 'mupdf';
import fs from 'fs';
import { getEncoding } from 'js-tiktoken';

// Initialize tokenizer (cl100k_base is used by GPT-4 and Claude)
const encoding = getEncoding('cl100k_base');

/**
 * Extract all text from a PDF file
 * @param {string|Buffer} pdfInput - Path to PDF or PDF buffer
 * @returns {string} - Extracted text
 */
export function extractTextFromPdf(pdfInput) {
  const pdfBytes = typeof pdfInput === 'string'
    ? fs.readFileSync(pdfInput)
    : pdfInput;

  const doc = mupdf.Document.openDocument(pdfBytes, 'application/pdf');
  const pageCount = doc.countPages();

  let text = '';
  for (let i = 0; i < pageCount; i++) {
    const page = doc.loadPage(i);
    text += page.toStructuredText('preserve-whitespace').asText();
  }

  return text;
}

/**
 * Count tokens in text using tiktoken
 * @param {string} text - Text to tokenize
 * @returns {number} - Token count
 */
export function countTokens(text) {
  return encoding.encode(text).length;
}

/**
 * Count tokens in a PDF file
 * @param {string|Buffer} pdfInput - Path to PDF or PDF buffer
 * @returns {number} - Token count
 */
export function countPdfTokens(pdfInput) {
  const text = extractTextFromPdf(pdfInput);
  return countTokens(text);
}
