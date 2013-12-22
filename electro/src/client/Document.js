"use strict";

var {Change} = require("../core/Change");
var Changeset = require("../core/Changeset");

class Document {
  constructor(state, prefix) {
    this._state = state;
    this._prefix = prefix || new Place();
  }

  get name() { return this._state.name; }
  get revision() { return this._state.revision; }
  get data () { return this._state.revision.data; }

  getFragment(place) { 
    return new Document(this._state, this._prefix.concat(place)); 
  }

  get(place) { return this._prefix.concat(place).getValueAt(this.data); }
  set(place, value) {
    var prefixed = this._prefix.concat(place);
    if (prefixed.hasValueAt(this.data)) {
      this.replace(prefixed, prefixed.getValueAt(this.data), value);
    } else {
      this.insert(prefixed, value);
    }
    return value;
  }

  insert(place, value) {
    var formatter = (prefixed, value) => ["insert", prefixed, value];
    this._applyChange(place, formatter, value);
  }

  replace(place, before, after) {
    var formatter = (prefixed, b, a) => ["replace", prefixed, b, a];
    this._applyChange(place, formatter, before, after);
  }

  move(place, to) {
    var formatter = (prefixed, to) => ["move", prefixed, to];
    this._applyChange(place, formatter, to);
  }

  remove(place, removal) {
    var formatter = (prefixed) => 
      ["remove", prefixed, removal || prefixed.getValueAt(this.data)];
    this._applyChange(place, formatter);
  }

  _applyChange(place, formatter, ...args) {
    var prefixed = this._prefix.concat(place);
    var $change = Change.getPlaceChangeConstructor(prefixed, this.data);
    this._state.commit(new $change(...formatter(prefixed, ...args)));
  }
}

module.exports = Document;
