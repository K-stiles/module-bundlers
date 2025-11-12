const Webpack = require('webpack');
const WebpackDevServer = require('webpack-dev-server');

// Load the webpack configuration file for production mode
const webpackConfig = require('./webpack.production.config.js');

const compiler = Webpack(webpackConfig);
const devServerOptions = { ...webpackConfig.devServer, open: true };
const server = new WebpackDevServer(devServerOptions, compiler);

const runServer = async () => {
  console.log('🔥Starting server...');
  await server.start();
};

runServer();
