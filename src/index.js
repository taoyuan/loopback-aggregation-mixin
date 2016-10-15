'use strict';

const mixin = require('./mixin');

module.exports = function (app) {
  app.loopback.modelBuilder.mixins.define('Aggregate', mixin);
};
