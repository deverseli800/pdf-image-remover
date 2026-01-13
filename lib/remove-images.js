import * as mupdf from 'mupdf';
import fs from 'fs';

/**
 * Remove all images from a PDF file using MuPDF
 * @param {string} inputPath - Path to the input PDF
 * @param {string} outputPath - Path for the output PDF
 * @returns {Promise<{success: boolean, imagesRemoved: number, error?: string}>}
 */
export async function removeImagesFromPdf(inputPath, outputPath) {
  try {
    const pdfBytes = fs.readFileSync(inputPath);
    const doc = mupdf.Document.openDocument(pdfBytes, 'application/pdf');

    // Find all image object IDs
    const imageObjectIds = new Set();
    const objectCount = doc.countObjects();

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
                imageObjectIds.add(i);
              }
            }
          }
        }
      } catch (e) {}
    }

    const imagesRemoved = imageObjectIds.size;

    if (imagesRemoved > 0) {
      // Remove image references from all pages
      const pageCount = doc.countPages();
      for (let i = 0; i < pageCount; i++) {
        const page = doc.loadPage(i);
        removeImageRefsFromPage(page, doc, imageObjectIds);
      }

      // Delete the image objects themselves
      for (const objId of imageObjectIds) {
        try {
          doc.deleteObject(doc.newIndirect(objId, 0));
        } catch (e) {}
      }
    }

    // Save the modified document
    const outputBuffer = doc.saveToBuffer('compress,garbage');
    fs.writeFileSync(outputPath, outputBuffer.asUint8Array());

    return { success: true, imagesRemoved };
  } catch (error) {
    return { success: false, imagesRemoved: 0, error: error.message };
  }
}

/**
 * Remove image references from a page's XObject dictionary
 */
function removeImageRefsFromPage(page, doc, imageObjectIds) {
  try {
    const pdfPage = page.getObject();
    if (!pdfPage || pdfPage.isNull()) return;

    const resources = pdfPage.get('Resources');
    if (!resources || resources.isNull()) return;

    const xObject = resources.get('XObject');
    if (!xObject || xObject.isNull()) return;

    // Find keys that reference image objects
    const keysToRemove = [];
    xObject.forEach((value, key) => {
      if (value.isIndirect()) {
        const objId = value.asIndirect();
        if (imageObjectIds.has(objId)) {
          keysToRemove.push(key);
        }
      }
    });

    // Remove the references
    for (const key of keysToRemove) {
      xObject.delete(key);
    }
  } catch (e) {}
}
