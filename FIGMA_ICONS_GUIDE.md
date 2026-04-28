# Adding Icons from Figma

This guide explains how to use the Figma icon extraction skill to add new icons to your library.

## Quick Start

### Prerequisites

1. Get a Figma Personal Access Token:
   - Go to https://www.figma.com/settings/tokens
   - Create a new token with `file_content_read` scope
   - Copy the token

2. Have your Figma design link ready (in the format: `https://figma.com/design/FILE_KEY/...?node-id=X:X`)

### Adding an Icon

#### Method 1: Using the CLI Script (Recommended)

```bash
# Set your Figma token (do this once)
export FIGMA_TOKEN="your-figma-personal-access-token"

# Add a new icon
node add-icon-from-figma.mjs --link "https://figma.com/design/..." --name "my-icon"
```

Or pass the token directly:

```bash
node add-icon-from-figma.mjs --link "https://figma.com/design/..." --name "my-icon" --token "your-token"
```

#### Method 2: Using the TypeScript API

In your Angular component or service:

```typescript
import { generateIconFromFigma, generateIconCode } from './app/icons/figma-icon-extractor';

async function addIcon() {
  const icon = await generateIconFromFigma({
    figmaLink: 'https://figma.com/design/...',
    iconName: 'my-icon',
    figmaToken: process.env.FIGMA_TOKEN,
  });

  if (icon) {
    console.log('Generated code:');
    console.log(generateIconCode(icon));
  }
}
```

### What Happens Automatically

When you run the CLI script, it will:

1. **Extract SVG from Figma** using the Figma API
2. **Convert SVG to LucideIconData format**
3. **Add the icon code** to `src/app/icons/custom-icons.ts`
4. **Register the icon** in `src/app/icons/dc-icon.component.ts`

### Using Your New Icon

Once added, use it in your templates:

```html
<dc-icon name="my-icon" [size]="24" [strokeWidth]="2" color="currentColor" />
```

Or with Angular directive:

```html
<dc-icon name="my-icon" size="24" />
```

## Icon Naming Convention

- Use kebab-case for icon names: `my-new-icon`, `star-filled`, `arrow-down`
- Icons are automatically converted to PascalCase for exports: `DcMyNewIcon`, `DcStarFilled`
- This follows the existing convention: `DcDiamond`, `DcBolt`, etc.

## Understanding the Icon Format

Icons in this library use the `LucideIconData` format from lucide-angular:

```typescript
export const DcMyIcon: LucideIconData = [
  [
    'path',
    {
      d: 'M12 2L22 12L12 22L2 12Z',
      fill: 'none',
      stroke: 'currentColor',
      'stroke-linecap': 'round',
      'stroke-linejoin': 'round',
      'shape-rendering': 'geometricPrecision',
    },
  ],
  [
    'circle',
    {
      cx: '12',
      cy: '12',
      r: '8',
      fill: 'none',
      stroke: 'currentColor',
    },
  ],
];
```

The format is: `[['element-type', { attributes }], ...]`

## Figma Link Format

The script expects Figma links in this format:

```
https://figma.com/design/FILE_KEY_HERE/file-name?node-id=123:456
```

### Getting Your Figma Link

1. In Figma, right-click on the icon component/frame
2. Click "Copy/Paste → Copy link"
3. The link will include the `node-id` parameter

If your link is missing the `node-id`:

1. Click on the icon/component in Figma
2. Look at the URL - it should include `?node-id=X:X`
3. If not, manually add it by copying from another shared link

## Troubleshooting

### "Invalid Figma link format"

- Ensure your link includes the `?node-id=X:X` parameter
- Use the "Copy link" feature from Figma to get the correct format

### "Figma API error: 401"

- Your token is invalid or expired
- Generate a new token at https://www.figma.com/settings/tokens

### "Figma API error: 404"

- The file or node doesn't exist
- Check that your `node-id` is correct
- Ensure the file is shared or accessible with your token

### SVG Parsing Errors

- The extracted SVG might have unsupported elements
- Try simplifying the design in Figma
- Remove text elements, complex groups, or embedded images

## Advanced Usage

### Custom Icon Styling

Icons inherit `currentColor` for stroke and are customizable:

```html
<dc-icon name="my-icon" [size]="24" [strokeWidth]="2" color="red" />
```

### Batch Adding Icons

Create a script file with multiple icon definitions:

```bash
node add-icon-from-figma.mjs --link "figma-link-1" --name "icon-1" && \
node add-icon-from-figma.mjs --link "figma-link-2" --name "icon-2"
```

### Modifying Icon Data

You can manually edit the generated icon code in `custom-icons.ts` to:

- Adjust stroke width values
- Change fill/stroke colors
- Add custom attributes
- Optimize SVG paths

## File Locations

- **Icon definitions**: `src/app/icons/custom-icons.ts`
- **Icon component**: `src/app/icons/dc-icon.component.ts`
- **Extractor utility**: `src/app/icons/figma-icon-extractor.ts`
- **CLI script**: `add-icon-from-figma.mjs` (root directory)

## API Reference

### `figma-icon-extractor.ts`

#### `parseFigmaLink(link: string)`

Parses a Figma URL and returns `{ fileKey, nodeId }` or `null`.

#### `extractSvgFromFigma(link: string, token: string)`

Fetches SVG from Figma API. Returns SVG string or `null`.

#### `svgToLucideIconData(svgString: string, name: string)`

Converts SVG string to `LucideIconData` format.

#### `generateIconFromFigma(config: FigmaLinkConfig)`

Main function that does everything: extract → convert → return icon.

#### `generateIconCode(icon: ExtractedIcon)`

Generates TypeScript code as a string for the icon.

## Security Notes

- Keep your Figma token private - never commit it to version control
- Use environment variables or `.env` files
- The `add-icon-from-figma.mjs` script only reads from Figma, it doesn't modify your files remotely
- Always review generated code before committing

## Next Steps

1. Get your Figma token
2. Find a Figma design link for an icon
3. Run the CLI script
4. Use the new icon in your templates
5. Customize as needed

Happy icon adding! 🎨
