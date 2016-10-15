"use strict";

const _ = require('lodash');
const utils = require('./utils');

class Builder {

  constructor(Model, ...args) {
    this.pipeline = [];
    this.options = {};

    if (typeof Model !== 'function') {
      args.unshift(Model);
      Model = null;
    }

    this.Model = Model;
    if (Model) {
      this.connector = Model.getConnector();
      this.collection = this.connector.collection(Model.modelName);
    }

    this.add(...args);
  }

  build(directive) {
    if (!directive || typeof directive !== 'object') {
      return false;
    }

    return _.transform(directive, (result, value, key) => {
      if (key[0] !== '$') key = '$' + key;
      result[key] = this.buildQuery(value);
    }, {});
  };

  buildQuery(where) {
    if (!where || typeof where !== 'object') {
      return {};
    }

    return _.transform(where, (result, v, k) => {
      if ((k === 'and' || k === 'or' || k === 'nor') && Array.isArray(v)) {
        k = '$' + k;
        v = v.map(item => this.buildWhere(item));
      }
      if (k === 'id') {
        k = '_id';
      }
      result[k] = v;
    }, {});
  };

  buildWhere(where) {
    if (this.Model) {
      return this.Model.getConnector().buildWhere(this.Model.modelName, where);
    }

    return where;
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

  match(options) {
    return this.matchAt(null, options);
  };

  matchAt(pos, options) {
    return this.add(pos, {$match: options});
  };

  group(options) {
    return this.groupAt(null, {$group: options});
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
      throw new Error('Aggregation not bound to any Model');
    }

    return collection.aggregate(this.pipeline, this.options);
  };

  explain(collection, callback) {
    callback = callback || utils.createPromiseCallback();

    if (this.pipeline.length) {
      collection.aggregate(this.pipeline, this.options).explain(callback);
    } else {
      callback(new Error('Aggregation has empty pipeline'))
    }

    return callback.promise;
  };
}

module.exports = Builder;
