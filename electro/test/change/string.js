var {Place} = require("../../lib/place.js");
var {StringChange} = require("../../lib/change.js");
var assert = require("assert");
var testing = require("../testing.js");

describe("StringChange", function () {
  describe("-type", function () {
    it("should return string", function () {
      var change = new StringChange("insert", new Place(["mystr", 0], "ins"));
      assert.equal(change.type, "string");
    });
  });

  describe("-inverted", function () {
    it("should flip insert to remove", function () {
      var change = new StringChange("insert", new Place(["mystr", 0]), "ins");
      assert.equal(change.inverted.op, "remove");
    });

    it("should satisfy change = invert(invert(change))", function () {
      var insert = new StringChange("insert", new Place(["k", 0]), "i");
      var remove = new StringChange("remove", new Place(["k", 0]), "i");

      testing.assertChangeEqual(insert, insert.inverted.inverted, "insert");
      testing.assertChangeEqual(remove, remove.inverted.inverted, "remove");
    });
  });
});