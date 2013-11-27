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
  constructor(name, adapter, revision) {
    this._name = name;
    this._adapter = adapter;
    this._state = new SynchronizedState(revision);
  }

  get name() { return this._name; }
  get revision() { return this._state.revision; }
  get data () { return this._state.revision.data; }

  get(place) { return place.getValueAt(this._revision.data); }
  set(place, value) {
    if (place.hasValueAt(this.data)) {
      this.replace(place, place.getValueAt(this.data), value);
    } else {
      this.insert(place, value);
    }
    return value;
  }

  insert(place, value) {
    var TypeChange = getTypeChangeConstructor(place, this.data);
    this._commit(new TypeChange("insert", place, value));
  }

  replace(place, before, after) {
    var TypeChange = getTypeChangeConstructor(place, this.data);
    this._commit(new TypeChange("insert", place, before, after));
  }

  move(place, to) {
    var TypeChange = getTypeChangeConstructor(place, this.data);
    this._commit(new TypeChange("move", place, to));
  }

  remove(place) {
    var TypeChange = getTypeChangeConstructor(place, this.data);
    var existing = place.getValueAt(this.data);
    this._commit(new TypeChange("remove", place, existing));
  }

  _commit(changes) {
    if (changes instanceof Change)
      return this.commit(Changeset.fromRevision(this.revision, [changes]));
    this._callState("commit", changes);
  }

  _receiveTransaction(transaction) {
    
  }

  _callState(method, ...args) {
    var newState = this._state[method](...args);
    if (this._state != newState) this._state = newState;
  }
}

module.exports = Document;
