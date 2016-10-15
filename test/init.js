// Copyright IBM Corp. 2013,2016. All Rights Reserved.
// Node module: loopback-connector-mongodb
// This file is licensed under the MIT License.
// License text available at https://opensource.org/licenses/MIT

module.exports = require('chai').assert;

const DataSource = require('loopback-datasource-juggler').DataSource;
const MongoDBConnector = require('loopback-connector-mongodb');

const TEST_ENV = process.env.TEST_ENV || 'test';
let config = require('rc')('loopback', { test: { mongodb: {}}})[TEST_ENV].mongodb;

if (process.env.CI) {
  config = {
    host: process.env.MONGODB_HOST || 'localhost',
    port: process.env.MONGODB_PORT || 27017,
    database: 'lb-aggregation-mongodb-test-' + (
      process.env.TRAVIS_BUILD_NUMBER || process.env.BUILD_NUMBER || '1'
    ),
  };
}

global.config = config;

global.getDataSource = global.getSchema = function(customConfig) {
  var db = new DataSource(MongoDBConnector, customConfig || config);
  db.log = function(a) {
    console.log(a);
  };

  return db;
};

global.connectorCapabilities = {
  ilike: false,
  nilike: false,
};

global.sinon = require('sinon');
