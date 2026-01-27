/**
 * Image Compression Script
 * 
 * This script compresses hero images to WebP format
 * Run: node scripts/compress-images.js
 */

const sharp = require('sharp');
const fs = require('fs');
const path = require('path');

const heroDir = path.join(__dirname, '../public/hero-images');
const outputDir = path.join(__dirname, '../public/hero-images-optimized');

// Create output directory if it doesn't exist
if (!fs.existsSync(outputDir)) {
  fs.mkdirSync(outputDir, { recursive: true });
}

async function compressImage(filename) {
  const inputPath = path.join(heroDir, filename);
  const outputFilename = filename.replace(/\.(jpg|jpeg|png)$/i, '.webp');
  const outputPath = path.join(outputDir, outputFilename);

  try {
    const isMobile = !filename.includes('landscape');
    
    if (isMobile) {
      // Mobile: 800x1200, quality 80
      await sharp(inputPath)
        .resize(800, 1200, { fit: 'cover', position: 'center' })
        .webp({ quality: 80 })
        .toFile(outputPath);
    } else {
      // Desktop: 1920x1080, quality 85
      await sharp(inputPath)
        .resize(1920, 1080, { fit: 'cover', position: 'center' })
        .webp({ quality: 85 })
        .toFile(outputPath);
    }

    const inputStats = fs.statSync(inputPath);
    const outputStats = fs.statSync(outputPath);
    const savings = ((1 - outputStats.size / inputStats.size) * 100).toFixed(1);

    console.log(`✅ ${filename}`);
    console.log(`   ${(inputStats.size / 1024 / 1024).toFixed(2)}MB → ${(outputStats.size / 1024 / 1024).toFixed(2)}MB (${savings}% smaller)\n`);
  } catch (error) {
    console.error(`❌ Error compressing ${filename}:`, error.message);
  }
}

async function compressAll() {
  console.log('🖼️  Compressing hero images...\n');

  const files = fs.readdirSync(heroDir).filter(f => /\.(jpg|jpeg|png)$/i.test(f));

  for (const file of files) {
    await compressImage(file);
  }

  console.log('✨ Done! Optimized images saved to:', outputDir);
  console.log('\n📝 Next steps:');
  console.log('1. Review the optimized images');
  console.log('2. Replace the old images in /public/hero-images/');
  console.log('3. Update image paths in HeroSection.jsx to use .webp extension');
}

compressAll();
