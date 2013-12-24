"use strict";

var _ = require("underscore");
var MessageType = require("../core/Message").MessageType;

function State(key, adapter, revision, strategy) {
  var StrategyType = strategy || Synced;
  this._strategy = new StrategyType(key, adapter, revision);
  
  // TODO: Figure out how to attach to the adapter and funnel messages from it.
  // TODO: Figure out how to funnel state change notifications from the
  //       various strategies down to fragments.
}

State.prototype = {
  getKey: function () { return this._strategy.getKey(); },
  getRevision: function () { return this._strategy.getRevision(); },
  
  commit: function (changeset) {
    this._strategy.commitClient(changeset);
  },
  
  handleMessage: function (message) {
    var data = message.getData();
    switch (message.getType()) {
      case MessageType.Ack:
        this._strategy = this._strategy.ack(data);
        break;
      case MessageType.CommitServer:
        this._strategy = this._strategy.commitClient(data);
        break;
    }
  }
};

function Strategy(key, adapter, revision) {
  this._key = key;
  this._adapter = adapter;
  this._revision = revision;
}

Strategy.prototype = {
  getKey: function () { return this._key; },
  getAdapter: function () { return this._adapter; },
  getRevision: function () { return this._revision; }
};

function Synced(key, adapter, revision) {
  Strategy.call(this, key, adapter, revision);
}

Synced.prototype = _.extend(Object.create(Strategy.prototype), {
  constructor: Synced,
  
  ack: function (data) {
    throw "Should receive ack while in synced state.";
  },
  
  commitServer: function (changeset) {
    var revision = changeset.apply(this._revision);
    return new Synced(this._key, this._adapter, revision);
  },
  
  commitClient: function (changeset) {
    this._adapter.commit(this._key, changeset);
    return new Awaiting(this._key, this._adapter, this._revision, changeset);
  }
});

function Awaiting(key, adapter, revision, unconfirmed) {
  this._unconfirmed = unconfirmed;
  Strategy.call(this, key, adapter, revision);
}

Awaiting.prototype = _.extend(Object.create(Strategy.prototype), {
  constructor: Awaiting,
  
  getRevision: function () { 
    return this._unconfirmed.apply(this._revision); 
  },
  
  ack: function (data) {
    var revision = this._unconfirmed.apply(this._revision);
    return new Synced(this._key, this._adapter, revision);
  },
  
  commitServer: function (changeset) {
    var revision = changeset.apply(this._revision);
    var unconfimed = changeset.transform(this._unconfirmed);
    return new Awaiting(this._key, this._adapter, revision, unconfimed);
  },
  
  commitClient: function (changeset) {
    return new AwaitingBuffer(this._key, this._adapter, this._revision, 
                              this._unconfirmed, changeset);
  }
});

function AwaitingBuffer(key, adapter, revision, unconfirmed, buffer) {
  this._unconfirmed = unconfirmed;
  this._buffer = buffer;
  Strategy.call(this, key, adapter, revision);
}

AwaitingBuffer.prototype = _.extend(Object.create(Strategy.prototype), {
  constructor: AwaitingBuffer,
  
  getRevision: function () {
    var unconfirmedRevision = this._unconfirmed.apply(this._revision);
    return this._buffer.apply(unconfirmedRevision);
  },
  
  ack: function (data) {
    var revision = this._unconfirmed.apply(this._revision);
    this._adapter.commit(this._key, this._buffer);
    return new Awaiting(this._key, this._adapter, revision, this._buffer);
  },
  
  commitServer: function (changeset) {
    var revision = changeset.apply(this._revision);
    var unconfirmed = changeset.transform(this._unconfirmed);
    var buffer = changeset.transform(this._buffer);
    return new AwaitingBuffer(this._key, this._adapter, revision, 
                              unconfirmed, buffer);
  },
  
  commitClient: function (changeset) {
    var buffer = this._buffer.concat(changeset);
    return new AwaitingBuffer(this._key, this._adapter, this._revision, 
                              this._unconfirmed, buffer);
  }
});

module.exports = {
  State: State,
  Synced: Synced,
  Awaiting: Awaiting,
  AwaitingBuffer: AwaitingBuffer
};
