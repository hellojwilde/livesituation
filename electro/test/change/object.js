var {Place} = require("../../lib/place.js");
var {ObjectChange} = require("../../lib/change.js");
var assert = require("assert");
var testing = require("../testing.js");

describe("ObjectChange", function () {
  describe("-type", function () {
    it("should return object", function () {
      var change = new ObjectChange("insert", new Place(["mykey"], "ins"));
      assert.equal(change.type, "object");
    });
  });

  describe("-inverted", function () {
    describe("insert/remove", function () {
      it("should flip insert to remove", function () {
        var change = new ObjectChange("insert", new Place(["mykey"]), "ins");
        assert.equal(change.inverted.op, "remove");
      });
    });

    describe("replace", function () {
      it("should flip order of before and after", function () {
        var change = new ObjectChange("replace", new Place(["k"]), "b", "a");
        assert.deepEqual(change.inverted.args, ["a", "b"]);
      });
    });

    it("should satisfy change = invert(invert(change))", function () {
      var insert = new ObjectChange("insert", new Place(["k"]), "i");
      var remove = new ObjectChange("remove", new Place(["k"]), "i");
      var replace = new ObjectChange("replace", new Place(["k"]), "b", "a");

      testing.assertChangeEqual(insert, insert.inverted.inverted, "insert");
      testing.assertChangeEqual(remove, remove.inverted.inverted, "remove");
      testing.assertChangeEqual(replace, replace.inverted.inverted, "replace");
    });
  });
});