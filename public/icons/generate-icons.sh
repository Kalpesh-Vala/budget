#!/bin/bash
# Script to generate PWA icons using Node.js
# This script creates SVG-based icon placeholders that can be converted to PNG

# Create icons directory
mkdir -p public/icons

# Create a simple SVG icon (192x192)
cat > public/icons/generate-icons.js << 'EOF'
const fs = require('fs');
const path = require('path');

// SVG template for icon
const svgTemplate = (size, text = 'BT') => `
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${size} ${size}" width="${size}" height="${size}">
  <defs>
    <style>
      .bg { fill: #2563eb; }
      .icon { fill: white; font-family: Arial, sans-serif; font-size: ${size * 0.6}px; font-weight: bold; text-anchor: middle; dominant-baseline: middle; }
    </style>
  </defs>
  <rect class="bg" width="${size}" height="${size}"/>
  <text class="icon" x="${size / 2}" y="${size / 2}">${text}</text>
</svg>
`;

const maskableTemplate = (size, text = 'BT') => `
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${size} ${size}" width="${size}" height="${size}">
  <defs>
    <style>
      .bg { fill: #2563eb; }
      .icon { fill: white; font-family: Arial, sans-serif; font-size: ${size * 0.5}px; font-weight: bold; text-anchor: middle; dominant-baseline: middle; }
    </style>
  </defs>
  <circle cx="${size / 2}" cy="${size / 2}" r="${size / 2}" class="bg"/>
  <text class="icon" x="${size / 2}" y="${size / 2 + 20}">${text}</text>
</svg>
`;

// Create icons
const icons = [
  { size: 192, regular: true, maskable: true },
  { size: 512, regular: true, maskable: true },
];

icons.forEach(({ size, regular, maskable }) => {
  if (regular) {
    const svg = svgTemplate(size);
    fs.writeFileSync(path.join(__dirname, `icon-${size}x${size}.svg`), svg);
    console.log(`Created icon-${size}x${size}.svg`);
  }

  if (maskable) {
    const svg = maskableTemplate(size);
    fs.writeFileSync(path.join(__dirname, `icon-${size}x${size}-maskable.svg`), svg);
    console.log(`Created icon-${size}x${size}-maskable.svg`);
  }
});

// Create shortcut icons
const shortcutSvgs = {
  'add-expense': `
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 192 192" width="192" height="192">
  <defs>
    <style>
      .bg { fill: #16a34a; }
      .icon { fill: white; font-family: Arial, sans-serif; font-size: 100px; font-weight: bold; text-anchor: middle; dominant-baseline: middle; }
    </style>
  </defs>
  <rect class="bg" width="192" height="192"/>
  <text class="icon" x="96" y="96">+</text>
</svg>
  `,
  'dashboard': `
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 192 192" width="192" height="192">
  <defs>
    <style>
      .bg { fill: #9333ea; }
      .icon { fill: white; font-family: Arial, sans-serif; font-size: 80px; font-weight: bold; text-anchor: middle; dominant-baseline: middle; }
    </style>
  </defs>
  <rect class="bg" width="192" height="192"/>
  <text class="icon" x="96" y="96">📊</text>
</svg>
  `,
};

Object.entries(shortcutSvgs).forEach(([name, svg]) => {
  fs.writeFileSync(path.join(__dirname, `${name}.svg`), svg);
  console.log(`Created ${name}.svg`);
});

console.log('✅ SVG icons generated successfully!');
console.log('Note: Convert these SVG files to PNG using a tool like:');
console.log('- Online: convertio.co or cloudconvert.com');
console.log('- CLI: convert (ImageMagick), ffmpeg, or sharp');
console.log('- Node: npm install sharp, then use sharp-pwa-icons package');
EOF

# Run the script
node public/icons/generate-icons.js

echo "✅ Icon generation script completed!"
echo ""
echo "📝 Next steps:"
echo "1. Convert generated SVG files to PNG:"
echo "   - Use online converter: https://cloudconvert.com/"
echo "   - Or use ImageMagick: convert icon-192x192.svg icon-192x192.png"
echo "   - Or use Node.js sharp library"
echo ""
echo "2. Save PNG files to public/icons/ directory"
echo "3. Keep filenames as: icon-192x192.png, icon-512x512.png, etc."
echo ""
