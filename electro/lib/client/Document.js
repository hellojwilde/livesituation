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

  get(place) { 
    return this._prefix.concat(place).getValueAt(this.data); 
  }

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
    var prefixed = this._prefix.concat(place);
    var $change = Change.getPlaceChangeConstructor(prefixed, this.data);
    this._state.commit(new $change("insert", prefixed, value));
  }

  replace(place, before, after) {
    var prefixed = this._prefix.concat(place);
    var $change = Change.getPlaceChangeConstructor(prefixed, this.data);
    this._state.commit(new $change("replace", prefixed, before, after));
  }

  move(place, to) {
    var prefixed = this._prefix.concat(place);
    var $change = Change.getPlaceChangeConstructor(prefixed, this.data);
    this._state.commit(new $change("move", prefixed, to));
  }

  remove(place) {
    var prefixed = this._prefix.concat(place);
    var $change = Change.getPlaceChangeConstructor(prefixed, this.data);
    var existing = prefixed.getValueAt(this.data);
    this._state.commit(new $change("remove", prefixed, existing));
  }
}

module.exports = Document;
