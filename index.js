#!/usr/bin/env node

import fs from 'fs/promises';
import path from 'path';
import { removeImagesFromPdf } from './lib/remove-images.js';

const SUFFIX = '_no_images';

async function main() {
  const args = process.argv.slice(2);

  if (args.length === 0 || args.includes('--help') || args.includes('-h')) {
    console.log(`
PDF Image Remover - Remove all images from PDF files

Usage:
  node index.js <directory>

Arguments:
  directory    Path to directory containing PDF files

Examples:
  node index.js ./documents
  node index.js /Users/me/Downloads/pdfs
`);
    process.exit(args.length === 0 ? 1 : 0);
  }

  const dirPath = path.resolve(args[0]);

  // Check if directory exists
  try {
    const stat = await fs.stat(dirPath);
    if (!stat.isDirectory()) {
      console.error(`Error: "${dirPath}" is not a directory`);
      process.exit(1);
    }
  } catch (err) {
    console.error(`Error: Directory "${dirPath}" does not exist`);
    process.exit(1);
  }

  // Find all PDF files (non-recursive)
  const files = await fs.readdir(dirPath);
  const pdfFiles = files.filter(file => {
    const lower = file.toLowerCase();
    // Skip already processed files and include only .pdf files
    return lower.endsWith('.pdf') && !lower.endsWith(`${SUFFIX.toLowerCase()}.pdf`);
  });

  if (pdfFiles.length === 0) {
    console.log('No PDF files found in the directory.');
    process.exit(0);
  }

  console.log(`Found ${pdfFiles.length} PDF file(s) to process.\n`);

  let processed = 0;
  let failed = 0;
  let totalImagesRemoved = 0;

  for (const file of pdfFiles) {
    const inputPath = path.join(dirPath, file);
    const baseName = file.slice(0, -4); // Remove .pdf extension
    const outputPath = path.join(dirPath, `${baseName}${SUFFIX}.pdf`);

    process.stdout.write(`Processing: ${file}... `);

    const result = await removeImagesFromPdf(inputPath, outputPath);

    if (result.success) {
      console.log(`Done (${result.imagesRemoved} image(s) removed)`);
      processed++;
      totalImagesRemoved += result.imagesRemoved;
    } else {
      console.log(`Failed: ${result.error}`);
      failed++;
    }
  }

  console.log(`
Summary:
  Processed: ${processed} file(s)
  Failed: ${failed} file(s)
  Total images removed: ${totalImagesRemoved}
`);

  process.exit(failed > 0 ? 1 : 0);
}

main().catch(err => {
  console.error('Unexpected error:', err.message);
  process.exit(1);
});
