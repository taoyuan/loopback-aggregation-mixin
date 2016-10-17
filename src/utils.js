"use strict";

exports.createPromiseCallback = createPromiseCallback;
exports.toRegExp = toRegExp;
exports.hasRegExpFlags = hasRegExpFlags;

const Promise = require('bluebird');

function createPromiseCallback() {
  let cb;
  const promise = new Promise(function(resolve, reject) {
    cb = function(err, data) {
      if (err) return reject(err);
      return resolve(data);
    };
  });
  cb.promise = promise;
  return cb;
}

/**
 * Converts a string, regex literal, or a RegExp object to a RegExp object.
 * @param {String|Object} regex The string, regex literal, or RegExp object to convert
 * @returns {Object} A RegExp object
 */
function toRegExp(regex) {
  const isString = typeof regex === 'string';
  const isRegExp = regex instanceof RegExp;

  if (!(isString || isRegExp))
    return new Error(g.f('Invalid argument, must be a string, {{regex}} literal, or ' +
      '{{RegExp}} object'));

  if (isRegExp)
    return regex;

  if (!hasRegExpFlags(regex))
    return new RegExp(regex);

  // only accept i, g, or m as valid regex flags
  const flags = regex.split('/').pop().split('');
  const validFlags = ['i', 'g', 'm'];
  const invalidFlags = [];
  flags.forEach(function(flag) {
    if (validFlags.indexOf(flag) === -1)
      invalidFlags.push(flag);
  });

  const hasInvalidFlags = invalidFlags.length > 0;
  if (hasInvalidFlags)
    return new Error(g.f('Invalid {{regex}} flags: %s', invalidFlags));

  // strip regex delimiter forward slashes
  const expression = regex.substr(1, regex.lastIndexOf('/') - 1);
  return new RegExp(expression, flags.join(''));
}

function hasRegExpFlags(regex) {
  return regex instanceof RegExp ?
    regex.toString().split('/').pop() :
    !!regex.match(/.*\/.+$/);
}
