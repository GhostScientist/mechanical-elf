#!/usr/bin/env node

import { Command } from 'commander';
import { generateOGImage } from './render.js';
import { updateFrontmatter } from './frontmatter.js';
import * as fs from 'fs';
import * as path from 'path';

const program = new Command();

program
  .name('og-gen')
  .description('Generate OpenGraph images from MDX frontmatter')
  .version('1.0.0');

program
  .command('generate')
  .option('--slug <slug>', 'Slug to generate OG image for')
  .action(async (options) => {
    if (!options.slug) {
      console.error('Error: --slug is required');
      process.exit(1);
    }

    const slug = options.slug;
    const mdxPath = `content/${slug}.mdx`;
    const outputPath = `public/og/${slug}.png`;

    // Check if MDX file exists
    if (!fs.existsSync(mdxPath)) {
      console.error(`Error: MDX file not found at ${mdxPath}`);
      process.exit(1);
    }

    // Ensure output directory exists
    const outputDir = path.dirname(outputPath);
    if (!fs.existsSync(outputDir)) {
      fs.mkdirSync(outputDir, { recursive: true });
    }

    try {
      // Generate OG image
      await generateOGImage(mdxPath, outputPath);
      console.log(`✓ Generated OG image: ${outputPath}`);

      // Update frontmatter if needed
      await updateFrontmatter(mdxPath, `/og/${slug}.png`);
      console.log(`✓ Updated frontmatter in: ${mdxPath}`);
    } catch (error) {
      console.error('Error generating OG image:', error);
      process.exit(1);
    }
  });

program.parse();