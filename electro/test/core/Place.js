var Place = require("../../src/core/Place");
var assert = require("assert");

describe("Place", function () {
  describe("constructor", function () {
    it("path(...) -> ... or []", function () {
      assert.deepEqual(new Place().toPath(), []);
      assert.deepEqual(new Place([]).toPath(), []);
      assert.deepEqual(new Place([1, 2, 3]).toPath(), [1, 2, 3]);
    });
  });
  
  describe("#isRoot", function () {
    it("isRoot([]) -> true", function () {
      assert(new Place().isRoot());
      assert(!new Place([1]).isRoot());
    });
  });
  
  describe("#getDepth", function () {
    it("depth([...]) = [...].length", function () {
      assert.equal(new Place().getDepth(), 0, "[]");
      assert.equal(new Place([1]).getDepth(), 1, "[1]");
    });
  });

  describe("#getParent", function () {
    it("parent([a, b, c]) -> [a, b]", function () {
      var place = new Place(["woot", "hello", "hi"]);
      assert.deepEqual(place.getParent().toPath(), ["woot", "hello"]);
    });

    it("parent([]) -> []", function () {
      assert(new Place().getParent().isRoot());
    });
  });

  describe("#getOffset", function () {
    it("offset([a, b, c]) -> c", function () {
      var place = new Place(["woot", "hello", "hi"]);
      assert.equal(place.getOffset(), "hi");
    });

    it("offset([]) -> undefined", function () {
      assert.strictEqual(new Place().getOffset(), undefined);
    });
  });

  describe("#isEqualTo", function () {
    it("if places are of different depths, fail", function () {
      assert(!new Place([1, 2]).isEqualTo(new Place([])), "[1,2] <-> []");
      assert(!new Place([1, 2]).isEqualTo(new Place([1])), "[1,2] <-> [1]");
      assert(!new Place([1]).isEqualTo(new Place([1, 2])), "[1] <-> [1,2]");
      assert(!new Place().isEqualTo(new Place([1])), "[] <-> [1]");
    });

    it("if places are same, accept", function () {
      assert(new Place([]).isEqualTo(new Place([])), "[] <-> []");
      assert(new Place([1]).isEqualTo(new Place([1])), "[1] <-> [1]");
      assert(new Place([1, "woot"]).isEqualTo(new Place([1, "woot"])), 
             "[1, woot] <-> [1, woot]");
    });
  }); 

  describe("#isAncestorOf", function () {
    it("ancestor([a...], [a...]) -> false", function () {
      assert(!new Place([1]).isAncestorOf(new Place([1])), 
             "ancestor([1], [1])");
      assert(!new Place([1, 2, 3]).isAncestorOf(new Place([1, 2, 3])),
             "ancestor([1,2,3], [1,2,3])");
    });

    it("ancestor([], [...]) -> true", function () {
      assert(new Place().isAncestorOf(new Place([])), "ancestor([], [])");
      assert(new Place().isAncestorOf(new Place([1])), 
             "ancestor([], [1])");
      assert(new Place().isAncestorOf(new Place([1, 2, 3])), 
             "ancestor([], [1,2,3])");
    });

    it("ancestor([a...], [a..., b...]) -> true", function () {
      assert(new Place([1]).isAncestorOf(new Place([1, 2])), 
             "ancestor([1], [1,2])");
      assert(new Place([1,2]).isAncestorOf(new Place([1, 2, 3])), 
             "ancestor([1,2], [1,2,3])");
    });
    
    it("ancestor([a], ['a', b...]) -> false", function () {
      assert(!new Place(["1"]).isAncestorOf(new Place([1, 2])), 
             "ancestor(['1'], [1,2])");
    });

    it("ancestor([a, b], [a, c]) -> false", function () {
      assert(!new Place([1, 2]).isAncestorOf(new Place([1, 3])), 
             "ancestor([1,2], [1,3])");
    });
  });
  
  function assertBranchEmpty(branch, base) {
    assert.deepEqual(branch.getBase().toPath(), base);
    assert(!branch.getBranchOffset());
    assert(!branch.getBranch());
  }
  
  describe("#getSiblingBranchIn", function () {
    it("sibling([a,b],[b,c,d]) -> empty", function () {
      var branch = new Place([1,2]).getSiblingBranchIn(new Place([3,4,5]));
      assertBranchEmpty(branch, [3,4,5]);
    });
    
    it("sibling([a,b],[a,c,d...]) -> branch([a],c,[d...])", function () {
      var branch = new Place([1,2]).getSiblingBranchIn(new Place([1,3,5,6]));
      assert.deepEqual(branch.getBase().toPath(), [1]);
      assert.equal(branch.getBranchOffset(), 3);
      assert.deepEqual(branch.getBranch().toPath(), [5,6]);
    });
  });
  
  describe("#getChildBranchIn", function () {
    it("child([a,b],[b,c,d]) -> empty", function () {
      var branch = new Place([1,2]).getChildBranchIn(new Place([3,4,5]));
      assertBranchEmpty(branch, [3,4,5]);
    });
    
    it("child([a,b],[a,c,d]) -> empty", function () {
      var branch = new Place([1,2]).getChildBranchIn(new Place([1,4,5]));
      assertBranchEmpty(branch, [1,4,5]);
    });
    
    it("child([a,b],[a,b,d]) -> branch([a],b,[d]", function () {
      var branch = new Place([1,2]).getChildBranchIn(new Place([1,2,3]));
      assert.deepEqual(branch.getBase().toPath(), [1]);
      assert.equal(branch.getBranchOffset(), 2);
      assert.deepEqual(branch.getBranch().toPath(), [3]);
    });
  });
  
  describe("#hasValueAt", function () {
    it("hasvalue([], ...) -> true", function () {
      assert(new Place([]).hasValueAt({}), "{}");
      assert(new Place([]).hasValueAt("woot"), "'woot'");
      assert(new Place([]).hasValueAt(null), "null");
    });
    
    it("hasvalue([], undef) -> true", function () {
      assert(!new Place([]).hasValueAt(undefined), "undefined");
    });
  });
  
  describe("#getValueAt", function () {
    var value = { hello: "woot", other: { woot: "wootwoot" } };
    
    it("getvalue([], ...) -> ...", function () {
      assert.equal(new Place([]).getValueAt(value), value);
    });
    
    it("getvalue([a...], b...) -> b.a...", function () {
      assert.equal(new Place(["hello"]).getValueAt(value), value.hello);
      assert.equal(new Place(["other", "woot"]).getValueAt(value), 
                   value.other.woot);
    });
    
    it("getvalue([idx], 'str') -> 'str'[idx]", function () {
      assert.equal(new Place([3]).getValueAt("woot"), "t");
    });
  });
  
  describe("#concat", function () {
    it("concat([a], [b]) == [a,b]", function () {
      var place = new Place([1, 2, 4]);
      var child = new Place([place.getOffset()]);
      assert(place.isEqualTo(place.getParent().concat(child)));
    });
  });
  
  describe("#slice", function () {
    it("slice([a,b,c], 1) == [b,c]", function () {
      assert.deepEqual(new Place([1,2,3]).slice(1).toPath(), [2,3]);
    });
    
    it("slice([a,b,c], 0, 2) == [a,b]", function () {
      assert.deepEqual(new Place([1,2,3]).slice(0,2).toPath(), [1,2]);
    });
  });
  
  describe("#toPath", function () {
    it("path([...]) -> [...]", function () {
      assert.deepEqual(new Place([1, 2, 3]).toPath(), [1, 2, 3]);
      assert.deepEqual(new Place().toPath(), []);
    });
  });
});

describe("Branch", function () {
  describe("#getWithNewBranchOffset", function () {
    var dec = new Place([1,3,5,6]);
    var branch = new Place([1,2]).getSiblingBranchIn(dec);
    var newBranch = branch.getWithNewBranchOffset(3);
    assert.equal(newBranch.getBranchOffset(), 3);
  });
  
  describe("#toPlace", function () {
    it("toplace(sibling(..., [...])) -> [...]", function () {
      var dec = new Place([1,3,5,6]);
      var branch = new Place([1,2]).getSiblingBranchIn(dec);
      assert.deepEqual(branch.toPlace().toPath(), dec.toPath());
    });
  });
});
