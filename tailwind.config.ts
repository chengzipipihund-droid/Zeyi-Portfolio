import type { Config } from 'tailwindcss';
import { figmaTokens } from './src/styles/tailwind-tokens';

// Every design value comes from Figma (src/styles/tailwind-tokens.ts, generated). Do not add hard-coded values here.
const config: Config = {
  content: ['./src/**/*.{js,ts,jsx,tsx,mdx}'],
  theme: {
    extend: {
      colors: figmaTokens.colors,
      borderRadius: figmaTokens.borderRadius,
      boxShadow: figmaTokens.boxShadow,
      dropShadow: figmaTokens.dropShadow,
      // `as const` makes the generated stacks readonly; Tailwind's type wants mutable arrays.
      fontFamily: Object.fromEntries(Object.entries(figmaTokens.fontFamily).map(([name, stack]) => [name, [...stack]])),
    },
  },
  plugins: [],
};

export default config;
