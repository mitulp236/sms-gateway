// Simple icon generator using Node.js
const fs = require('fs');
const path = require('path');
const { exec } = require('child_process');
const util = require('util');
const execPromise = util.promisify(exec);

const svgPath = path.join(__dirname, 'assets', 'icon.svg');

// Icon sizes for Android
const androidSizes = {
  'mipmap-mdpi': 48,
  'mipmap-hdpi': 72,
  'mipmap-xhdpi': 96,
  'mipmap-xxhdpi': 144,
  'mipmap-xxxhdpi': 192
};

// Icon sizes for iOS
const iosSizes = [
  { size: 20, scale: 1, idiom: 'iphone' },
  { size: 20, scale: 2, idiom: 'iphone' },
  { size: 20, scale: 3, idiom: 'iphone' },
  { size: 29, scale: 1, idiom: 'iphone' },
  { size: 29, scale: 2, idiom: 'iphone' },
  { size: 29, scale: 3, idiom: 'iphone' },
  { size: 40, scale: 2, idiom: 'iphone' },
  { size: 40, scale: 3, idiom: 'iphone' },
  { size: 60, scale: 2, idiom: 'iphone' },
  { size: 60, scale: 3, idiom: 'iphone' },
  { size: 1024, scale: 1, idiom: 'ios-marketing' }
];

async function generateAndroidIcons() {
  console.log('Generating Android icons...');

  for (const [folder, size] of Object.entries(androidSizes)) {
    const outputDir = path.join(__dirname, 'android', 'app', 'src', 'main', 'res', folder);
    const outputPath = path.join(outputDir, 'ic_launcher.png');
    const roundOutputPath = path.join(outputDir, 'ic_launcher_round.png');

    try {
      // Use qlmanage to convert SVG to PNG on macOS
      const tempPng = path.join(__dirname, 'assets', `temp_${size}.png`);

      // Convert SVG to PNG using qlmanage and sips
      await execPromise(`qlmanage -t -s ${size * 2} -o ${path.dirname(tempPng)} "${svgPath}"`);
      const qlOutput = path.join(path.dirname(tempPng), 'icon.svg.png');

      // Resize to exact size
      await execPromise(`sips -z ${size} ${size} "${qlOutput}" --out "${tempPng}"`);

      // Copy to both regular and round icon locations
      fs.mkdirSync(outputDir, { recursive: true });
      fs.copyFileSync(tempPng, outputPath);
      fs.copyFileSync(tempPng, roundOutputPath);

      // Clean up temp file
      fs.unlinkSync(tempPng);
      if (fs.existsSync(qlOutput)) fs.unlinkSync(qlOutput);

      console.log(`✓ Generated ${folder}: ${size}x${size}px`);
    } catch (error) {
      console.error(`✗ Failed to generate ${folder}:`, error.message);
    }
  }
}

async function generateIOSIcons() {
  console.log('\nGenerating iOS icons...');

  const iosIconDir = path.join(__dirname, 'ios', 'SMSForwarder', 'Images.xcassets', 'AppIcon.appiconset');
  fs.mkdirSync(iosIconDir, { recursive: true });

  const contentsJson = {
    images: [],
    info: {
      version: 1,
      author: 'xcode'
    }
  };

  for (const config of iosSizes) {
    const actualSize = config.size * config.scale;
    const filename = `icon-${config.size}@${config.scale}x.png`;
    const outputPath = path.join(iosIconDir, filename);

    try {
      const tempPng = path.join(__dirname, 'assets', `temp_ios_${actualSize}.png`);

      // Convert SVG to PNG
      await execPromise(`qlmanage -t -s ${actualSize * 2} -o ${path.dirname(tempPng)} "${svgPath}"`);
      const qlOutput = path.join(path.dirname(tempPng), 'icon.svg.png');

      // Resize to exact size
      await execPromise(`sips -z ${actualSize} ${actualSize} "${qlOutput}" --out "${tempPng}"`);

      // Move to iOS directory
      fs.copyFileSync(tempPng, outputPath);

      // Clean up
      fs.unlinkSync(tempPng);
      if (fs.existsSync(qlOutput)) fs.unlinkSync(qlOutput);

      // Add to Contents.json
      contentsJson.images.push({
        size: `${config.size}x${config.size}`,
        idiom: config.idiom,
        filename: filename,
        scale: `${config.scale}x`
      });

      console.log(`✓ Generated ${filename}: ${actualSize}x${actualSize}px`);
    } catch (error) {
      console.error(`✗ Failed to generate ${filename}:`, error.message);
    }
  }

  // Write Contents.json
  const contentsPath = path.join(iosIconDir, 'Contents.json');
  fs.writeFileSync(contentsPath, JSON.stringify(contentsJson, null, 2));
  console.log('✓ Generated Contents.json');
}

async function main() {
  console.log('🎨 SMS Gateway Icon Generator\n');
  console.log('==============================\n');

  if (!fs.existsSync(svgPath)) {
    console.error('❌ Error: icon.svg not found in assets folder');
    process.exit(1);
  }

  try {
    await generateAndroidIcons();
    await generateIOSIcons();
    console.log('\n✅ All icons generated successfully!');
  } catch (error) {
    console.error('\n❌ Error generating icons:', error);
    process.exit(1);
  }
}

main();
