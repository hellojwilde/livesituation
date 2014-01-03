"use strict";

var _ = require("underscore");

var Place = require("./Place");
var Change = require("./Change");
var Changeset = require("./Changeset");
var Revision = require("./Revision");

var MessageType = {
  Ack: "ack",
  Commit: "commit",
  CursorMove: "cursorMove"
};

function Message(type, body) {
  this._type = type;
  this._body = body;
}

Message.prototype = {
  getType: function () { return this._type; },
  getBody: function () { return this._body; }
};

var ObjectType = {
  Message: "message",
  Place: "place",
  Change: "change",
  Changeset: "changeset",
  Revision: "revision"
};

function getPackedWireObject(unpacked) {
  if (unpacked instanceof Message) {
    return {
      $wire: ObjectType.Message,
      type: unpacked.getType(),
      data: getPackedWireObject(unpacked.getBody())
    };
  } else if (unpacked instanceof Place) {
    return {
      $wire: ObjectType.Place,
      path: unpacked.getPath()
    };
  } else if (unpacked instanceof Change.Change) {
    return {
      $wire: ObjectType.Change,
      parentType: unpacked.getParentType(),
      type: unpacked.getType(),
      place: getPackedWireObject(unpacked.getPlace()),
      args: unpacked.getArgs()
    };
  } else if (unpacked instanceof Changeset) {
    return {
      $wire: ObjectType.Changeset,
      changes: _.map(unpacked.getChanges(), getPackedWireObject)
    };
  } else if (unpacked instanceof Revision) {
    return {
      $wire: ObjectType.Revision,
      sequenceId: unpacked.getSequenceId(),
      data: unpacked.getData()
    };
  } else {
    throw new Error("Invalid unpacked wire object passed.");
  }
}

function getUnpackedWireObject(packed) {
  switch (packed.$wire) {
    case ObjectType.Message:
      return new Message(packed.type, getUnpackedWireObject(packed.body));
    case ObjectType.Place:
      return new Place(packed.path);
    case ObjectType.Change:
      var TypeChange = Change.getParentNameTypeChange(packed.parentType);
      var place = getUnpackedWireObject(packed.place);
      return new TypeChange(packed.type, place, packed.args);
    case ObjectType.Changeset:
      var changes = _.map(packed.changes, getUnpackedWireObject);
      return new Changeset(changes);
    case ObjectType.Revision:
      return new Revision(packed.sequenceId, packed.data);
  }
}

var Wire = {
  MessageType: MessageType,
  Message: Message,

  ObjectType: ObjectType,
  pack: getPackedWireObject,
  unpack: getUnpackedWireObject
};

module.exports = Wire;