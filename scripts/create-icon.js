const fs = require('fs');
const path = require('path');

const publicDir = path.join(process.cwd(), 'public');
const logoPath = path.join(publicDir, 'logo.png');
const svgPath = path.join(publicDir, 'icon.svg');

try {
    const logoBuffer = fs.readFileSync(logoPath);
    const base64Logo = logoBuffer.toString('base64');
    const mimeType = 'image/png';

    // Create a 512x512 SVG with black background and centered image
    // Using preserveAspectRatio="xMidYMid meet" to ensure it fits within the square without distortion
    const svgContent = `<svg width="512" height="512" viewBox="0 0 512 512" xmlns="http://www.w3.org/2000/svg">
  <rect width="512" height="512" fill="#000000"/>
  <image href="data:${mimeType};base64,${base64Logo}" width="412" height="412" x="50" y="50" preserveAspectRatio="xMidYMid meet" />
</svg>`;

    fs.writeFileSync(svgPath, svgContent);
    console.log('Successfully created icon.svg');
} catch (error) {
    console.error('Error creating SVG:', error);
    process.exit(1);
}
