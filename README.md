# PDF Image Remover

A Node.js CLI utility that removes all images from PDF files.

## Installation

```bash
npm install
```

## Usage

Process all PDFs in a directory:

```bash
node index.js /path/to/pdf/directory
```

Output files are saved in the same directory with a `_no_images.pdf` suffix.

### Example

```bash
node index.js ~/Documents/my-pdfs
```

This will process:
- `report.pdf` → `report_no_images.pdf`
- `document.pdf` → `document_no_images.pdf`

Already-processed files (ending in `_no_images.pdf`) are automatically skipped.

## How It Works

Uses [MuPDF](https://mupdf.com/) via the `mupdf` npm package to:
1. Scan the PDF for image objects
2. Remove image references from all pages
3. Delete the image objects
4. Save a compressed version of the PDF
