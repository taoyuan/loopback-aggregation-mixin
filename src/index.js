'use strict';

const aggregation = require('./aggregation');

module.exports = function (app) {
  app.loopback.modelBuilder.mixins.define('Aggregation', aggregation);
};
