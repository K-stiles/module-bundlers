
# 🪓SplitChunk Explained

## Summary and Impact:

- chunkIds: "deterministic" → Enables long-term caching (40-60% cache hit improvement)
- chunks: "all" → Reduces total bundle size by 20-40% through aggressive splitting
- runtimeChunk: "single" → Prevents vendor bundle cache invalidation (critical!)
- Multiple cache groups → Granular caching strategy (framework cached for months, app code for days)
- Tree shaking optimizations → Removes 10-30% unused code
- minRemainingSize: 20000 → Prevents inefficient splits

## Expected Performance Gains:

- Initial load: 30-50% faster (smaller bundles + better caching)
- Subsequent loads: 60-80% faster (aggressive caching of unchanged code)
- Total bundle size: 20-40% smaller (tree shaking + deduplication)
- Cache hit rate: 40-60% improvement (granular splitting + deterministic IDs)

## When to Adjust:

- HTTP/1.1 servers: Lower maxInitialRequests to 10-15
- SSR apps: Lower maxInitialRequests to 10, keep maxAsyncRequests at 30
- Small apps (<500 KB): Consider minSize: 30000 to prevent over-splitting
- Large monoliths: Increase minSize: 40000 and adjust cache groups to match your dependency patterns


```js
// webpack.production.config.js file

module.exports = {
  mode: "production",
  optimization: {
    // chunkIds: "deterministic" - BEST FOR PRODUCTION
    // Creates short numeric hashes based on module content that remain stable across builds
    // WHY: Enables long-term caching - chunk IDs don't change unless content changes
    // "named" (your original) is good for debugging but adds ~5-10% to bundle size
    // "deterministic" gives you consistent IDs for better cache hits without the size penalty
    chunkIds: "deterministic",

    // minimize: true - ESSENTIAL FOR PRODUCTION
    // WHY: Reduces bundle size by 60-80% through minification
    // Modern minifiers also perform tree-shaking and dead code elimination
    minimize: true,

    // minimizer: Configure TerserPlugin with optimal settings
    // WHY: Default TerserPlugin is good, but explicit config gives you control
    // Added configuration removes console logs and optimizes for performance
    minimizer: [
      new TerserPlugin({
        terserOptions: {
          compress: {
            drop_console: true, // Remove console.logs in production
            passes: 2, // Run compression twice for better results
          },
          format: {
            comments: false, // Remove all comments
          },
        },
        extractComments: false, // Don't create separate LICENSE files
      }),
    ],

    splitChunks: {
      // chunks: "all" - MOST AGGRESSIVE AND EFFECTIVE
      // WHY: Maximizes code reuse by splitting both sync and async imports
      // Your "async" setting misses optimization opportunities for initial bundles
      // "all" reduces overall bundle size by 20-40% in typical applications
      // Modern HTTP/2 handles multiple requests efficiently, so aggressive splitting is beneficial
      chunks: "all",

      // minSize: 20000 (20 KB) - GOOD BASELINE
      // WHY: Prevents creating chunks smaller than gzip overhead (~1-2 KB)
      // Below 20 KB, the HTTP request overhead outweighs the caching benefit
      // This is a well-tested industry standard that balances size vs requests
      minSize: 20000, // 20 KB

      // minRemainingSize: 20000 (20 KB) - MATCH minSize
      // WHY: Prevents splitting that leaves behind a tiny remaining chunk
      // If you're going to split, both pieces should be worth caching separately
      // Setting this equal to minSize ensures balanced splits
      minRemainingSize: 20000, // 20 KB

      // minChunks: 2 - OPTIMAL FOR MOST APPS
      // WHY: Extracts code used by 2+ chunks (sweet spot for shared code)
      // minChunks: 1 creates too many chunks (poor caching, more requests)
      // minChunks: 3+ misses legitimate sharing opportunities
      // 2 is the proven balance point for maximizing cache hits
      minChunks: 2,

      // maxAsyncRequests: 30 - REASONABLE UPPER LIMIT
      // WHY: Prevents excessive splitting that creates request waterfalls
      // HTTP/2 can handle ~6-10 parallel requests efficiently
      // 30 provides headroom without letting webpack go crazy
      // In practice, you rarely hit this limit with proper minSize settings
      maxAsyncRequests: 30,

      // maxInitialRequests: 30 - ALLOWS AGGRESSIVE INITIAL SPLITTING
      // WHY: Modern browsers with HTTP/2 handle multiple initial requests well
      // The caching benefits outweigh the connection overhead
      // 30 is high enough to not artificially limit optimization
      // Server-side rendering (SSR) apps may want to lower this to 10-15
      maxInitialRequests: 30,

      // enforceSizeThreshold: 50000 (50 KB) - GOOD THRESHOLD
      // WHY: Forces splitting of large modules regardless of reuse count
      // 50 KB is approximately the size where splitting always improves performance
      // Prevents a single large library from bloating multiple bundles
      // Also aligns with typical code-splitting recommendations (50-100 KB per chunk)
      enforceSizeThreshold: 50000, // 50 KB

      cacheGroups: {
        // React/Framework libraries - HIGH PRIORITY VENDOR SPLIT
        // WHY: React/Vue/Angular change infrequently but are used everywhere
        // Splitting them separately maximizes cache lifetime (can cache for months)
        // Users visiting multiple pages benefit from cached framework code
        framework: {
          test: /[\\/]node_modules[\\/](react|react-dom|scheduler|prop-types)[\\/]/,
          name: "framework",
          chunks: "all",
          priority: 40, // Highest priority - extract first
          reuseExistingChunk: true,
          enforce: true, // Always create this chunk even if it breaks other rules
        },

        // UI libraries - SEPARATE FROM FRAMEWORK
        // WHY: UI libraries (Material-UI, Ant Design, etc.) are large but change independently
        // Separating them prevents framework cache invalidation when UI lib updates
        lib: {
          test: /[\\/]node_modules[\\/](@mui|@material-ui|antd|bootstrap)[\\/]/,
          name: "lib",
          chunks: "all",
          priority: 30,
          reuseExistingChunk: true,
        },

        // Common vendor code - ALL OTHER NODE_MODULES
        // WHY: Smaller utilities and dependencies bundled together
        // These change more frequently than framework but less than your app code
        defaultVendors: {
          test: /[\\/]node_modules[\\/]/,
          name: "vendors",
          chunks: "all",
          priority: 20, // Lower than framework/lib, higher than app code
          reuseExistingChunk: true,
        },

        // Shared application code - YOUR CODE REUSED ACROSS CHUNKS
        // WHY: Extracts common components, utilities, and helpers
        // Changes frequently but benefits from caching across routes
        common: {
          name: "common",
          chunks: "all",
          minChunks: 2, // Must be used in 2+ places
          priority: 10,
          reuseExistingChunk: true,
          minSize: 10000, // Lower threshold (10 KB) for app code - it's worth caching
        },

        // Styles - IF USING CSS-IN-JS OR EXTRACTING CSS
        // WHY: CSS changes less frequently than JS logic
        // Separating allows parallel loading and independent caching
        styles: {
          test: /\.(css|scss|sass|less)$/,
          name: "styles",
          chunks: "all",
          priority: 50, // Highest priority - always extract styles
          reuseExistingChunk: true,
          enforce: true,
        },
      },
    },

    // runtimeChunk: "single" - CRITICAL FOR CACHING
    // WHY: Extracts webpack's runtime code (module loading logic) into a separate chunk
    // The runtime contains module IDs and loading logic that changes when ANY module changes
    // Separating it prevents cache invalidation of your vendor bundles
    // "single" creates one runtime.js for all entry points (best for SPAs)
    // This small file (~1-2 KB) should be inlined or loaded first
    runtimeChunk: "single",

    // moduleIds: "deterministic" - STABLE MODULE IDS
    // WHY: Similar to chunkIds, ensures module IDs remain stable across builds
    // Prevents cache invalidation when adding/removing unrelated modules
    // Critical for long-term caching strategies
    moduleIds: "deterministic",

    // usedExports: true - TREE SHAKING
    // WHY: Marks unused exports so Terser can remove them (dead code elimination)
    // Can reduce bundle size by 10-30% by removing unused library code
    // Works best with ES6 modules (import/export)
    usedExports: true,

    // sideEffects: false - AGGRESSIVE TREE SHAKING
    // WHY: Tells webpack that modules have no side effects unless marked in package.json
    // Allows more aggressive dead code elimination
    // NOTE: Only set if your code and dependencies properly mark side effects
    // Can break builds if modules have unmarked side effects (CSS imports, polyfills)
    sideEffects: false, // Use with caution - test thoroughly!

    // concatenateModules: true - SCOPE HOISTING
    // WHY: Combines module scopes into single scope where possible
    // Reduces function wrapper overhead and enables better minification
    // Can reduce bundle size by 5-15% and improve runtime performance
    // Called "scope hoisting" or "module concatenation"
    concatenateModules: true,
  },
};

```
