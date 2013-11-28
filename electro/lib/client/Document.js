"use strict";

var {Change, ArrayChange, ObjectChange, StringChange} = require("../core/Change");
var Changeset = require("../core/Changeset");

function getTypeChangeConstructor(place, data) {
  var parent = place.parent.getValueAt(data);
  var constructor = null;

  if (typeof parent == "string") {
    constructor = StringChange;
  } else if (Array.isArray(parent)) {
    constructor = ArrayChange;
  } else if (typeof parent == "object") {
    constructor = ObjectChange;
  }

  return constructor;
}

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
    var TypeChange = getTypeChangeConstructor(prefixed, this.data);
    this._state.commit(new TypeChange("insert", prefixed, value));
  }

  replace(place, before, after) {
    var prefixed = this._prefix.concat(place);
    var TypeChange = getTypeChangeConstructor(prefixed, this.data);
    this._state.commit(new TypeChange("replace", prefixed, before, after));
  }

  move(place, to) {
    var prefixed = this._prefix.concat(place);
    var TypeChange = getTypeChangeConstructor(prefixed, this.data);
    this._state.commit(new TypeChange("move", prefixed, to));
  }

  remove(place) {
    var prefixed = this._prefix.concat(place);
    var TypeChange = getTypeChangeConstructor(prefixed, this.data);
    var existing = prefixed.getValueAt(this.data);
    this._state.commit(new TypeChange("remove", prefixed, existing));
  }
}

module.exports = Document;
