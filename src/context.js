"use strict";

const _ = require('lodash');
const utils = require('./utils');
const dao = require('./dao');

class Context {

  constructor(connector, model) {
    this.pipeline = [];
    this.options = {};

    if (typeof connector === 'function') { // Model class
      model = connector.modelName;
      connector = connector.getConnector();
    }

    this.connector = connector;
    this.model = model;
    this.collection = connector && model && connector.collection(model);
  }

  build(directive) {
    if (!directive || typeof directive !== 'object') {
      return false;
    }

    return _.transform(directive, (result, value, key) => {
      if (key[0] !== '$') key = '$' + key;
      if (key === '$match') {
        value = dao.coerce(value);
        if (this.connector && this.model) {
          value = this.connector.buildWhere(this.model, value);
        }
      }
      result[key] = this.buildQuery(value);
    }, {});
  };

  buildQuery(where) {
    if (!where || typeof where !== 'object') {
      return {};
    }

    return _.transform(where, (result, v, k) => {
      k = k === 'id' ? '_id' : k;
      result[k] = v;
    }, {});
  };

  add(pos, ...args) {
    if (typeof pos !== 'number') {
      pos && args.unshift(pos);
      pos = this.pipeline.length;
    }

    if (args.length) {
      this.pipeline.splice(pos, 0, ..._.flatten(args).map(arg => this.build(arg)));
    }

    return this;
  };

  match(where) {
    return this.matchAt(null, where);
  };

  matchAt(pos, where) {
    return this.add(pos, {$match: where});
  };

  group(options) {
    return this.groupAt(null, options);
  };

  groupAt(pos, options) {
    return this.add(pos, {$group: options});
  };

  skip(options) {
    return this.add({$skip: options});
  };

  limit(options) {
    return this.add({$limit: options});
  };

  out(options) {
    return this.add({$out: options});
  };

  project(fields) {
    return this.add({$project: fields});
  };

  near(options) {
    return this.add({$geoNear: options});
  };

  unwind(...args) {
    return this.add(_.map(args, arg => {
      if (arg && typeof arg === 'object') {
        return {$unwind: arg};
      }
      if (typeof arg === 'string') {
        return {$unwind: arg[0] === '$' ? arg : '$' + arg}
      }
      throw Error('Invalid arg "' + arg + '" to unwind(), ' + 'must be string or object')
    }));
  };

  lookup(options) {
    return this.add({$lookup: options});
  };

  sample(size) {
    return this.add({$sample: {size: size}});
  };

  sort(sort) {
    return this.add({$sort: sort});
  };

  allowDiskUse(value) {
    this.options.allowDiskUse = value;
    return this;
  };

  cursor(options) {
    this.options.cursor = options || {};
    return this;
  };

  addCursorFlag(flag, vlaue) {
    this.options[flag] = value;
    return this;
  };

  aggregate(collection) {
    collection = collection || this.collection;
    if (!collection) {
      throw new Error('Aggregation not bound to any model');
    }

    return collection.aggregate(this.pipeline, this.options);
  };

  explain(collection, callback) {
    if (typeof collection === 'string') {
      callback = collection;
      collection = null;
    }

    collection = collection || this.collection;
    if (!collection) {
      throw new Error('Aggregation not bound to any model');
    }

    callback = callback || utils.createPromiseCallback();

    if (this.pipeline.length) {
      collection.aggregate(this.pipeline, this.options).explain(callback);
    } else {
      callback(new Error('Aggregation has empty pipeline'))
    }

    return callback.promise;
  };
}

module.exports = Context;
