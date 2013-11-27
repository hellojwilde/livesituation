var Place = require("../../lib/core/Place");
var {StringChange} = require("../../lib/core/Change");
var Revision = require("../../lib/core/Revision");
var Changeset = require("../../lib/core/Changeset");

var assert = require("assert");
var testing = require("../testing");

describe("Changeset", function () {
  describe("-baseSequenceId", function () {
    it("should return the inputted sequence id", function () {
      var id = 57;
      assert.equal(new Changeset(id).baseSequenceId, id);
    });
  });

  describe("-changes", function () {
    it("should return the inputted changes array", function () {
      var changes = [new StringChange("insert", new Place(["str", 0]), "ins")];
      assert.deepEqual(new Changeset(0).changes, []);
      assert.deepEqual(new Changeset(0, changes).changes, changes);
    });
  });

  describe("-inverted", function () {
    var set = new Changeset(0, [
      new StringChange("insert", new Place(["str", 0]), "ins"),
      new StringChange("insert", new Place(["str", 3]), "wat")
    ]);

    it("should reverse the order of and invert changes", function () {
      var expected = new Changeset(0, [
        new StringChange("remove", new Place(["str", 3]), "wat"),
        new StringChange("remove", new Place(["str", 0]), "ins")
      ]);
      testing.assertChangesetEqual(set.inverted, expected);
    });

    it("should satisfy cs = i(i(cs)) algebra", function () {
      testing.assertChangesetEqual(set, set.inverted.inverted);
    });
  });

  describe("#push", function () {
    it("should mutate existing changeset with the new change", function () {
      var addition = new StringChange("insert", new Place(["woot", 3]), "wat");
      var set = new Changeset(0, [
        new StringChange("insert", new Place(["str", 0]), "ins"),
        new StringChange("insert", new Place(["str", 3]), "wat")
      ]);

      assert(set.push(addition), set);
      assert.equal(set.changes.length, 3);
      assert.equal(set.changes[set.changes.length - 1], addition);
    });
  });

  describe("#concat", function () {
    it("should reject mismatched base sequence IDs", function () {
      assert.throws(() => new Changeset(1).concat(new Changeset(0)));
    });

    it("should create a new changeset with the changes in order", function () {
      var one = new Changeset(0, [
        new StringChange("insert", new Place(["woot", 3]), "wat")
      ]);
      var two = new Changeset(0, [
        new StringChange("insert", new Place(["str", 0]), "ins"),
        new StringChange("insert", new Place(["str", 3]), "wat")
      ]);
      var three = new Changeset(0, [
        new StringChange("insert", new Place(["woot", 3]), "wat"),
        new StringChange("insert", new Place(["str", 0]), "ins"),
        new StringChange("insert", new Place(["str", 3]), "wat")
      ]);

      testing.assertChangesetEqual(one.concat(two), three);
      assert.notEqual(one.concat(two), three);
    });
  });

  describe("#apply", function () {
    it("should satisfy d ~= m(m(d, cs), i(cs)) algebra", function () {
      var set = new Changeset(0, [
        new StringChange("insert", new Place(["str", 2]), "wat"),
        new StringChange("insert", new Place(["str", 0]), "ins"),
        new StringChange("insert", new Place(["str", 10]), "wat")
      ]);
      var inverse = new Changeset(1, set.inverted.changes);
      var ctx = new Revision(0, {"str": "dsfadsfjdslfjadslkfj"});
      assert.deepEqual(inverse.apply(set.apply(ctx)).data, ctx.data);
    });
  });

  describe("#relocate", function () {
    it("should satisfy p = r(r(p, cs), i(cs)) algebra", function () {
      var set = new Changeset(0, [
        new StringChange("insert", new Place(["str", 0]), "wat"),
        new StringChange("insert", new Place(["str", 0]), "ins"),
        new StringChange("insert", new Place(["str", 3]), "wat")
      ]);
      var place = new Place(["str", 2]);
      var same = set.inverted.relocate(set.relocate(place));
      assert(place.isEqualTo(same));
    });
  });

  describe("#transform", function () {
    it("should satisfy c = t(t(c, cs), i(cs)) algebra", function () {
      var set = new Changeset(0, [
        new StringChange("insert", new Place(["str", 0]), "wat"),
        new StringChange("insert", new Place(["str", 0]), "ins"),
        new StringChange("insert", new Place(["str", 3]), "wat")
      ]);
      var change = new StringChange("insert", new Place(["str", 1]), "wattt");
      var same = set.inverted.transform(set.transform(change));
      testing.assertChangeEqual(change, same);
    });

    it("should satisfy cs0 = t(t(cs0, cs), i(cs)) algebra", function () {
      var one = new Changeset(0, [
        new StringChange("insert", new Place(["str", 0]), "wat"),
        new StringChange("insert", new Place(["str", 0]), "ins"),
        new StringChange("insert", new Place(["str", 3]), "wat")
      ]);
      var two = new Changeset(0, [
        new StringChange("insert", new Place(["str", 1]), "wattt"),
        new StringChange("insert", new Place(["str", 5]), "wtt")
      ]);
      var same = one.inverted.transform(one.transform(two));
      testing.assertChangesetEqual(two, same);
    });
  });
});