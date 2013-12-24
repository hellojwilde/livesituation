"use strict";

var Type = {
  Ack: "ack",
  CommitServer: "commitServer",
  CommitClient: "commitClient"
};

function Message(type, data) {
  this._type = type;
  this._data = data;
}

Message.prototype = {
  getType: function() { return this._type; },
  getData: function() { return this._data; }
};

module.exports = {
  MessageType: Type,
  Message: Message
};
