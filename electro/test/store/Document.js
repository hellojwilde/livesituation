"use strict";

var assert = require("assert");

var Changeset = require("../../src/core/Changeset");
var Change = require("../../src/core/Change");
var Place = require("../../src/core/Place");

var Document = require("../../src/store/Document");

describe("Document", function () {
  describe("#getSequenceId", function () {
    var doc = new Document();

    it("should register 0 as initial sequenceId", function () {
      assert.equal(doc.getSequenceId(), 0);
    });

    it("should increment on valid commit", function () {
      doc.commit(0, new Changeset());
      assert.equal(doc.getSequenceId(), 1);
    });
  });

  // TODO (jwilde): tests for #getLatest and #commit are mutually dependent. 
  //                Is there a way that we can split these out to be saner?

  describe("#getLatest", function () {
    var initialData = { woot: true };
    var doc = new Document(initialData);

    it("should include initial data", function () {
      assert.deepEqual(doc.getLatest().getData(), initialData);
    });

    it("should apply changes on commit", function () {
      var swap = new Change.ObjectChange(Change.Type.Replace, 
        new Place(["woot"]), [true, false]);
      var seqId = doc.getSequenceId();
      doc.commit(seqId, new Changeset([swap]));

      var latest = doc.getLatest();
      assert.equal(latest.getSequenceId(), seqId + 1);
      assert.deepEqual(latest.getData(), { woot: false });
    });
  });

  describe("#commit", function () {
    var initialData = { woot: "this is a string" };
    var doc = new Document(initialData);

    it("should throw on invalid sequenceId", function () {
      var seqId = doc.getSequenceId();
      assert.throws(function () { doc.commit(seqId + 1, swap); });
    });

    it("should properly relocate an insertion", function () {
      var insert1 = new Change.StringChange(Change.Type.Insert, 
        new Place(["woot", 10]), ["magic "]);
      var insert2 = new Change.StringChange(Change.Type.Insert,
        new Place(["woot", 16]), [", right?"]);

      var seqId = doc.getSequenceId();
      doc.commit(seqId, new Changeset([insert1]));
      doc.commit(seqId, new Changeset([insert2]));

      var latest = doc.getLatest();
      assert.deepEqual(latest.getData(), 
        { woot: "this is a magic string, right?"});
      assert.equal(latest.getSequenceId(), seqId + 2);
    });
  });
})