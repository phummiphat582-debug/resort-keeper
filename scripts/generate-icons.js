import fs from 'fs';
import path from 'path';
import sharp from 'sharp';

const publicDir = path.resolve('public');
if (!fs.existsSync(publicDir)) {
  fs.mkdirSync(publicDir, { recursive: true });
}

// 1. Master SVG Design (512x512)
const svgIcon = `
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" width="512" height="512">
  <defs>
    <linearGradient id="bgGrad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#10b981"/>
      <stop offset="50%" stop-color="#059669"/>
      <stop offset="100%" stop-color="#047857"/>
    </linearGradient>
    <linearGradient id="roofGrad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#ffffff"/>
      <stop offset="100%" stop-color="#f0fdf4"/>
    </linearGradient>
    <linearGradient id="windGrad" x1="0%" y1="0%" x2="100%" y2="0%">
      <stop offset="0%" stop-color="#38bdf8"/>
      <stop offset="100%" stop-color="#e0f2fe"/>
    </linearGradient>
    <filter id="shadow" x="-10%" y="-10%" width="130%" height="130%">
      <feDropShadow dx="0" dy="12" stdDeviation="16" flood-color="#022c22" flood-opacity="0.35"/>
    </filter>
  </defs>

  <!-- Background Squircle / Rounded Container -->
  <rect width="512" height="512" rx="128" fill="url(#bgGrad)"/>

  <!-- Subtle Inner Glow Ring -->
  <rect x="12" y="12" width="488" height="488" rx="116" fill="none" stroke="#ffffff" stroke-width="4" stroke-opacity="0.25"/>

  <!-- Main Illustration Group with Drop Shadow -->
  <g filter="url(#shadow)">
    <!-- Resort House Roof -->
    <path d="M256 120 L390 226 C396 231 392 242 384 242 L356 242 L356 372 C356 381 349 388 340 388 L172 388 C163 388 156 381 156 372 L156 242 L128 242 C120 242 116 231 122 226 Z" 
          fill="url(#roofGrad)" />

    <!-- Resort Doorway / Balcony -->
    <rect x="226" y="278" width="60" height="110" rx="8" fill="#047857" opacity="0.9"/>
    
    <!-- Window Left -->
    <rect x="180" y="278" width="30" height="36" rx="6" fill="#059669" opacity="0.3"/>
    <!-- Window Right -->
    <rect x="302" y="278" width="30" height="36" rx="6" fill="#059669" opacity="0.3"/>

    <!-- Cooling Breeze / Air Flow Curves (AC symbol) -->
    <path d="M140 185 Q 230 150 340 175" fill="none" stroke="url(#windGrad)" stroke-width="12" stroke-linecap="round"/>
    <path d="M170 155 Q 250 125 350 145" fill="none" stroke="#ffffff" stroke-width="8" stroke-linecap="round" opacity="0.85"/>

    <!-- Snowflake / AC Cool Star symbol floating above -->
    <g transform="translate(366, 128) scale(0.9)">
      <circle cx="0" cy="0" r="28" fill="#38bdf8" opacity="0.25"/>
      <!-- Snowflake arms -->
      <line x1="0" y1="-22" x2="0" y2="22" stroke="#ffffff" stroke-width="5" stroke-linecap="round"/>
      <line x1="-22" y1="0" x2="22" y2="0" stroke="#ffffff" stroke-width="5" stroke-linecap="round"/>
      <line x1="-15" y1="-15" x2="15" y2="15" stroke="#ffffff" stroke-width="5" stroke-linecap="round"/>
      <line x1="-15" y1="15" x2="15" y2="-15" stroke="#ffffff" stroke-width="5" stroke-linecap="round"/>
      <circle cx="0" cy="0" r="5" fill="#38bdf8"/>
    </g>

    <!-- Calendar 90 Badge (bottom right accent) -->
    <g transform="translate(325, 335)">
      <rect x="0" y="0" width="66" height="58" rx="14" fill="#0284c7" stroke="#ffffff" stroke-width="3.5"/>
      <rect x="0" y="0" width="66" height="18" rx="14" fill="#0369a1"/>
      <circle cx="18" cy="9" r="3" fill="#ffffff"/>
      <circle cx="48" cy="9" r="3" fill="#ffffff"/>
      <text x="33" y="44" font-family="-apple-system, sans-serif" font-size="24" font-weight="900" fill="#ffffff" text-anchor="middle">90</text>
    </g>
  </g>
</svg>
`;

// 2. Maskable SVG Design (Safe Area for Android Adaptive Icons)
const svgMaskable = `
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" width="512" height="512">
  <defs>
    <linearGradient id="bgGrad2" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#10b981"/>
      <stop offset="50%" stop-color="#059669"/>
      <stop offset="100%" stop-color="#047857"/>
    </linearGradient>
    <linearGradient id="roofGrad2" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#ffffff"/>
      <stop offset="100%" stop-color="#f0fdf4"/>
    </linearGradient>
    <linearGradient id="windGrad2" x1="0%" y1="0%" x2="100%" y2="0%">
      <stop offset="0%" stop-color="#38bdf8"/>
      <stop offset="100%" stop-color="#e0f2fe"/>
    </linearGradient>
  </defs>

  <!-- Full Background for maskable safe area -->
  <rect width="512" height="512" fill="url(#bgGrad2)"/>

  <!-- Scaled content inside 80% safe zone (center 410x410) -->
  <g transform="translate(64, 64) scale(0.75)">
    <!-- Resort House Roof -->
    <path d="M256 120 L390 226 C396 231 392 242 384 242 L356 242 L356 372 C356 381 349 388 340 388 L172 388 C163 388 156 381 156 372 L156 242 L128 242 C120 242 116 231 122 226 Z" 
          fill="url(#roofGrad2)" />

    <!-- Resort Doorway / Balcony -->
    <rect x="226" y="278" width="60" height="110" rx="8" fill="#047857" opacity="0.9"/>
    
    <!-- Window Left -->
    <rect x="180" y="278" width="30" height="36" rx="6" fill="#059669" opacity="0.3"/>
    <!-- Window Right -->
    <rect x="302" y="278" width="30" height="36" rx="6" fill="#059669" opacity="0.3"/>

    <!-- Cooling Breeze -->
    <path d="M140 185 Q 230 150 340 175" fill="none" stroke="url(#windGrad2)" stroke-width="12" stroke-linecap="round"/>
    <path d="M170 155 Q 250 125 350 145" fill="none" stroke="#ffffff" stroke-width="8" stroke-linecap="round" opacity="0.85"/>

    <!-- Snowflake -->
    <g transform="translate(366, 128) scale(0.9)">
      <circle cx="0" cy="0" r="28" fill="#38bdf8" opacity="0.25"/>
      <line x1="0" y1="-22" x2="0" y2="22" stroke="#ffffff" stroke-width="5" stroke-linecap="round"/>
      <line x1="-22" y1="0" x2="22" y2="0" stroke="#ffffff" stroke-width="5" stroke-linecap="round"/>
      <line x1="-15" y1="-15" x2="15" y2="15" stroke="#ffffff" stroke-width="5" stroke-linecap="round"/>
      <line x1="-15" y1="15" x2="15" y2="-15" stroke="#ffffff" stroke-width="5" stroke-linecap="round"/>
      <circle cx="0" cy="0" r="5" fill="#38bdf8"/>
    </g>

    <!-- Calendar 90 Badge -->
    <g transform="translate(325, 335)">
      <rect x="0" y="0" width="66" height="58" rx="14" fill="#0284c7" stroke="#ffffff" stroke-width="3.5"/>
      <rect x="0" y="0" width="66" height="18" rx="14" fill="#0369a1"/>
      <circle cx="18" cy="9" r="3" fill="#ffffff"/>
      <circle cx="48" cy="9" r="3" fill="#ffffff"/>
      <text x="33" y="44" font-family="-apple-system, sans-serif" font-size="24" font-weight="900" fill="#ffffff" text-anchor="middle">90</text>
    </g>
  </g>
</svg>
`;

async function generate() {
  console.log('Generating PWA icons...');

  // Save SVG
  fs.writeFileSync(path.join(publicDir, 'logo.svg'), svgIcon.trim());
  fs.writeFileSync(path.join(publicDir, 'favicon.svg'), svgIcon.trim());

  const svgBuffer = Buffer.from(svgIcon);
  const maskableBuffer = Buffer.from(svgMaskable);

  // 1. icon-512.png
  await sharp(svgBuffer)
    .resize(512, 512)
    .png()
    .toFile(path.join(publicDir, 'icon-512.png'));
  console.log('✓ Created icon-512.png');

  // 2. icon-192.png
  await sharp(svgBuffer)
    .resize(192, 192)
    .png()
    .toFile(path.join(publicDir, 'icon-192.png'));
  console.log('✓ Created icon-192.png');

  // 3. icon-maskable-512.png
  await sharp(maskableBuffer)
    .resize(512, 512)
    .png()
    .toFile(path.join(publicDir, 'icon-maskable-512.png'));
  console.log('✓ Created icon-maskable-512.png');

  // 4. apple-touch-icon.png (180x180)
  await sharp(svgBuffer)
    .resize(180, 180)
    .png()
    .toFile(path.join(publicDir, 'apple-touch-icon.png'));
  console.log('✓ Created apple-touch-icon.png');

  // 5. favicon-32.png
  await sharp(svgBuffer)
    .resize(32, 32)
    .png()
    .toFile(path.join(publicDir, 'favicon-32.png'));
  console.log('✓ Created favicon-32.png');

  console.log('All icons generated successfully!');
}

generate().catch(err => {
  console.error('Error generating icons:', err);
  process.exit(1);
});
