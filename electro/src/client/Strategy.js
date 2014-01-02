"use strict";

var _ = require("underscore");

function Strategy(key, adapter, revision) {
  this._key = key;
  this._adapter = adapter;
  this._revision = revision;
}

Strategy.prototype = {
  getKey: function () { return this._key; },
  getAdapter: function () { return this._adapter; },
  getRevision: function () { return this._revision; },

  isEqualTo: function (other) {
    return this._key == other.getKey() &&
           this._adapter == other.getAdapter() &&
           this.getRevision().isEqualTo(other.getRevision());
  }
};

function SyncedStrategy(key, adapter, revision) {
  Strategy.call(this, key, adapter, revision);
}

SyncedStrategy.prototype = _.extend(new Strategy(), {
  constructor: SyncedStrategy,
  
  ack: function (data) {
    throw "Should not receive ack while in SyncedStrategy state.";
  },
  
  commitServer: function (changeset) {
    var revision = changeset.apply(this._revision);
    return new SyncedStrategy(this._key, this._adapter, revision);
  },
  
  commitClient: function (changeset) {
    var baseSequenceId = this._revision.getSequenceId();
    this._adapter.commit(this._key, baseSequenceId, changeset);
    return new AwaitingStrategy(this._key, this._adapter, this._revision, 
                                changeset);
  }
});

function AwaitingStrategy(key, adapter, revision, unconfirmed) {
  Strategy.call(this, key, adapter, revision);
  this._unconfirmed = unconfirmed;
}

AwaitingStrategy.prototype = _.extend(new Strategy(), {
  constructor: AwaitingStrategy,

  getUnconfirmed: function () { return this._unconfirmed; },
  getRevision: function () { 
    return this._unconfirmed.apply(this._revision); 
  },

  isEqualTo: function (other) {
    return Strategy.prototype.isEqualTo.call(this, other) &&
           this._unconfirmed.isEqualTo(other.getUnconfirmed());
  },
  
  ack: function (data) {
    var revision = this._unconfirmed.apply(this._revision);
    return new SyncedStrategy(this._key, this._adapter, revision);
  },
  
  commitServer: function (changeset) {
    var revision = changeset.apply(this._revision);
    var unconfimed = changeset.transform(this._unconfirmed);
    return new AwaitingStrategy(this._key, this._adapter, revision, unconfimed);
  },
  
  commitClient: function (changeset) {
    return new AwaitingBufferStrategy(this._key, this._adapter, this._revision, 
                                      this._unconfirmed, changeset);
  }
});

function AwaitingBufferStrategy(key, adapter, revision, unconfirmed, buffer) {
  AwaitingStrategy.call(this, key, adapter, revision, unconfirmed);
  this._buffer = buffer;
}

AwaitingBufferStrategy.prototype = _.extend(new AwaitingStrategy(), {
  constructor: AwaitingBufferStrategy,
  
  getBuffer: function () { return this._buffer; },
  getRevision: function () {
    var awaitingRevision = AwaitingStrategy.prototype.getRevision.call(this);
    return this._buffer.apply(awaitingRevision);
  },

  isEqualTo: function (other) {
    return AwaitingStrategy.prototype.isEqualTo.call(this, other) &&
           this._buffer.isEqualTo(other.getBuffer());
  },
  
  ack: function (data) {
    var revision = this.getUnconfirmed().apply(this._revision);
    var baseSequenceId = revision.getSequenceId();
    this._adapter.commit(this._key, baseSequenceId, this._buffer);
    return new AwaitingStrategy(this._key, this._adapter, revision, 
                                this._buffer);
  },
  
  commitServer: function (changeset) {
    var revision = changeset.apply(this._revision);
    var unconfirmed = changeset.transform(this.getUnconfirmed());
    var buffer = changeset.transform(this._buffer);
    return new AwaitingBufferStrategy(this._key, this._adapter, revision, 
                                      unconfirmed, buffer);
  },
  
  commitClient: function (changeset) {
    var buffer = this._buffer.concat(changeset);
    return new AwaitingBufferStrategy(this._key, this._adapter, this._revision, 
                                      this.getUnconfirmed(), buffer);
  }
});

module.exports = {
  Strategy: Strategy,
  SyncedStrategy: SyncedStrategy,
  AwaitingStrategy: AwaitingStrategy,
  AwaitingBufferStrategy: AwaitingBufferStrategy
};
