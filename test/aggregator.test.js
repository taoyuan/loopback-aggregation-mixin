"use strict";

require('./init');
const assert = require('chai').assert;
const s = require('./support');
const aggregator = require('../src/aggregator');

describe('aggregator', function () {

  beforeEach(function () {
    return s.setup().then((db) => {
      this.db = db
    })
  });

  describe('#build', function () {
    it('should build typical aggregate filters', function () {
      const Model = this.db.models['Sales'];
      const builder = aggregator.build(Model, {
        "where": {
          "name": "bob",
          "date1": {"lt": "/Date(1221644506800-0700)/"},
          "date3": {"lt": "2013-02-04T18:35:24+00:00"},
        },
        "aggregate": {
          "group": {
            "id": "$name",
            "count": {
              "$sum": 1
            },
            "external": {
              "$sum": 1
            }
          }
        },
        "sort": "count DESC",
        "limit": 5,
        "skip": 20,
        "fields": {
          "external": false
        }
      });

      assert.deepEqual(builder.pipeline, [
        {
          "$match": {
            "name": "bob",
            "date1": {
              "$lt": new Date('2008-09-17T09:41:46.800Z')
            },
            "date3": {
              "$lt": new Date('2013-02-04T18:35:24.000Z')
            }
          }
        }, {
          "$group": {"_id": "$name", "count": {"$sum": 1}, "external": {"$sum": 1}}
        }, {
          "$project": {"external": false}
        }, {
          "$sort": {"count": -1}
        }
      ]);
    });
  });

});
