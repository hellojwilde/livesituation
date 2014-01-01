"use strict";

var _ = require("underscore");

var Place = require("../core/Place");
var Change = require("../core/Change");
var Changeset = require("../core/Changeset");
var Type = Change.Type;

/**
 * Represents a live view of a document {@link State} inside a {@link Place}.
 * Provides a simple, expressive API for manipulating documents without having
 * to manually modify {@link Change}, {@link Changeset}, and {@link Place}
 * instances manually.
 * 
 * @param {State} state 
 * @param {Place} [parent] Place for the parent of the top-level document to make 
 *                        accessible here. Default is an empty {@link Place}.
 */
function View(state, parent) {
  this._state = state;
  this._parent = parent || new Place();
}

View.prototype = {
  getData: function () {
    return this._state.getRevision().getData();
  },

  getSubview: function (parent) {
    return new View(this._state, this._parent.concat(parent));
  },

  get: function (place) {
    if (typeof place == "string") {
      place = new Place(place.split("."));
    }
    return this._parent.concat(place).getValueAt(this.getData());
  },

  on: function (event, fn) {
    try {
    this._state.on(this._parent, event, fn);
  } catch (e) { console.log(e);}
  },

  // TODO (jwilde): There's a lot of code replication here. Is there a way that
  //                that could be reduced and make everything easier to follow?
  
  replace: function (place, newValue) {
    if (typeof place == "string") {
      place = new Place(place.split("."));
    }

    var resolved = this._parent.concat(place);
    var data = this.getData();
    var parentValue = resolved.getParent().getValueAt(data);
    var oldValue = resolved.getValueAt(data);

    if (typeof parentValue != "object") {
     throw "Can't replace on non-object.";
   }

    var TypeChange = Change.getParentTypeChange(parentValue);
    var change = new TypeChange(Type.Replace, resolved, [oldValue, newValue]);
    this._state.commit(new Changeset([change]));
  },

  insert: function (place, newValue) {
    var resolved = this._parent.concat(place);
    var parentValue = resolved.getParent().getValueAt(this.getData());

    var TypeChange = Change.getParentTypeChange(parentValue);
    var change = new TypeChange(Type.Insert, resolved, [newValue]);
    this._state.commit(new Changeset(change));
  },

  set: function (place, newValue) {
    var resolved = this._parent.concat(place);
    var data = this.getData();
    var parentValue = resolved.getParent().getValueAt(data);
    var oldValue = resolved.getValueAt(data);

    if (typeof parentValue != "object")
      throw "Can't set on non-object.";

    return _.isUndefined(oldValue) ? this.insert(place, newValue)
                                   : this.replace(place, newValue);
  },

  remove: function (place, length) {
    var resolved = this._parent.concat(place);
    var data = this.getData();
    var parentValue = resolved.getParent().getValueAt(data);
    var oldValue = resolved.getValueAt(data);

    if (typeof parentValue == "string")
      oldValue = parentValue.parent(resolved.getOffset(), length);

    var TypeChange = Change.getParentTypeChange(parentValue);
    var change = new TypeChange(Type.Remove, resolved, [oldValue]);
    this._state.commit(new Changeset(change));
  },

  move: function (place, newIndex) {
    var resolved = this._parent.concat(place);
    var parentValue = resolved.getParent().getValueAt(this.getData());

    if (!parentValue instanceof Array)
      throw "Only works on arrays.";

    var change = new Change.ArrayChange(Type.Move, resolved, [newIndex]);
    this._state.commit(change);
  }
};

module.exports = View;
