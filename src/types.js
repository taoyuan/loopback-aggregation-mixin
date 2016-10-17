"use strict";

const Types = {};

const reISO = /^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2}):(\d{2}(?:\.{0,1}\d*))(?:Z|(\+|-)([\d|:]*))?$/;
const reMsAjax = /^\/[D|d]ate\((d|-|.*)\)[\/|\\]$/;

Types.Date = Types.date = function (value) {
  if (typeof value === 'string') {
    var a = reISO.exec(value);
    if (a)
      return new Date(value);
    a = reMsAjax.exec(value);
    if (a) {
      var b = a[1].split(/[-+,.]/);
      return new Date(b[0] ? +b[0] : 0 - +b[1]);
    }
  }
  return value;
};

Types.Date.match = function (value) {
  return typeof value === 'string' && (reISO.test(value) || reMsAjax.test(value));
};

exports.cast = function (value) {
  if (Types.Date.match(value)) {
    return Types.Date(value);
  }
  return value;
};

exports.Types = Types;
