/**
 * Figma Icon Extractor
 * Extracts SVG data from Figma links and converts to LucideIconData format
 */

import { LucideIconData } from 'lucide-angular';

export interface FigmaLinkConfig {
  figmaLink: string;
  iconName: string;
  figmaToken?: string;
}

export interface ExtractedIcon {
  name: string;
  data: LucideIconData;
  svgString: string;
}

/**
 * Extracts Figma file ID and node ID from a Figma link
 * Supports formats:
 * - https://figma.com/design/FILE_KEY/file-name?node-id=NODE_ID
 * - https://figma.com/file/FILE_KEY/file-name?node-id=NODE_ID
 */
export function parseFigmaLink(link: string): { fileKey: string; nodeId: string } | null {
  try {
    const url = new URL(link);
    const pathParts = url.pathname.split('/').filter(Boolean);

    // Extract file key (usually the third part after /file/ or /design/)
    const fileKey = pathParts[pathParts.length - 1];

    // Extract node ID from query parameter
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

/**
 * Extracts SVG from a Figma file using the Figma API
 * Requires a Figma personal access token
 */
export async function extractSvgFromFigma(
  figmaLink: string,
  figmaToken: string,
): Promise<string | null> {
  try {
    const parsed = parseFigmaLink(figmaLink);
    if (!parsed) {
      throw new Error(
        'Failed to parse Figma link. Check format: https://figma.com/design/FILE_KEY/...?node-id=X:X',
      );
    }

    const { fileKey, nodeId } = parsed;
    console.log('Extracting from Figma:', { fileKey, nodeId });

    // Validate token
    if (!figmaToken || figmaToken.trim() === '') {
      throw new Error('Figma token is empty or invalid');
    }

    // Export the node as SVG
    const exportUrl = `https://api.figma.com/v1/images/${fileKey}?ids=${nodeId}&format=svg`;
    console.log('Fetching from:', exportUrl);

    const exportResponse = await fetch(exportUrl, {
      headers: {
        'X-Figma-Token': figmaToken,
      },
    });

    if (!exportResponse.ok) {
      const errorBody = await exportResponse.text();
      console.error('Figma API error response:', errorBody);

      if (exportResponse.status === 401) {
        throw new Error(
          'Unauthorized: Invalid Figma token. Get one from https://www.figma.com/settings/tokens',
        );
      } else if (exportResponse.status === 403) {
        throw new Error('Forbidden: Token does not have permission to access this file');
      } else if (exportResponse.status === 404) {
        throw new Error(
          'Not found: File or node does not exist. Check your Figma link and node ID',
        );
      } else {
        throw new Error(`Figma API error: ${exportResponse.status} ${exportResponse.statusText}`);
      }
    }

    const exportData = (await exportResponse.json()) as any;
    console.log('Export response:', exportData);

    const svgUrl = exportData.images?.[nodeId];

    if (!svgUrl) {
      throw new Error(
        `No SVG URL returned from Figma API. Available node IDs: ${Object.keys(exportData.images || {}).join(', ') || 'none'}. Check your node ID format.`,
      );
    }

    // Download the SVG file
    const svgResponse = await fetch(svgUrl);
    if (!svgResponse.ok) {
      throw new Error(`Failed to download SVG: ${svgResponse.statusText}`);
    }

    return await svgResponse.text();
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    console.error('Failed to extract SVG from Figma:', errorMessage);
    throw error;
  }
}

/**
 * Converts SVG string to LucideIconData format
 * Parses SVG elements and creates array format expected by lucide-angular
 */
export function svgToLucideIconData(svgString: string, iconName: string): LucideIconData {
  try {
    const parser = new DOMParser();
    const svgDoc = parser.parseFromString(svgString, 'image/svg+xml');

    if (svgDoc.getElementsByTagName('parsererror').length > 0) {
      throw new Error('Invalid SVG string');
    }

    const svgElement = svgDoc.documentElement;
    const iconData: any[] = [];

    // Process each child element of the SVG
    Array.from(svgElement.children).forEach((element) => {
      const attrs: Record<string, string> = {
        fill: 'none',
        stroke: 'currentColor',
        'stroke-linecap': 'round',
        'stroke-linejoin': 'round',
        'shape-rendering': 'geometricPrecision',
      };

      // Copy existing attributes from the element
      Array.from(element.attributes).forEach((attr) => {
        attrs[attr.name] = attr.value;
      });

      iconData.push([element.tagName.toLowerCase(), attrs]);
    });

    return iconData as LucideIconData;
  } catch (error) {
    console.error('Failed to convert SVG to LucideIconData:', error);
    return [];
  }
}

/**
 * Main function to add a new icon from Figma
 * Returns the code that should be added to custom-icons.ts
 */
export async function generateIconFromFigma(
  config: FigmaLinkConfig,
): Promise<ExtractedIcon | null> {
  try {
    if (!config.figmaToken) {
      throw new Error(
        'Figma token is required. Set FIGMA_TOKEN environment variable or provide figmaToken parameter.',
      );
    }

    const svgString = await extractSvgFromFigma(config.figmaLink, config.figmaToken);
    if (!svgString) return null;

    const iconData = svgToLucideIconData(svgString, config.iconName);

    return {
      name: config.iconName,
      data: iconData,
      svgString,
    };
  } catch (error) {
    console.error('Failed to generate icon from Figma:', error);
    return null;
  }
}

/**
 * Generates TypeScript code for the extracted icon
 * This is the format needed for custom-icons.ts
 */
export function generateIconCode(icon: ExtractedIcon): string {
  const pascalCaseName = icon.name
    .split(/[-_]/)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join('');

  const dataString = JSON.stringify(icon.data, null, 2);

  return `export const Dc${pascalCaseName}: LucideIconData = ${dataString};`;
}
