import * as mupdf from 'mupdf';
import fs from 'fs';
import { getEncoding } from 'js-tiktoken';

// Initialize tokenizer (cl100k_base is used by GPT-4 and Claude)
const encoding = getEncoding('cl100k_base');

// Claude's max image dimension before resizing
const MAX_IMAGE_DIMENSION = 1568;

/**
 * Calculate tokens for an image based on Claude's formula
 * tokens = (width * height) / 750
 * Images are downscaled if any dimension exceeds 1568px
 * @param {number} width - Image width in pixels
 * @param {number} height - Image height in pixels
 * @returns {number} - Token count for the image
 */
export function calculateImageTokens(width, height) {
  // Downscale if any dimension exceeds max
  const longEdge = Math.max(width, height);
  if (longEdge > MAX_IMAGE_DIMENSION) {
    const scale = MAX_IMAGE_DIMENSION / longEdge;
    width = Math.floor(width * scale);
    height = Math.floor(height * scale);
  }

  return Math.ceil((width * height) / 750);
}

/**
 * Extract all images and their dimensions from a PDF
 * @param {Buffer} pdfBytes - PDF file bytes
 * @returns {Array<{width: number, height: number}>} - Array of image dimensions
 */
function extractImageDimensions(pdfBytes) {
  const doc = mupdf.Document.openDocument(pdfBytes, 'application/pdf');
  const objectCount = doc.countObjects();
  const images = [];

  for (let i = 1; i <= objectCount; i++) {
    try {
      const obj = doc.newIndirect(i, 0);
      if (obj && !obj.isNull()) {
        const resolved = obj.resolve ? obj.resolve() : obj;
        if (resolved.isDictionary && resolved.isDictionary()) {
          const subtype = resolved.get('Subtype');
          if (subtype && !subtype.isNull()) {
            const subtypeStr = subtype.asName ? subtype.asName() : subtype.toString();
            if (subtypeStr === 'Image' || subtypeStr === '/Image') {
              // Get image dimensions
              const widthObj = resolved.get('Width');
              const heightObj = resolved.get('Height');
              if (widthObj && heightObj) {
                const width = widthObj.asNumber ? widthObj.asNumber() : parseInt(widthObj.toString());
                const height = heightObj.asNumber ? heightObj.asNumber() : parseInt(heightObj.toString());
                if (width > 0 && height > 0) {
                  images.push({ width, height });
                }
              }
            }
          }
        }
      }
    } catch (e) {}
  }

  return images;
}

/**
 * Extract all text from a PDF file
 * @param {Buffer} pdfBytes - PDF file bytes
 * @returns {string} - Extracted text
 */
function extractText(pdfBytes) {
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
 * Count all tokens in a PDF file (text + images)
 * @param {string|Buffer} pdfInput - Path to PDF or PDF buffer
 * @returns {{textTokens: number, imageTokens: number, totalTokens: number, imageCount: number}}
 */
export function countPdfTokens(pdfInput) {
  const pdfBytes = typeof pdfInput === 'string'
    ? fs.readFileSync(pdfInput)
    : pdfInput;

  // Count text tokens
  const text = extractText(pdfBytes);
  const textTokens = countTokens(text);

  // Count image tokens
  const images = extractImageDimensions(pdfBytes);
  let imageTokens = 0;
  for (const img of images) {
    imageTokens += calculateImageTokens(img.width, img.height);
  }

  return {
    textTokens,
    imageTokens,
    totalTokens: textTokens + imageTokens,
    imageCount: images.length
  };
}
