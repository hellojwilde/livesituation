"use strict";

class Message {
  constructor(name, type, data) {
    this._name = name;
    this._type = type;
    this._data = data;
  }

  get name() { return this._name; }
  get type() { return this._type; }
  get data() { return this._data; }
}

module.exports = Message;
