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
  /**
   * Returns the current document state in this fragment, including all 
   * unconfirmed and buffered commits that may not be on the server yet.
   * 
   * @return {Object}
   */
  getData: function () { 
    return this._state.getRevision().getData(); 
  },

  /**
   * Returns a new live-subfragment below the given {@link Place}.
   * 
   * @param  {Place}    parent
   * @return {View}
   */
  getSubview: function (parent) {
    return new View(this._state, this._parent.concat(parent));
  },
  
  /**
   * Returns the value of the data at the given Place.
   * 
   * @param  {Place} place
   * @return {Object}
   */
  get: function (place) {
    return this._parent.concat(place).getValueAt(this.getData());
  },
  
  /**
   * Commits a change to replace the existing value at the given {@link Place}
   * with the specified new value. Does not work on strings.
   * 
   * @param {Place} place
   * @param {*}     newValue
   */
  replace: function (place, newValue) {
    var resolved = this._parent.concat(place);
    var data = this.getData();
    var parentValue = resolved.getParent().getValueAt(data);
    var oldValue = resolved.getValueAt(data);
    
    if (typeof parentValue != "object")
     throw "Can't replace on non-object.";

    var TypeChange = Change.getParentTypeChange(parentValue);
    var change = new TypeChange(Type.Replace, resolved, [oldValue, newValue]);
    this._state.commit(new Changeset(change));
  },

  /**
   * Commits a change to insert a value at the given {@link Place} pointing to
   * a presently undefined value with valid container element.
   * 
   * @param {Place} place
   * @param {*}     newValue
   */
  insert: function (place, newValue) {
    var resolved = this._parent.concat(place);
    var parentValue = resolved.getParent().getValueAt(this.getData());

    var TypeChange = Change.getParentTypeChange(parentValue);
    var change = new TypeChange(Type.Insert, resolved, [newValue]);
    this._state.commit(new Changeset(change));
  },

  /**
   * Commits a change to set the value at the given {@link Place} to the 
   * specified new value, using insert and replace as needed.
   * 
   * @param {Place} place
   * @param {*}     newValue
   */
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

  /**
   * Commits a change to remove the content at the specified {@link Place}.
   * 
   * @param  {Place}  place
   * @param  {number} [length] If removing inside a string, this specifies the
   *                           length of text to remove.
   */
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

  /**
   * Commits a change to move the array item at the given {@link Place} to the
   * specified new index in the parent array.
   * 
   * @param {Place}  place
   * @param {number} newIndex
   */
  move: function (place, newIndex) {
    var resolved = this._parent.concat(place);
    var parentValue = resolved.getParent().getValueAt(this.getData());

    if (!parentValue instanceof Array)
      throw "Only works on arrays.";

    var change = new Change.ArrayChange(Type.Move, resolved, [newIndex]);
    this._state.commit(change);
  },

  commit: function () {

  }
};

module.exports = View;
