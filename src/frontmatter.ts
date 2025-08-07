import * as fs from 'fs';
import matter from 'gray-matter';

/**
 * Read and parse MDX frontmatter
 */
export function parseFrontmatter(filePath: string) {
  const content = fs.readFileSync(filePath, 'utf8');
  return matter(content);
}

/**
 * Update frontmatter to include ogImage if missing
 */
export async function updateFrontmatter(filePath: string, ogImagePath: string): Promise<void> {
  const { data, content } = parseFrontmatter(filePath);
  
  // Only update if ogImage is missing
  if (!data.ogImage) {
    data.ogImage = ogImagePath;
    
    // Reconstruct the file with updated frontmatter
    const updatedContent = matter.stringify(content, data);
    fs.writeFileSync(filePath, updatedContent);
  }
}

/**
 * Extract metadata for OG image generation
 */
export interface OGMetadata {
  title: string;
  description?: string;
  author?: string;
  date?: string;
}

export function extractOGMetadata(filePath: string): OGMetadata {
  const { data } = parseFrontmatter(filePath);
  
  return {
    title: data.title || 'Untitled',
    description: data.description || data.excerpt,
    author: data.author,
    date: data.date ? new Date(data.date).toLocaleDateString() : undefined
  };
}