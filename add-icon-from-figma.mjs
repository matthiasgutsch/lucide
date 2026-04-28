#!/usr/bin/env node

/**
 * CLI Tool: Add Icon from Figma
 *
 * Usage:
 *   node add-icon-from-figma.mjs --link <figma-link> --name <icon-name> [--token <figma-token>]
 *
 * Example:
 *   node add-icon-from-figma.mjs --link "https://figma.com/design/..." --name "star" --token "your-figma-token"
 *
 * Environment Variables:
 *   FIGMA_TOKEN - Your Figma personal access token (can also use --token flag)
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Parse command line arguments
function parseArgs() {
  const args = process.argv.slice(2);
  const config = {};

  for (let i = 0; i < args.length; i += 2) {
    const key = args[i].replace('--', '');
    const value = args[i + 1];
    config[key] = value;
  }

  return config;
}

async function parseFigmaLink(link) {
  try {
    const url = new URL(link);
    const pathParts = url.pathname.split('/').filter(Boolean);

    const fileKey = pathParts[pathParts.length - 1];
    const nodeId = url.searchParams.get('node-id');

    if (!fileKey || !nodeId) {
      console.error(
        'Invalid Figma link format. Expected: https://figma.com/design/FILE_KEY/name?node-id=NODE_ID',
      );
      return null;
    }

    return { fileKey, nodeId: nodeId.replace(/-/g, ':') };
  } catch (error) {
    console.error('Failed to parse Figma link:', error);
    return null;
  }
}

async function extractSvgFromFigma(figmaLink, figmaToken) {
  try {
    const parsed = await parseFigmaLink(figmaLink);
    if (!parsed) return null;

    const { fileKey, nodeId } = parsed;

    console.log(`Fetching from Figma: ${fileKey} / ${nodeId}`);

    // Export the node as SVG
    const exportResponse = await fetch(
      `https://api.figma.com/v1/images/${fileKey}?ids=${nodeId}&format=svg`,
      {
        headers: {
          'X-Figma-Token': figmaToken,
        },
      },
    );

    if (!exportResponse.ok) {
      throw new Error(`Failed to export SVG: ${exportResponse.statusText}`);
    }

    const exportData = await exportResponse.json();
    const svgUrl = exportData.images?.[nodeId];

    if (!svgUrl) {
      throw new Error('No SVG URL returned from Figma API');
    }

    // Download the SVG file
    const svgResponse = await fetch(svgUrl);
    if (!svgResponse.ok) {
      throw new Error(`Failed to download SVG: ${svgResponse.statusText}`);
    }

    return await svgResponse.text();
  } catch (error) {
    console.error('Failed to extract SVG from Figma:', error);
    return null;
  }
}

function svgToLucideIconData(svgString) {
  try {
    const parser = new (require('jsdom').JSDOM)();
    const dom = new parser(svgString);
    const svgElement = dom.window.document.documentElement;
    const iconData = [];

    Array.from(svgElement.children).forEach((element) => {
      const attrs = {
        fill: 'none',
        stroke: 'currentColor',
        'stroke-linecap': 'round',
        'stroke-linejoin': 'round',
        'shape-rendering': 'geometricPrecision',
      };

      Array.from(element.attributes || []).forEach((attr) => {
        attrs[attr.name] = attr.value;
      });

      iconData.push([element.tagName.toLowerCase(), attrs]);
    });

    return iconData;
  } catch (error) {
    console.error('Failed to convert SVG to LucideIconData:', error);
    return [];
  }
}

function generateIconCode(name, iconData) {
  const pascalCaseName = name
    .split(/[-_]/)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join('');

  const dataString = JSON.stringify(iconData, null, 2);

  return {
    code: `export const Dc${pascalCaseName}: LucideIconData = ${dataString};\n`,
    exportName: pascalCaseName,
  };
}

function addIconToCustomIcons(iconCode, exportName) {
  const customIconsPath = path.join(__dirname, 'custom-icons.ts');

  if (!fs.existsSync(customIconsPath)) {
    console.error(`custom-icons.ts not found at ${customIconsPath}`);
    return false;
  }

  let content = fs.readFileSync(customIconsPath, 'utf8');

  // Add the new icon code before the last export or at the end
  content += '\n' + iconCode;

  fs.writeFileSync(customIconsPath, content);

  console.log(`✓ Added icon to custom-icons.ts`);

  // Update dc-icon.component.ts to register the icon
  const componentPath = path.join(__dirname, 'dc-icon.component.ts');
  let componentContent = fs.readFileSync(componentPath, 'utf8');

  const iconName = exportName.replace(/^Dc/, '').toLowerCase();

  if (componentContent.includes(`'${iconName}':`)) {
    console.log(`✓ Icon '${iconName}' already registered in dc-icon.component.ts`);
    return true;
  }

  // Add to the iconRegistry object
  const registryPattern = /const iconRegistry: Record<string, LucideIconData> = \{([^}]*)\};/s;
  componentContent = componentContent.replace(registryPattern, (match, content) => {
    const newEntry = `  '${iconName}': customIcons.Dc${exportName},`;
    return `const iconRegistry: Record<string, LucideIconData> = {${content}${newEntry}\n};`;
  });

  fs.writeFileSync(componentPath, componentContent);
  console.log(`✓ Registered icon in dc-icon.component.ts`);

  return true;
}

async function main() {
  const args = parseArgs();
  const figmaToken = args.token || process.env.FIGMA_TOKEN;

  if (!args.link || !args.name) {
    console.error(
      'Usage: node add-icon-from-figma.mjs --link <figma-link> --name <icon-name> [--token <figma-token>]',
    );
    process.exit(1);
  }

  if (!figmaToken) {
    console.error(
      'Figma token is required. Set FIGMA_TOKEN environment variable or use --token flag',
    );
    process.exit(1);
  }

  console.log(`\nAdding icon: ${args.name}`);
  console.log(`Figma link: ${args.link}\n`);

  const svgString = await extractSvgFromFigma(args.link, figmaToken);
  if (!svgString) {
    console.error('Failed to extract SVG from Figma');
    process.exit(1);
  }

  const iconData = svgToLucideIconData(svgString);
  const { code, exportName } = generateIconCode(args.name, iconData);

  console.log('Generated code:');
  console.log(code);

  const success = addIconToCustomIcons(code, exportName);

  if (success) {
    console.log(`\n✓ Successfully added icon '${args.name}'`);
    console.log(`Usage in template: <dc-icon name="${args.name.toLowerCase()}" />`);
  } else {
    console.error('\n✗ Failed to add icon');
    process.exit(1);
  }
}

main();
