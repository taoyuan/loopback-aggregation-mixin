"use strict";

const debug = require('debug')('loopback:component:aggregate');
const Promise = require('bluebird');
const Context = require('./context');
const utils = require('./utils');
const dao = require('./dao');

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
  const model = Model.modelName;

  debug('aggregate', model);

  if (!filter || !filter.aggregate) {
    throw new Error('no aggregate filter');
  }

  const context = (new Context(connector, model)).add(filter.aggregate);

  if (filter.where) {
    context.matchAt(0, filter.where);
  }

  debug('all.aggregate', context.pipeline);
  if (filter.fields) {
    context.project(filter.fields);
  }

  if (filter.sort) {
    context.sort(connector.buildSort(model, filter.sort));
  }

  return context;
};

aggregator.exec = function (context, filter) {
  filter = filter || {};

  const cursor = context.aggregate();

  if (filter.limit) {
    cursor.limit(filter.limit);
  }

  if (filter.skip) {
    cursor.skip(filter.skip);
  } else if (filter.offset) {
    cursor.skip(filter.offset);
  }

  return Promise.fromCallback((callback) => cursor.toArray((err, data) => {
    debug('aggregate', context.model, filter, err, data);
    callback(err, data && data.map(rewriteId));
  }));
};

aggregator.aggregate = function(Model, filter, options, callback) {
  callback = callback || utils.createPromiseCallback();

  try {
    const context = aggregator.build(Model, filter, options);
    aggregator.exec(context, filter).asCallback(callback);
  } catch (e) {
    callback(e);
  }
  return callback.promise;
};

module.exports = aggregator;
