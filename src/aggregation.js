"use strict";

const aggregator = require('./aggregator');

module.exports = function (Model) {
  Model.aggregate = function (filter, options, callback) {
    return aggregator.aggregate(Model, filter, options, callback);
  };

  Model.remoteMethod('aggregate', {
    accessType: "READ",
    accepts: [{
      arg: "filter", type: "object",
      description: "Filter defining fields, where, aggregate, order, offset, and limit",
    }, {
      arg: "options", type: "object",
      description: "options",
    }],
    description: "Aggregate by filter from the data source.",
    returns: {arg: "data", type: 'array', root: true},
    http: {path: "/aggregate", verb: "get"},
  });
};
