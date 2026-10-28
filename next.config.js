/** @type {import('next').NextConfig} */
const nextConfig = {
  // Verification builds (scripts/snap.mjs) use their own folder so they never disturb a running `next dev`.
  distDir: process.env.NEXT_DIST_DIR || '.next',
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
    // Never watch the verification build folder (scripts/snap.mjs), so it cannot trigger reloads in `next dev`.
    // (The "Watchpack Error (initial scan) … lstat 'C:\pagefile.sys'" lines on Windows are harmless and cannot be
    // silenced here: Watchpack lstat()s every entry of C:\ before applying `ignored`.)
    const ignored = config.watchOptions?.ignored;
    if (ignored instanceof RegExp) {
      config.watchOptions = { ...config.watchOptions, ignored: new RegExp(`${ignored.source}|[\\\\/]\\.next-verify([\\\\/]|$)`) };
    }
    return config;
  },
};

module.exports = nextConfig;
