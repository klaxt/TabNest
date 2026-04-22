# Icon Generation

The `icon.svg` file contains the source icon for the extension.

## Converting SVG to PNG

You need to generate PNG icons in the following sizes:
- icon-16.png (16x16)
- icon-32.png (32x32)
- icon-48.png (48x48)
- icon-128.png (128x128)

### Using ImageMagick (Recommended)

```bash
# Install ImageMagick if you don't have it
brew install imagemagick

# Generate all icon sizes
convert -background none icon.svg -resize 16x16 icon-16.png
convert -background none icon.svg -resize 32x32 icon-32.png
convert -background none icon.svg -resize 48x48 icon-48.png
convert -background none icon.svg -resize 128x128 icon-128.png
```

### Using Online Tools

Alternatively, you can use online converters like:
- https://cloudconvert.com/svg-to-png
- https://svgtopng.com/

Upload `icon.svg` and download the PNG files at the required sizes.

### Using Design Tools

You can also open `icon.svg` in any design tool (Figma, Sketch, Adobe Illustrator, etc.) and export at the required sizes.
