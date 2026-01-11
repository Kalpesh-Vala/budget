#!/usr/bin/env node

/**
 * Icon Generator for Budget Tracker PWA
 * Generates placeholder icons in PNG format
 * Install: npm install sharp
 * Run: node generate-pwa-icons.js
 */

const fs = require('fs');
const path = require('path');

// For now, create SVG versions that can be manually converted to PNG
// Or use this script with sharp library

const iconDir = path.join(__dirname, 'public/icons');

// Create directory if it doesn't exist
if (!fs.existsSync(iconDir)) {
  fs.mkdirSync(iconDir, { recursive: true });
}

console.log('📦 PWA Icon Generation Script');
console.log('==============================');
console.log('');

// Try to use sharp if available
try {
  const sharp = require('sharp');
  
  // Create icon variants
  const createIcon = (size, name, isMaskable = false) => {
    const svg = Buffer.from(`
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${size} ${size}">
        <defs>
          <style>
            .bg { fill: #2563eb; }
            .badge { fill: #10b981; }
            .text { fill: white; font-family: Arial, sans-serif; font-size: ${size * 0.5}px; font-weight: bold; text-anchor: middle; dominant-baseline: middle; }
          </style>
        </defs>
        ${isMaskable ? `<circle cx="${size/2}" cy="${size/2}" r="${size/2}" class="bg"/>` : `<rect width="${size}" height="${size}" class="bg"/>`}
        <text class="text" x="${size/2}" y="${size/2}">₹</text>
      </svg>
    `);
    
    return sharp(svg)
      .png()
      .toFile(path.join(iconDir, name));
  };

  Promise.all([
    createIcon(192, 'icon-192x192.png', false),
    createIcon(192, 'icon-192x192-maskable.png', true),
    createIcon(512, 'icon-512x512.png', false),
    createIcon(512, 'icon-512x512-maskable.png', true),
  ]).then(() => {
    console.log('✅ PNG icons generated successfully!');
    console.log('');
    process.exit(0);
  }).catch((err) => {
    console.error('Error generating icons:', err);
    process.exit(1);
  });
} catch (err) {
  console.log('⚠️  Sharp not installed. Creating SVG icons instead...');
  console.log('');
  console.log('To generate PNG icons, install sharp:');
  console.log('npm install sharp');
  console.log('');
  
  // Create SVG versions
  const svgIcons = {
    'icon-192x192.svg': `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 192 192"><rect width="192" height="192" fill="#2563eb"/><text x="96" y="96" font-size="100" font-weight="bold" text-anchor="middle" dominant-baseline="middle" fill="white" font-family="Arial">₹</text></svg>`,
    'icon-512x512.svg': `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512"><rect width="512" height="512" fill="#2563eb"/><text x="256" y="256" font-size="280" font-weight="bold" text-anchor="middle" dominant-baseline="middle" fill="white" font-family="Arial">₹</text></svg>`,
    'icon-192x192-maskable.svg': `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 192 192"><circle cx="96" cy="96" r="96" fill="#2563eb"/><text x="96" y="100" font-size="100" font-weight="bold" text-anchor="middle" dominant-baseline="middle" fill="white" font-family="Arial">₹</text></svg>`,
    'icon-512x512-maskable.svg': `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512"><circle cx="256" cy="256" r="256" fill="#2563eb"/><text x="256" y="270" font-size="280" font-weight="bold" text-anchor="middle" dominant-baseline="middle" fill="white" font-family="Arial">₹</text></svg>`,
  };
  
  Object.entries(svgIcons).forEach(([filename, svg]) => {
    fs.writeFileSync(path.join(iconDir, filename), svg);
    console.log(`✅ Created ${filename}`);
  });
  
  console.log('');
  console.log('📝 Next steps:');
  console.log('1. Install sharp: npm install sharp');
  console.log('2. Run this script again: node generate-pwa-icons.js');
  console.log('');
  console.log('OR');
  console.log('');
  console.log('Convert SVG to PNG manually using:');
  console.log('- Online: https://cloudconvert.com/svg-to-png');
  console.log('- ImageMagick: convert icon-192x192.svg icon-192x192.png');
  console.log('- ffmpeg: ffmpeg -i icon-192x192.svg icon-192x192.png');
}
