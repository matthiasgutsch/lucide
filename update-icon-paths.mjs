import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const iconMapPath = path.join(__dirname, 'src', 'app', 'icon-map', 'icon-map.ts');

let content = fs.readFileSync(iconMapPath, 'utf-8');

const regex = /(\{\s*id:\s*\d+,\s*uiKit:\s*'([^']+)',[\s\S]*?)figmaImg:\s*'[^']+'([\s\S]*?\},?)/g;

content = content.replace(regex, (match, prefix, iconName, suffix) => {
  return `${prefix}figmaImg: '/images/${iconName}.svg'${suffix}`;
});

fs.writeFileSync(iconMapPath, content, 'utf-8');
console.log('Updated all figmaImg paths to local public/images folder');
