/** @type {import('next').NextConfig} */
const nextConfig = {
  // SVGs import as React components (SVGR) so theme-aware colours follow data-theme.
  // `import url from './x.svg?url'` still gives a file URL. Webpack only — do not run `next dev --turbo`.
  webpack(config) {
    const fileLoaderRule = config.module.rules.find((rule) => rule.test?.test?.('.svg'));
    config.module.rules.push(
      { ...fileLoaderRule, test: /\.svg$/i, resourceQuery: /url/ },
      {
        test: /\.svg$/i,
        issuer: fileLoaderRule.issuer,
        resourceQuery: { not: [...fileLoaderRule.resourceQuery.not, /url/] },
        use: [{ loader: '@svgr/webpack', options: { svgoConfig: { plugins: [{ name: 'preset-default', params: { overrides: { removeViewBox: false, cleanupIds: false } } }] } } }],
      },
    );
    fileLoaderRule.exclude = /\.svg$/i;
    return config;
  },
};

module.exports = nextConfig;
