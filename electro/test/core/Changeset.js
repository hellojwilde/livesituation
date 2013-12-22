var assert = require("assert");
var _ = require("underscore");

var Place = require("../../src/core/Place");
var Change = require("../../src/core/Change");
var Revision = require("../../src/core/Revision");
var Changeset = require("../../src/core/Changeset");

var StringChange = Change.StringChange, ChangeType = Change.ChangeType;

describe("Changeset", function () {
  var one = new Changeset([
    new StringChange(ChangeType.Insert, new Place(["woot", 3]), ["wat"])
  ]);
  
  var two = new Changeset([
    new StringChange(ChangeType.Insert, new Place(["str", 0]), ["ins"]),
    new StringChange(ChangeType.Insert, new Place(["str", 3]), ["wat"])
  ]);
  
  var three = new Changeset([
    new StringChange(ChangeType.Insert, new Place(["str", 0]), ["ins"]),
    new StringChange(ChangeType.Insert, new Place(["str", 3]), ["wat"]),
    new StringChange(ChangeType.Insert, new Place(["str", 3]), ["wat"])
  ]);
  
  describe("#getChanges", function () {
    it("should return the inputted changes array", function () {
      var changes = [new StringChange(ChangeType.Insert, new Place(), ["ins"])];
      assert.deepEqual(new Changeset().getChanges(), []);
      assert.deepEqual(new Changeset(changes).getChanges(), changes);
    });
  });
  
  describe("#isEqualTo", function () {
    it("should compare deeply by value", function () {
      var threeClone = _.clone(three);
      assert.notEqual(threeClone, three);
      assert(three.isEqualTo(threeClone));
      assert(threeClone.isEqualTo(three));
    });
  });

  describe("#getInversion", function () {
    it("should reverse the order of and invert changes", function () {
      var expected = new Changeset([
        new StringChange(ChangeType.Remove, new Place(["str", 3]), ["wat"]),
        new StringChange(ChangeType.Remove, new Place(["str", 0]), ["ins"])
      ]);
      assert(two.getInversion().isEqualTo(expected));
    });

    it("should satisfy cs = i(i(cs)) algebra", function () {
      var invinv = three.getInversion().getInversion();
      assert(three.isEqualTo(invinv));
    });
  });

  describe("#push", function () {
    it("should mutate existing changeset with the new change", function () {
      var addition = new StringChange(ChangeType.Insert, 
                                      new Place(["str", 3]), ["wat"]);
      var twoClone = _.clone(two);
      assert.equal(twoClone.push(addition), twoClone);
      
      var changes = twoClone.getChanges();
      assert.equal(changes.length, 3);
      assert.equal(_.last(changes), addition);
    });
  });

  describe("#concat", function () {
    it("should create a new changeset with the changes in order", function () {
      assert(one.concat(two).isEqualTo(three));
      assert.notEqual(one.concat(two), three);
    });
  });

  describe("#apply", function () {
    it("should satisfy d ~= m(m(d, cs), i(cs)) algebra", function () {
      var inverse = new Changeset(three.getInversion().getChanges());
      var ctx = new Revision(0, {"str": "dsfadsfjdslfjadslkfj"});
      var invinvctx = inverse.apply(three.apply(ctx));
      assert.deepEqual(invinvctx.getData(), ctx.getData());
    });
  });

  describe("#relocate", function () {
    it("should satisfy p = r(r(p, cs), i(cs)) algebra", function () {
      var place = new Place(["str", 2]);
      var same = three.getInversion().relocate(three.relocate(place));
      assert(place.isEqualTo(same));
    });
  });

  describe("#transform", function () {
    it("should satisfy c = t(t(c, cs), i(cs)) algebra", function () {
      var change = new StringChange("insert", new Place(["str", 1]), ["wattt"]);
      var same = three.getInversion().transform(three.transform(change));
      assert(change.isEqualTo(same));
    });

    it("should satisfy cs0 = t(t(cs0, cs), i(cs)) algebra", function () {
      var same = three.getInversion().transform(three.transform(two));
      assert(two.isEqualTo(same));
    });
  });
});
