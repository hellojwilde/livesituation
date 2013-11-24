var {Place} = require("../../lib/place.js");
var {ArrayChange} = require("../../lib/change.js");
var assert = require("assert");
var testing = require("../testing.js");

describe("ArrayChange", function () {
  describe("-type", function () {
    it("should return array", function () {
      var change = new ArrayChange("insert", new Place(["myarr", 0], "ins"));
      assert.equal(change.type, "array");
    });
  });

  describe("-inverted", function () {
    describe("insert/remove", function () {
      it("should flip insert to remove", function () {
        var change = new ArrayChange("insert", new Place(["mykey", 0]), "ins");
        assert.equal(change.inverted.op, "remove");
      });
    });

    describe("replace", function () {
      it("should flip order of before and after", function () {
        var change = new ArrayChange("replace", new Place(["k", 0]), "b", "a");
        assert.deepEqual(change.inverted.args, ["a", "b"]);
      });
    });

    describe("move", function () {
      it("should flip the offset and the newOffset", function () {
        var change = new ArrayChange("move", new Place(["k", 0]), 3);
        assert.equal(change.inverted.place.offset, change.args[0]);
        assert.equal(change.inverted.args[0], change.place.offset);
      });
    });

    it("should satisfy change = invert(invert(change))", function () {
      var insert = new ArrayChange("insert", new Place(["k", 0]), "i");
      var remove = new ArrayChange("remove", new Place(["k", 0]), "i");
      var replace = new ArrayChange("replace", new Place(["k", 0]), "b", "a");
      var move = new ArrayChange("move", new Place(["k", 0]), 2);

      testing.assertChangeEqual(insert, insert.inverted.inverted, "insert");
      testing.assertChangeEqual(remove, remove.inverted.inverted, "remove");
      testing.assertChangeEqual(replace, replace.inverted.inverted, "replace");
      testing.assertChangeEqual(move, move.inverted.inverted, "move");
    });
  });
});