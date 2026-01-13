# PDF Image Remover

A Node.js CLI utility that removes all images from PDF files.

## Project Structure

```
pdf-image-remover/
├── index.js              # CLI entry point - handles args, finds PDFs, orchestrates processing
├── lib/
│   └── remove-images.js  # Core logic - uses MuPDF to find and remove images
├── package.json          # ES modules enabled ("type": "module")
└── README.md
```

## Key Technical Details

- **ES Modules**: Project uses `"type": "module"` - use `import`/`export` syntax
- **PDF Library**: Uses `mupdf` npm package (WASM-based, no external dependencies)
- **Image Detection**: Scans all PDF objects for `/Subtype /Image` entries
- **Image Removal**: Deletes image objects and removes references from page XObject dictionaries

## Commands

```bash
# Run on a directory
node index.js /path/to/pdfs

# Show help
node index.js --help
```

## Output Behavior

- Creates `filename_no_images.pdf` in the same directory as the original
- Skips files already ending in `_no_images.pdf`
- Preserves original files (non-destructive)
