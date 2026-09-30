const sharp = require('sharp');
const fs = require('fs');
const path = require('path');

const BASE_IMG = path.join(__dirname, '..', 'public', 'assets', 'dashboard', 'weather-bg.jpg');
const OUT_DIR = path.join(__dirname, '..', 'public', 'assets', 'dashboard');
const WIDTH = 1376;
const HEIGHT = 768;

async function generateSunny() {
    console.log('Generating weather-sunny.jpg...');
    const svgOverlay = `
    <svg width="${WIDTH}" height="${HEIGHT}" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <!-- Radiant Sun Orb -->
        <radialGradient id="sunGlow" cx="82%" cy="22%" r="45%" fx="82%" fy="22%">
          <stop offset="0%" stop-color="#fffbeb" stop-opacity="0.95"/>
          <stop offset="15%" stop-color="#fbbf24" stop-opacity="0.8"/>
          <stop offset="35%" stop-color="#f59e0b" stop-opacity="0.45"/>
          <stop offset="65%" stop-color="#ea580c" stop-opacity="0.15"/>
          <stop offset="100%" stop-color="#b45309" stop-opacity="0"/>
        </radialGradient>
        <!-- Sun Rays -->
        <linearGradient id="sunBeam" x1="85%" y1="20%" x2="20%" y2="90%">
          <stop offset="0%" stop-color="#fef08a" stop-opacity="0.35"/>
          <stop offset="40%" stop-color="#f59e0b" stop-opacity="0.15"/>
          <stop offset="100%" stop-color="#d97706" stop-opacity="0"/>
        </linearGradient>
        <!-- Warm Golden Gradient -->
        <linearGradient id="warmGrade" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stop-color="#38bdf8" stop-opacity="0.08"/>
          <stop offset="60%" stop-color="#f59e0b" stop-opacity="0.25"/>
          <stop offset="100%" stop-color="#b45309" stop-opacity="0.35"/>
        </linearGradient>
      </defs>
      <!-- Warm grade -->
      <rect width="${WIDTH}" height="${HEIGHT}" fill="url(#warmGrade)"/>
      <!-- Sun orb & wide glow -->
      <rect width="${WIDTH}" height="${HEIGHT}" fill="url(#sunGlow)"/>
      <!-- Volumetric sunbeams -->
      <polygon points="1120,160 200,768 500,768" fill="url(#sunBeam)" opacity="0.6"/>
      <polygon points="1130,170 600,768 850,768" fill="url(#sunBeam)" opacity="0.45"/>
      <polygon points="1110,150 0,550 0,720" fill="url(#sunBeam)" opacity="0.35"/>
    </svg>
    `;

    await sharp(BASE_IMG)
        .modulate({ brightness: 1.08, saturation: 1.25 })
        .composite([{ input: Buffer.from(svgOverlay), blend: 'screen' }])
        .jpeg({ quality: 90, mozjpeg: true })
        .toFile(path.join(OUT_DIR, 'weather-sunny.jpg'));
    console.log('✓ Created weather-sunny.jpg');
}

async function generateCloudy() {
    console.log('Generating weather-cloudy.jpg...');
    const svgOverlay = `
    <svg width="${WIDTH}" height="${HEIGHT}" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <!-- Overcast Moody Sky -->
        <linearGradient id="cloudySky" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stop-color="#334155" stop-opacity="0.6"/>
          <stop offset="35%" stop-color="#475569" stop-opacity="0.45"/>
          <stop offset="70%" stop-color="#64748b" stop-opacity="0.3"/>
          <stop offset="100%" stop-color="#1e293b" stop-opacity="0.5"/>
        </linearGradient>
        <!-- Soft cloud puff gradients -->
        <radialGradient id="cloudPuff1" cx="30%" cy="20%" r="50%">
          <stop offset="0%" stop-color="#94a3b8" stop-opacity="0.4"/>
          <stop offset="100%" stop-color="#475569" stop-opacity="0"/>
        </radialGradient>
        <radialGradient id="cloudPuff2" cx="75%" cy="30%" r="45%">
          <stop offset="0%" stop-color="#cbd5e1" stop-opacity="0.35"/>
          <stop offset="100%" stop-color="#334155" stop-opacity="0"/>
        </radialGradient>
      </defs>
      <rect width="${WIDTH}" height="${HEIGHT}" fill="url(#cloudySky)"/>
      <rect width="${WIDTH}" height="${HEIGHT}" fill="url(#cloudPuff1)"/>
      <rect width="${WIDTH}" height="${HEIGHT}" fill="url(#cloudPuff2)"/>
    </svg>
    `;

    await sharp(BASE_IMG)
        .modulate({ brightness: 0.90, saturation: 0.70 })
        .composite([{ input: Buffer.from(svgOverlay), blend: 'multiply' }])
        .jpeg({ quality: 90, mozjpeg: true })
        .toFile(path.join(OUT_DIR, 'weather-cloudy.jpg'));
    console.log('✓ Created weather-cloudy.jpg');
}

async function generateRain() {
    console.log('Generating weather-rain.jpg...');
    // Generate realistic angled rainfall streaks
    let rainPaths = '';
    const numDrops = 420;
    for (let i = 0; i < numDrops; i++) {
        const x = Math.floor(Math.random() * (WIDTH + 200)) - 100;
        const y = Math.floor(Math.random() * HEIGHT);
        const length = Math.floor(Math.random() * 32) + 18;
        const opacity = (Math.random() * 0.45 + 0.15).toFixed(2);
        const strokeWidth = (Math.random() * 1.0 + 0.7).toFixed(1);
        const x2 = x - 8;
        const y2 = y + length;
        rainPaths += `<line x1="${x}" y1="${y}" x2="${x2}" y2="${y2}" stroke="#bae6fd" stroke-width="${strokeWidth}" opacity="${opacity}" stroke-linecap="round"/>`;
    }

    const svgOverlay = `
    <svg width="${WIDTH}" height="${HEIGHT}" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <!-- Storm Tint -->
        <linearGradient id="stormTint" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stop-color="#0f172a" stop-opacity="0.65"/>
          <stop offset="40%" stop-color="#1e3a5f" stop-opacity="0.45"/>
          <stop offset="85%" stop-color="#0c4a6e" stop-opacity="0.3"/>
          <stop offset="100%" stop-color="#0284c7" stop-opacity="0.2"/>
        </linearGradient>
        <!-- Wet Mist at ground -->
        <linearGradient id="wetGroundMist" x1="0%" y1="100%" x2="0%" y2="70%">
          <stop offset="0%" stop-color="#38bdf8" stop-opacity="0.25"/>
          <stop offset="100%" stop-color="#0369a1" stop-opacity="0"/>
        </linearGradient>
      </defs>
      <rect width="${WIDTH}" height="${HEIGHT}" fill="url(#stormTint)"/>
      <rect width="${WIDTH}" height="${HEIGHT}" fill="url(#wetGroundMist)"/>
      <g filter="blur(0.5px)">
        ${rainPaths}
      </g>
    </svg>
    `;

    await sharp(BASE_IMG)
        .modulate({ brightness: 0.80, saturation: 0.85 })
        .tint({ r: 24, g: 58, b: 90 })
        .composite([{ input: Buffer.from(svgOverlay), blend: 'screen' }])
        .jpeg({ quality: 90, mozjpeg: true })
        .toFile(path.join(OUT_DIR, 'weather-rain.jpg'));
    console.log('✓ Created weather-rain.jpg');
}

async function generateThunder() {
    console.log('Generating weather-thunder.jpg...');
    // Branching lightning bolt geometry centered behind cranes
    const svgOverlay = `
    <svg width="${WIDTH}" height="${HEIGHT}" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <!-- Ominous Purple/Violet Tempest Sky -->
        <linearGradient id="tempestSky" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stop-color="#2e1065" stop-opacity="0.8"/>
          <stop offset="40%" stop-color="#3b0764" stop-opacity="0.6"/>
          <stop offset="80%" stop-color="#1e1b4b" stop-opacity="0.4"/>
          <stop offset="100%" stop-color="#0f172a" stop-opacity="0.5"/>
        </linearGradient>
        <!-- Lightning Flash Radial Glow -->
        <radialGradient id="lightningGlow" cx="62%" cy="20%" r="40%">
          <stop offset="0%" stop-color="#ffffff" stop-opacity="0.95"/>
          <stop offset="20%" stop-color="#c084fc" stop-opacity="0.75"/>
          <stop offset="50%" stop-color="#7e22ce" stop-opacity="0.35"/>
          <stop offset="100%" stop-color="#3b0764" stop-opacity="0"/>
        </radialGradient>
        <!-- Filter for glowing lightning bolt -->
        <filter id="glow" x="-30%" y="-30%" width="160%" height="160%">
          <feGaussianBlur stdDeviation="5" result="blur1"/>
          <feGaussianBlur stdDeviation="15" result="blur2"/>
          <feMerge>
            <feMergeNode in="blur2"/>
            <feMergeNode in="blur1"/>
            <feMergeNode in="SourceGraphic"/>
          </feMerge>
        </filter>
      </defs>
      <rect width="${WIDTH}" height="${HEIGHT}" fill="url(#tempestSky)"/>
      <rect width="${WIDTH}" height="${HEIGHT}" fill="url(#lightningGlow)"/>

      <!-- Lightning bolts -->
      <g filter="url(#glow)">
        <!-- Main jagged bolt -->
        <path d="M 850 0 L 840 70 L 860 110 L 830 180 L 850 220 L 820 310 L 835 360 L 815 440 L 825 500 L 805 580" 
              fill="none" stroke="#f3e8ff" stroke-width="4.5" stroke-linecap="round" stroke-linejoin="round"/>
        <path d="M 850 0 L 840 70 L 860 110 L 830 180 L 850 220 L 820 310 L 835 360 L 815 440 L 825 500 L 805 580" 
              fill="none" stroke="#ffffff" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"/>
        
        <!-- Fork 1: branching right -->
        <path d="M 860 110 L 910 140 L 930 190 L 970 230" 
              fill="none" stroke="#d8b4fe" stroke-width="2" stroke-linecap="round"/>
        <!-- Fork 2: branching left -->
        <path d="M 830 180 L 780 230 L 760 280 L 730 320" 
              fill="none" stroke="#d8b4fe" stroke-width="2" stroke-linecap="round"/>
        <!-- Fork 3: lower branch -->
        <path d="M 820 310 L 860 350 L 880 410" 
              fill="none" stroke="#c084fc" stroke-width="1.8" stroke-linecap="round"/>
      </g>
    </svg>
    `;

    await sharp(BASE_IMG)
        .modulate({ brightness: 0.75, saturation: 1.15 })
        .tint({ r: 50, g: 30, b: 85 })
        .composite([{ input: Buffer.from(svgOverlay), blend: 'screen' }])
        .jpeg({ quality: 90, mozjpeg: true })
        .toFile(path.join(OUT_DIR, 'weather-thunder.jpg'));
    console.log('✓ Created weather-thunder.jpg');
}

async function generateNight() {
    console.log('Generating weather-night.jpg...');
    // Stars in clear night sky
    let stars = '';
    for (let i = 0; i < 90; i++) {
        const x = Math.floor(Math.random() * WIDTH);
        const y = Math.floor(Math.random() * 320); // upper sky
        const r = (Math.random() * 1.4 + 0.5).toFixed(1);
        const op = (Math.random() * 0.7 + 0.3).toFixed(2);
        stars += `<circle cx="${x}" cy="${y}" r="${r}" fill="#ffffff" opacity="${op}"/>`;
    }

    const svgOverlay = `
    <svg width="${WIDTH}" height="${HEIGHT}" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <!-- Deep Night Gradient -->
        <linearGradient id="nightSky" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stop-color="#020617" stop-opacity="0.85"/>
          <stop offset="50%" stop-color="#090d16" stop-opacity="0.7"/>
          <stop offset="100%" stop-color="#0f172a" stop-opacity="0.6"/>
        </linearGradient>
        <!-- Glowing Moon Halo -->
        <radialGradient id="moonGlow" cx="80%" cy="18%" r="28%">
          <stop offset="0%" stop-color="#ffffff" stop-opacity="0.9"/>
          <stop offset="15%" stop-color="#fef08a" stop-opacity="0.65"/>
          <stop offset="40%" stop-color="#60a5fa" stop-opacity="0.25"/>
          <stop offset="100%" stop-color="#020617" stop-opacity="0"/>
        </radialGradient>
        <!-- Halogen Construction Work Light (Crane Floodlights) -->
        <radialGradient id="halogenLight1" cx="64%" cy="42%" r="24%">
          <stop offset="0%" stop-color="#ffedd5" stop-opacity="0.95"/>
          <stop offset="25%" stop-color="#fb923c" stop-opacity="0.6"/>
          <stop offset="65%" stop-color="#ea580c" stop-opacity="0.15"/>
          <stop offset="100%" stop-color="#000000" stop-opacity="0"/>
        </radialGradient>
        <radialGradient id="halogenLight2" cx="38%" cy="48%" r="20%">
          <stop offset="0%" stop-color="#fff7ed" stop-opacity="0.85"/>
          <stop offset="30%" stop-color="#f59e0b" stop-opacity="0.5"/>
          <stop offset="100%" stop-color="#000000" stop-opacity="0"/>
        </radialGradient>
      </defs>
      <!-- Deep nocturnal wash -->
      <rect width="${WIDTH}" height="${HEIGHT}" fill="url(#nightSky)"/>
      <!-- Stars -->
      <g>${stars}</g>
      <!-- Moon orb and glow -->
      <rect width="${WIDTH}" height="${HEIGHT}" fill="url(#moonGlow)"/>
      <circle cx="1100" cy="138" r="26" fill="#fef9c3" opacity="0.92"/>
      <circle cx="1112" cy="134" r="22" fill="#0b1329" opacity="0.88"/> <!-- crescent shadow -->

      <!-- Halogen spotlights on crane towers & building -->
      <rect width="${WIDTH}" height="${HEIGHT}" fill="url(#halogenLight1)"/>
      <rect width="${WIDTH}" height="${HEIGHT}" fill="url(#halogenLight2)"/>

      <!-- Red aircraft warning beacons atop cranes -->
      <circle cx="875" cy="180" r="3.5" fill="#ef4444" opacity="0.9"/>
      <circle cx="875" cy="180" r="8" fill="#ef4444" opacity="0.4"/>
      <circle cx="510" cy="225" r="3.5" fill="#ef4444" opacity="0.9"/>
      <circle cx="510" cy="225" r="8" fill="#ef4444" opacity="0.4"/>
    </svg>
    `;

    await sharp(BASE_IMG)
        .modulate({ brightness: 0.65, saturation: 0.75 })
        .tint({ r: 15, g: 25, b: 45 })
        .composite([{ input: Buffer.from(svgOverlay), blend: 'screen' }])
        .jpeg({ quality: 90, mozjpeg: true })
        .toFile(path.join(OUT_DIR, 'weather-night.jpg'));
    console.log('✓ Created weather-night.jpg');
}

async function generateFog() {
    console.log('Generating weather-fog.jpg...');
    const svgOverlay = `
    <svg width="${WIDTH}" height="${HEIGHT}" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <!-- Mist Bands -->
        <linearGradient id="fogBand1" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stop-color="#94a3b8" stop-opacity="0.3"/>
          <stop offset="30%" stop-color="#cbd5e1" stop-opacity="0.55"/>
          <stop offset="65%" stop-color="#e2e8f0" stop-opacity="0.75"/>
          <stop offset="90%" stop-color="#94a3b8" stop-opacity="0.4"/>
          <stop offset="100%" stop-color="#475569" stop-opacity="0.2"/>
        </linearGradient>
        <radialGradient id="mistGlow" cx="50%" cy="40%" r="60%">
          <stop offset="0%" stop-color="#f8fafc" stop-opacity="0.5"/>
          <stop offset="50%" stop-color="#e2e8f0" stop-opacity="0.3"/>
          <stop offset="100%" stop-color="#64748b" stop-opacity="0"/>
        </radialGradient>
      </defs>
      <rect width="${WIDTH}" height="${HEIGHT}" fill="url(#fogBand1)"/>
      <rect width="${WIDTH}" height="${HEIGHT}" fill="url(#mistGlow)"/>
    </svg>
    `;

    await sharp(BASE_IMG)
        .modulate({ brightness: 0.95, saturation: 0.45 })
        .composite([{ input: Buffer.from(svgOverlay), blend: 'screen' }])
        .jpeg({ quality: 90, mozjpeg: true })
        .toFile(path.join(OUT_DIR, 'weather-fog.jpg'));
    console.log('✓ Created weather-fog.jpg');
}

async function main() {
    try {
        await generateSunny();
        await generateCloudy();
        await generateRain();
        await generateThunder();
        await generateNight();
        await generateFog();
        console.log('🎉 All 6 weather backgrounds successfully generated!');
    } catch (e) {
        console.error('Error:', e);
    }
}
main();
