"use strict";

require('./init');
const assert = require('chai').assert;
const s = require('./support');
const Context = require('../src/context');

describe('context', function () {

  beforeEach(function () {
    return s.setup().then((db) => {
      this.db = db
    })
  });

  it('should build match for loopback `where` syntax', function () {
    const db = this.db;
    const context = new Context(db.models['Sales']).add([{
      match: {
        or: [
          {and: [{field1: 'foo'}, {field2: {gt: 2}}]},
          {field1: 'morefoo'}
        ]
      }
    }, {
      group: {
        id: '$status',
        count: {
          $sum: 1
        }
      }
    }]);

    assert.lengthOf(context.pipeline, 2);
    assert.deepEqual(context.pipeline, [{
      $match: {
        $or: [
          {$and: [{field1: 'foo'}, {field2: {$gt: 2}}]},
          {field1: 'morefoo'}
        ]
      },
    }, {
      $group: {
        _id: '$status',
        count: {
          $sum: 1
        }
      }
    }]);
  });

  it('should hold original mongo query statement', function () {
    const db = this.db;
    const context = new Context(db.models['Sales']).add({
      match: {
        $or: [
          {$and: [{field3: 'foo'}, {field4: {$gt: 2}}]},
          {field5: 'morefoo'}
        ]
      }
    });

    assert.lengthOf(context.pipeline, 1);
    assert.deepEqual(context.pipeline[0], {
      $match: {
        $or: [
          {$and: [{field3: 'foo'}, {field4: {$gt: 2}}]},
          {field5: 'morefoo'}
        ]
      }
    });
  })
});
