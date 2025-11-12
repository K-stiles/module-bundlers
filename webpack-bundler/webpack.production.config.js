const path = require("path");
const webpack = require("webpack");
const TerserPlugin = require("terser-webpack-plugin");
const HtmlWebpackPlugin = require("html-webpack-plugin");
const MiniCssExtractPlugin = require("mini-css-extract-plugin");

module.exports = {
  mode: "production",
  entry: "./src/index.js",
  output: {
    path: path.resolve(__dirname, "dist"),
    filename: "[name].bundle.js",
  },
  resolve: {
    extensions: [".js", "jsx"],
    alias: {
      "@": path.resolve(__dirname, "src/*"), // maps @something to path/to/something
    },
  },
  plugins: [
    new HtmlWebpackPlugin({
      template: "./public/index.html",
      path: "index.html",
    }),
    new MiniCssExtractPlugin(),
    new webpack.DefinePlugin({
      SERVER_API_URL: JSON.stringify("https://prod.api.example.com"),
      SECRETE_API_KEY: JSON.stringify("your-secrete-api-key"),
    }),
  ],
  module: {
    rules: [
      {
        test: /\.(?:js|jsx)$/,
        exclude: /node_modules/,
        use: {
          loader: "babel-loader",
          options: {
            presets: [
              "@babel/preset-env", // modern JS → older JS
              "@babel/preset-react", // JSX → JS
              // "@babel/preset-typescript", // remove TS types
            ],
          },
        },
      },
      // {
      //   test: /\.css$/i,
      //   use: ["style-loader", "css-loader"],
      // },
      {
        test: /\.css$/i,
        use: [MiniCssExtractPlugin.loader, "css-loader"],
      },
      {
        test: /\.(png|svg|jpg|jpeg|gif)$/i,
        type: "asset/resource",
      },
    ],
  },
  optimization: {
    // chunkIds: Determines the algorithm webpack uses to assign unique identifiers to chunks
    // "named" uses human-readable names based on chunk content (e.g., "vendors", "common")
    // Alternative values: "natural" (numeric IDs), "deterministic" (short hashes), "size" (based on initial size)
    // "named" is useful for debugging but increases bundle size slightly; "deterministic" is better for production caching
    chunkIds: "named",

    // minimize: Controls whether webpack should minify/uglify the bundled JavaScript code
    // true = removes whitespace, shortens variable names, removes comments, optimizes code
    // This significantly reduces file size but makes code unreadable (desired for production)
    minimize: true,

    // minimizer: Specifies which plugin(s) to use for code minification
    // TerserPlugin is the default - it compresses ES6+ code, removes dead code, and performs advanced optimizations
    // You can add additional minimizers here (e.g., CssMinimizerPlugin for CSS)
    // Overriding this array replaces webpack's default minimizers, so include all needed plugins
    minimizer: [new TerserPlugin()],

    splitChunks: {
      // chunks: Defines which chunks are eligible for optimization/splitting
      // "async" = only split dynamically imported modules (import() statements)
      // "initial" = only split statically imported entry point modules
      // "all" = split both async and initial chunks (most aggressive, best for optimization)
      // "async" reduces initial bundle size by only splitting code-split routes/components
      chunks: "async",

      // minSize: Minimum size (in bytes) a module must be to warrant creating a separate chunk
      // 20000 bytes = 20 KB minimum - prevents creating tiny chunks that add HTTP overhead
      // Modules smaller than this will be bundled with other code rather than split out
      // Balances between reducing bundle size and limiting the number of network requests
      minSize: 20000, // 20 KB

      // minRemainingSize: Ensures the remaining chunk after splitting is at least this size (bytes)
      // 0 = disabled, no minimum size requirement for what's left after splitting
      // Prevents situations where splitting leaves behind a tiny remaining chunk
      // Important for HTTP/1.1 (multiple requests are costly); less critical with HTTP/2
      minRemainingSize: 0,

      // minChunks: Minimum number of chunks that must share a module before it's split out
      // 2 = a module must be imported/used by at least 2 different chunks to be extracted
      // Prevents splitting rarely-used code; only extracts commonly shared dependencies
      // Reduces duplication across bundles - shared code is loaded once and cached
      minChunks: 2,

      // maxAsyncRequests: Maximum number of parallel requests when loading a chunk on-demand
      // 30 = when dynamically importing, webpack won't create more than 30 separate chunk files
      // Limits network waterfall depth - too many requests can slow down page loads
      // Prevents excessive chunk splitting that would hurt performance despite smaller files
      maxAsyncRequests: 30,

      // maxInitialRequests: Maximum number of parallel requests for entry point chunks
      // 30 = limits initial page load to maximum 30 separate JavaScript files
      // Prevents the initial HTML from requesting too many resources simultaneously
      // Balances granular caching benefits against connection/request overhead
      maxInitialRequests: 30,

      // enforceSizeThreshold: Size threshold (bytes) that overrides other constraints
      // 50000 bytes = 50 KB - if a chunk exceeds this, it WILL be split regardless of minChunks
      // Forces splitting of large modules even if they're only used once
      // Ensures critical code isn't bloated by large dependencies, improving cache efficiency
      enforceSizeThreshold: 50000, // 50 KB

      cacheGroups: {
        // cacheGroups: Defines rules for grouping modules into specific chunks
        // Allows custom splitting logic beyond the global splitChunks settings
        // Each cache group can override global settings and target specific module types

        defaultVendors: {
          // test: Regex/function to determine which modules belong to this cache group
          // Matches any module path containing "node_modules" (third-party dependencies)
          test: /[\\/]node_modules[\\/]/,

          // priority: When a module matches multiple cache groups, higher priority wins
          // -10 is higher than default (-20), so vendor code is prioritized over common code
          // Ensures third-party libraries are separated from your application code
          priority: -10,

          // name: The name of the output chunk file (e.g., "vendors.js")
          // All matched modules are bundled into this single named chunk
          // Creates predictable filenames for better caching strategies
          name: "vendors",

          // chunks: Overrides global "async" setting for this cache group
          // "all" means both sync and async imported node_modules are extracted to vendors chunk
          // Maximizes vendor code sharing across your entire application
          chunks: "all",

          // reuseExistingChunk: If a module is already in a chunk, reuse that chunk instead of duplicating
          // true = prevents the same vendor code from appearing in multiple bundles
          // Optimizes bundle size by ensuring each module only appears once in the build
          reuseExistingChunk: true,
        },

        default: {
          // Default cache group: catches application code shared across multiple chunks
          // Modules not matching other cache groups fall through to this rule
          // Targets your own code that's reused in different parts of the app

          // name: Creates a "common.js" chunk for shared application code
          name: "common",

          // chunks: "all" ensures both entry points and dynamic imports are considered
          chunks: "all",

          // minChunks: Only extracts code used by 2+ chunks (same as global setting)
          // Ensures only genuinely shared code is split out, not one-off modules
          minChunks: 1,

          // priority: Lowest priority (-20) means vendor and other cache groups take precedence
          // This is the "catch-all" group - only used when no higher-priority group matches
          priority: -20,

          // reuseExistingChunk: Prevents duplication if this code is already in another chunk
          reuseExistingChunk: true,
        },
      },
    },
  },
};
