import { defineCollection } from 'astro:content';
import { glob } from 'astro/loaders';

export const collections = {
  'nivel-1': defineCollection({ loader: glob({ pattern: '*.md', base: './src/content/nivel-1' }) }),
  'nivel-2': defineCollection({ loader: glob({ pattern: '*.md', base: './src/content/nivel-2' }) }),
  'nivel-3': defineCollection({ loader: glob({ pattern: '*.md', base: './src/content/nivel-3' }) }),
  'nivel-4': defineCollection({ loader: glob({ pattern: '*.md', base: './src/content/nivel-4' }) }),
  'nivel-5': defineCollection({ loader: glob({ pattern: '*.md', base: './src/content/nivel-5' }) }),
  'nivel-6': defineCollection({ loader: glob({ pattern: '*.md', base: './src/content/nivel-6' }) }),
};
