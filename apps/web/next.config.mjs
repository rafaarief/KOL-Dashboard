/** @type {import('next').NextConfig} */
const nextConfig = {
  transpilePackages: [
    "@kol-finder/ai",
    "@kol-finder/database",
    "@kol-finder/ranking",
    "@kol-finder/schemas",
    "@kol-finder/shared",
  ],
  webpack(config) {
    // Workspace packages are consumed straight from TS source (see their package.json
    // "main"/"types") and use NodeNext-style ".js" specifiers for sibling imports
    // (e.g. "./niches.js" resolving to "./niches.ts"). Webpack, unlike tsc/tsx, only
    // falls back through resolve.extensions when the specifier has NO extension, so a
    // literal ".js" import otherwise fails to resolve to the ".ts" source file.
    config.resolve.extensionAlias = {
      ".js": [".ts", ".tsx", ".js"],
    };
    return config;
  },
};

export default nextConfig;
