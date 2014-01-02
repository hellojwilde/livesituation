"use strict";

var assert = require("assert");

var Strategy = require("../../src/client/Strategy");
var Revision = require("../../src/core/Revision");
var Place = require("../../src/core/Place");
var Change = require("../../src/core/Change");
var Changeset = require("../../src/core/Changeset");
var MockAdapter = require("../../src/client/adapters/Mock");

var SyncedStrategy = Strategy.SyncedStrategy;
var AwaitingStrategy = Strategy.AwaitingStrategy;

describe("SyncedStrategy", function () {
  var adapterRef = new MockAdapter();
  var revisionRef = new Revision();
  var strategy = new SyncedStrategy("woot", adapterRef, revisionRef);

  var changeset = new Changeset([new Change.ObjectChange(
    Change.Type.Insert, new Place(["woot"]), ["there it is"])]);
  var applied = changeset.apply(revisionRef);

  describe("#ack", function () {
    it("should throw error", function () {
      assert.throws(function () { strategy.ack(); });
    });
  });

  describe("#commitServer", function () {
    it("should create new SyncedStrategy with change", function () {
      var newStrategy = strategy.commitServer(changeset);
      assert(newStrategy instanceof SyncedStrategy);
      assert.equal(newStrategy.getKey(), "woot");
      assert.equal(newStrategy.getAdapter(), adapterRef);
      assert(newStrategy.getRevision().isEqualTo(applied));
    });
  });

  describe("#commitClient", function () {
    it("should create new AwaitingStrategy", function () {
      var newStrategy = strategy.commitClient(changeset);
      assert(newStrategy instanceof AwaitingStrategy);
      assert.equal(newStrategy.getKey(), "woot");
      assert.equal(newStrategy.getAdapter(), adapterRef);
    });
  });

  it("commitClient(s).revision == commitServer(s).revision", function () {
    var serverStrategy = strategy.commitServer(changeset);
    var clientStrategy = strategy.commitClient(changeset);
    assert.deepEqual(serverStrategy.getRevision().getData(),
                     clientStrategy.getRevision().getData());
  });
});
