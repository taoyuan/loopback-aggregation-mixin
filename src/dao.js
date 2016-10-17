"use strict";

exports.coerce = coerce;

const util = require('util');
const utils = require('./utils');
const types = require('./types');

const operators = {
  gt: '>',
  gte: '>=',
  lt: '<',
  lte: '<=',
  between: 'BETWEEN',
  inq: 'IN',
  nin: 'NOT IN',
  neq: '!=',
  like: 'LIKE',
  nlike: 'NOT LIKE',
  ilike: 'ILIKE',
  nilike: 'NOT ILIKE',
  regexp: 'REGEXP',
};

function coerce(where) {
  if (!where) {
    return where;
  }

  let err;
  if (typeof where !== 'object' || Array.isArray(where)) {
    err = new Error(util.format('The where clause %j is not an {{object}}', where));
    err.statusCode = 400;
    throw err;
  }

  for (var p in where) {
    // Handle logical operators
    if (p === 'and' || p === 'or' || p === 'nor') {
      const clauses = where[p];
      if (Array.isArray(clauses)) {
        for (var k = 0; k < clauses.length; k++) {
          coerce(clauses[k]);
        }
      } else {
        err = new Error(util.format('The %s operator has invalid clauses %j', p, clauses));
        err.statusCode = 400;
        throw err;
      }
      return where;
    }


    let val = where[p];
    if (val === null || val === undefined) {
      continue;
    }
    // Check there is an operator
    var operator = null;
    var exp = val;
    if (val.constructor === Object) {
      for (var op in operators) {
        if (op in val) {
          val = val[op];
          operator = op;
          switch (operator) {
            case 'inq':
            case 'nin':
              if (!Array.isArray(val)) {
                err = new Error(util.format('The %s property has invalid clause %j', p, where[p]));
                err.statusCode = 400;
                throw err;
              }
              break;
            case 'between':
              if (!Array.isArray(val) || val.length !== 2) {
                err = new Error(util.format('The %s property has invalid clause %j', p, where[p]));
                err.statusCode = 400;
                throw err;
              }
              break;
            case 'like':
            case 'nlike':
            case 'ilike':
            case 'nilike':
              if (!(typeof val === 'string' || val instanceof RegExp)) {
                err = new Error(util.format('The %s property has invalid clause %j', p, where[p]));
                err.statusCode = 400;
                throw err;
              }
              break;
            case 'regexp':
              val = utils.toRegExp(val);
              if (val instanceof Error) {
                val.statusCode = 400;
                throw err;
              }
              break;
          }
          break;
        }
      }
    }
    // Coerce the array items
    if (Array.isArray(val)) {
      for (var i = 0; i < val.length; i++) {
        if (val[i] !== null && val[i] !== undefined) {
          val[i] = types.cast(val[i]);
        }
      }
    } else {
      if (val != null) {
        if (operator === null && val instanceof RegExp) {
          // Normalize {name: /A/} to {name: {regexp: /A/}}
          operator = 'regexp';
        } else if (operator === 'regexp' && val instanceof RegExp) {
          // Do not coerce regex literals/objects
        } else if (!((operator === 'like' || operator === 'nlike' ||
          operator === 'ilike' || operator === 'nilike') && val instanceof RegExp)) {
          val = types.cast(val);
        }
      }
    }
    // Rebuild {property: {operator: value}}
    if (operator) {
      var value = {};
      value[operator] = val;
      if (exp.options) {
        // Keep options for operators
        value.options = exp.options;
      }
      val = value;
    }
    where[p] = val;
  }

  return where;
}
