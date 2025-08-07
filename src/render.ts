import satori from 'satori';
import { Resvg } from '@resvg/resvg-js';
import sharp from 'sharp';
import * as fs from 'fs';
import * as path from 'path';
import { extractOGMetadata, type OGMetadata } from './frontmatter.js';

// Bundled Inter font for deterministic rendering
const getInterFonts = () => {
  try {
    // Use process.cwd() to get project root directory
    const fontsDir = path.join(process.cwd(), 'src/assets/fonts');
    const regular = fs.readFileSync(path.join(fontsDir, 'Inter-Regular.woff'));
    const bold = fs.readFileSync(path.join(fontsDir, 'Inter-Bold.woff'));
    return { regular, bold };
  } catch (error) {
    console.warn('Could not load Inter fonts:', error.message);
    // Fallback: use system font (less deterministic but functional)
    return null;
  }
};

/**
 * Create OG image JSX template
 */
function createOGTemplate(metadata: OGMetadata) {
  const { title, description, author, date } = metadata;
  
  return {
    type: 'div',
    props: {
      style: {
        height: '100%',
        width: '100%',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'flex-start',
        justifyContent: 'center',
        backgroundColor: '#1a1a1a',
        backgroundImage: 'linear-gradient(135deg, #1a1a1a 0%, #2d2d2d 100%)',
        padding: '80px',
        fontFamily: 'Inter, -apple-system, BlinkMacSystemFont, Segoe UI, Roboto, sans-serif',
      },
      children: [
        {
          type: 'div',
          props: {
            style: {
              fontSize: '72px',
              fontWeight: 'bold',
              color: '#ffffff',
              lineHeight: 1.1,
              marginBottom: '32px',
              maxWidth: '1040px',
            },
            children: title,
          },
        },
        description && {
          type: 'div',
          props: {
            style: {
              fontSize: '36px',
              color: '#a3a3a3',
              lineHeight: 1.4,
              marginBottom: '40px',
              maxWidth: '1040px',
            },
            children: description,
          },
        },
        (author || date) && {
          type: 'div',
          props: {
            style: {
              display: 'flex',
              alignItems: 'center',
              gap: '24px',
              fontSize: '28px',
              color: '#666666',
            },
            children: [
              author && {
                type: 'div',
                props: {
                  children: `by ${author}`,
                },
              },
              date && {
                type: 'div',
                props: {
                  children: date,
                },
              },
            ].filter(Boolean),
          },
        },
      ].filter(Boolean),
    },
  };
}

/**
 * Generate OG image from MDX frontmatter
 */
export async function generateOGImage(mdxPath: string, outputPath: string): Promise<void> {
  // Extract metadata from frontmatter
  const metadata = extractOGMetadata(mdxPath);
  
  // Create the OG image template
  const template = createOGTemplate(metadata);
  
  // Configure fonts
  const fonts = [];
  const interFonts = getInterFonts();
  if (interFonts) {
    fonts.push({
      name: 'Inter',
      data: interFonts.regular,
      weight: 400 as const,
    }, {
      name: 'Inter',
      data: interFonts.bold,
      weight: 700 as const,
    });
  }
  
  // Generate SVG with Satori
  const svg = await satori(template, {
    width: 1200,
    height: 630,
    fonts: fonts.length > 0 ? fonts : [],
  });
  
  // Convert SVG to PNG using Resvg and Sharp
  const resvg = new Resvg(svg, {
    fitTo: {
      mode: 'width',
      value: 1200,
    },
  });
  
  const pngBuffer = resvg.render().asPng();
  
  // Optimize with Sharp
  const optimizedBuffer = await sharp(pngBuffer)
    .png({ compressionLevel: 9 })
    .toBuffer();
  
  // Write to file
  fs.writeFileSync(outputPath, optimizedBuffer);
}