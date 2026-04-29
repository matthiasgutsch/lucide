import fs from 'fs';
import path from 'path';
import https from 'https';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const imagesDir = path.join(__dirname, 'public', 'images');

// Ensure images directory exists
if (!fs.existsSync(imagesDir)) {
  fs.mkdirSync(imagesDir, { recursive: true });
  console.log(`Created directory: ${imagesDir}`);
}

// Read the icon map
const iconMapPath = path.join(__dirname, 'src', 'app', 'icon-map', 'icon-map.ts');
const iconMapContent = fs.readFileSync(iconMapPath, 'utf-8');

// Extract URLs and icon names using regex
const urlRegex = /uiKit:\s*'([^']+)'[\s\S]*?figmaImg:\s*'([^']+)'/g;
const icons = [];
let match;

while ((match = urlRegex.exec(iconMapContent)) !== null) {
  icons.push({
    name: match[1],
    url: match[2],
  });
}

console.log(`Found ${icons.length} icons to download`);

// Download icons with retry logic
async function downloadIcon(name, url, retries = 3) {
  return new Promise((resolve, reject) => {
    const filename = `${name}.svg`;
    const filepath = path.join(imagesDir, filename);

    // Skip if already exists
    if (fs.existsSync(filepath)) {
      console.log(`✓ ${filename} (already exists)`);
      resolve(filename);
      return;
    }

    const attemptDownload = (attempt) => {
      https
        .get(url, (response) => {
          if (response.statusCode === 200) {
            const file = fs.createWriteStream(filepath);
            response.pipe(file);
            file.on('finish', () => {
              file.close();
              console.log(`✓ Downloaded ${filename}`);
              resolve(filename);
            });
            file.on('error', (err) => {
              fs.unlink(filepath, () => {});
              if (attempt < retries) {
                console.log(`  Retrying ${filename} (attempt ${attempt + 1}/${retries})`);
                setTimeout(() => attemptDownload(attempt + 1), 1000);
              } else {
                console.error(`✗ Failed to download ${filename}: ${err.message}`);
                reject(err);
              }
            });
          } else if (response.statusCode === 302 || response.statusCode === 301) {
            // Follow redirects
            downloadIcon(name, response.headers.location, retries).then(resolve).catch(reject);
          } else {
            console.error(`✗ Failed to download ${filename}: HTTP ${response.statusCode}`);
            reject(new Error(`HTTP ${response.statusCode}`));
          }
        })
        .on('error', (err) => {
          if (attempt < retries) {
            console.log(`  Retrying ${filename} (attempt ${attempt + 1}/${retries})`);
            setTimeout(() => attemptDownload(attempt + 1), 1000);
          } else {
            console.error(`✗ Failed to download ${filename}: ${err.message}`);
            reject(err);
          }
        });
    };

    attemptDownload(1);
  });
}

// Download all icons sequentially
async function downloadAll() {
  let successful = 0;
  let failed = 0;

  for (const icon of icons) {
    try {
      await downloadIcon(icon.name, icon.url);
      successful++;
    } catch (error) {
      failed++;
    }
  }

  console.log(`\nDownload complete: ${successful} successful, ${failed} failed`);
  process.exit(failed > 0 ? 1 : 0);
}

downloadAll().catch((err) => {
  console.error('Download process failed:', err);
  process.exit(1);
});
