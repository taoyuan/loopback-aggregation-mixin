"use strict";

require('./init');
const assert = require('chai').assert;
const s = require('./support');
const Builder = require('../src/builder');

describe('builder', function () {

  beforeEach(function () {
    return s.setup().then((db) => {
      this.db = db
    })
  });

  it('should build match for loopback `where` syntax', function () {
    const db = this.db;
    const aggregation = new Builder(db.models['Sales'], {
      match: {
        or: [
          {and: [{field1: 'foo'}, {field2: {gt: 2}}]},
          {field1: 'morefoo'}
        ]
      },
      group: {
        id: '$status',
        count: {
          $sum: 1
        }
      }
    });

    assert.lengthOf(aggregation.pipeline, 1);
    assert.deepEqual(aggregation.pipeline[0], {
      $match: {
        $or: [
          {$and: [{field1: 'foo'}, {field2: {$gt: 2}}]},
          {field1: 'morefoo'}
        ]
      },
      $group: {
        _id: '$status',
        count: {
          $sum: 1
        }
      }
    });
  });

  it('should hold original mongo query statement', function () {
    const db = this.db;
    const aggregation = new Builder(db.models['Sales'], {
      match: {
        $or: [
          {$and: [{field3: 'foo'}, {field4: {$gt: 2}}]},
          {field5: 'morefoo'}
        ]
      }
    });

    assert.lengthOf(aggregation.pipeline, 1);
    assert.deepEqual(aggregation.pipeline[0], {
      $match: {
        $or: [
          {$and: [{field3: 'foo'}, {field4: {$gt: 2}}]},
          {field5: 'morefoo'}
        ]
      }
    });
  })
});
