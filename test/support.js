"use strict";

require('./init');
const Promise = require('bluebird');

exports.setup = function () {
  const db = getDataSource();

  db.define('Sales', {
    name: String,
    team: String,
    datatime: Date,
    invitations: Number,
    visits: Number,
    orders: Number,
    money: Number
  }, {mongodb: {collection: 'sales'}});

  return Promise.fromCallback(callback => db.automigrate('Sales', callback)).then(() => db);
};
