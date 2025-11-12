const path = require("path");
const HtmlWebpackPlugin = require('html-webpack-plugin');

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
   plugins: [new HtmlWebpackPlugin({
    template: "./public/index.html",
    path: "index.html",
   })],
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
      {
        test: /\.css$/i,
        use: ["style-loader", "css-loader"],
      },
      {
        test: /\.(png|svg|jpg|jpeg|gif)$/i,
        type: "asset/resource",
      }
    ],
  },
};
