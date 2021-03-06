'use strict';

// ## Configurations
// Setup your installations for various environments

// Module dependencies
var path = require('path');

var config = {};

var PORT = process.env.PORT || 3000;
var API_VERSION = 'v0';

// ## Development Environment Configurations
config.development = {
  db: {},

  dirs: {
    views: path.resolve(__dirname, '../client/src'),
    static: [
      path.resolve(__dirname, '../client/src'),
      path.resolve(__dirname, '../client/src/assets'),
      path.resolve(__dirname, '../client/.tmp'),
      path.resolve(__dirname, '../client/.tmp/concat')
    ]
  },

  livereload: 35729,

  server: {
    // Host to be passed to node's `net.Server#listen()`
    host: '127.0.0.1',

    secret: 'shhhhhhhhhhhhh',

    // Port to be passed to node's `net.Server#listen()`
    port: PORT,

    // base url
    baseUrl: process.env.BASE_URL || 'http://127.0.0.1:' + PORT,

    apiBasePath: '/api/' + API_VERSION
  },
  
  // https://developer.linkedin.com/documents/authentication
  linkedin: {
    baseUrl: process.env.LINKEDIN_BASE_URL || 'http://127.0.0.1:' + PORT,
    apiKey: 'FILL_ME_IN',
    secret: 'FILL_ME_IN',
    state: 'FILL_ME_IN'
  },

  // viewEngine: 'ect'
};


// ## Production Environment Configurations
config.production = {
  db: {},
  
  dirs: {
    views: path.resolve(__dirname, '../client/dist'),
    static: path.resolve(__dirname, '../client/dist')
  },
  
  livereload: false,
  
  server: {
    // Host to be passed to node's `net.Server#listen()`
    host: '127.0.0.1',

    secret: 'shhhhhhhhhhhhh',

    // Port to be passed to node's `net.Server#listen()`
    port: PORT,

    // base url
    baseUrl: process.env.BASE_URL || 'http://127.0.0.1:' + PORT,

    apiBasePath: '/api/' + API_VERSION
  },

  // https://developer.linkedin.com/documents/authentication
  linkedin: {
    baseUrl: process.env.LINKEDIN_BASE_URL || 'http://127.0.0.1:' + PORT,
    apiKey: 'FILL_ME_IN',
    secret: 'FILL_ME_IN',
    state: 'FILL_ME_IN'
  },

  // viewEngine: 'ect'
};

config.azure = {
  db: {},
  
  dirs: {
    views: path.resolve(__dirname, '../_azure/client'),
    static: path.resolve(__dirname, '../_azure/client')
  },
  
  livereload: false,
  
  server: {
    // Host to be passed to node's `net.Server#listen()`
    host: '127.0.0.1',

    secret: 'shhhhhhhhhhhhh',

    // Port to be passed to node's `net.Server#listen()`
    port: PORT,

    // base url
    baseUrl: process.env.BASE_URL || 'http://127.0.0.1:' + PORT,

    apiBasePath: '/api/' + API_VERSION
  },

  // https://developer.linkedin.com/documents/authentication
  linkedin: {
    baseUrl: process.env.LINKEDIN_BASE_URL || 'http://127.0.0.1:' + PORT,
    apiKey: 'FILL_ME_IN',
    secret: 'FILL_ME_IN',
    state: 'FILL_ME_IN'
  },

  // viewEngine: 'ect'
};

module.exports = config;

