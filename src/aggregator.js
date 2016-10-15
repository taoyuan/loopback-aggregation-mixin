"use strict";

const debug = require('debug')('loopback:component:aggregate');
const Builder = require('./builder');
const utils = require('./utils');

const aggregator = {};

function rewriteId(doc) {
  doc = doc || {};
  if (doc._id) {
    doc.id = doc._id;
  }
  delete doc._id;
  return doc;
}

aggregator.build = function (Model, filter, options) {
  const connector = Model.getConnector();

  debug('aggregate', Model.modelName);

  if (!filter || !filter.aggregate) {
    throw new Error('no aggregate filter');
  }

  const builder = new Builder(Model, filter.aggregate);

  if (filter.where) {
    builder.matchAt(0, filter.where);
    // aggregation.pipeline.unshift({'$match': connector.buildWhere(Model.modelName, filter.where)});
  }

  debug('all.aggregate', builder.pipeline);
  if (filter.fields) {
    builder.project(filter.fields);
  }

  if (filter.sort) {
    builder.sort(connector.buildSort(Model.modelName, filter.sort));
  }

  return builder;
};

aggregator.exec = function (aggregation) {
  const cursor = aggregation.aggregate();

  if (filter.limit) {
    cursor.limit(filter.limit);
  }

  if (filter.skip) {
    cursor.skip(filter.skip);
  } else if (filter.offset) {
    cursor.skip(filter.offset);
  }

  return Promise.fromCallback((callback) => cursor.toArray((err, data) => {
    debug('aggregate', aggregation.Model.modelName, filter, err, data);
    callback(err, data.map(rewriteId));
  }));
};

aggregator.aggregate = function(Model, filter, options, callback) {
  callback = callback || utils.createPromiseCallback();

  let aggregation;
  try {
    aggregation = aggregator.build(Model, filter, options);
    aggregator.exec(aggregation).asCallback(callback);
  } catch (e) {
    callback(e);
  }
  return callback.promise;
};

module.exports = aggregator;
