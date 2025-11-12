const path = require("path");
const webpack = require("webpack");
const TerserPlugin = require("terser-webpack-plugin");
const HtmlWebpackPlugin = require('html-webpack-plugin');
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
      '@': path.resolve(__dirname, 'src/*'), // maps @something to path/to/something
    },
  },
   plugins: [
    new HtmlWebpackPlugin({
    template: "./public/index.html",
    path: "index.html",
   }),
   new MiniCssExtractPlugin(),
   new webpack.DefinePlugin({
    SERVER_API_URL: JSON.stringify('https://prod.api.example.com'),
    SECRETE_API_KEY: JSON.stringify('your-secrete-api-key'),
   })
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
      }
    ],
  },
  optimization: {
    minimize: true,
    minimizer: [new TerserPlugin()],
  },
};
