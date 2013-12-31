"use strict";

var _ = require("underscore");

var Place = require("../core/Place");
var Change = require("../core/Change");
var Changeset = require("../core/Changeset");
var Type = Change.Type;

/**
 * Represents a live slice of a document {@link State} inside a {@link Place}.
 * @param {State} state 
 * @param {Place} [slice] Place for the slice of the top-level document to make 
 *                        accessible here. Default is an empty {@link Place}.
 */
function Fragment(state, slice) {
  this._state = state;
  this._slice = slice || new Place();
}

Fragment.prototype = {
  /**
   * Returns the current document state in this fragment, including all 
   * unconfirmed and buffered commits that may not be on the server yet.
   * @return {Object}
   */
  getData: function () { 
    return this._state.getRevision().getData(); 
  },

  /**
   * Returns a new live-subfragment below the given {@link Place}.
   * @param  {Place}    slice
   * @return {Fragment}
   */
  getFragment: function (slice) {
    return new Fragment(this._state, this._slice.concat(slice));
  },
  
  /**
   * Returns the value of the data at the given Place.
   * @param  {Place} place
   * @return {Object}
   */
  get: function (place) {
    return this._slice.concat(place).getValueAt(this.getData());
  },
  
  /**
   * Commits a change to replace the existing value at the given {@link Place}
   * with the specified new value. Does not work on strings.
   * @param {Place} place
   * @param {*}     newValue
   */
  replace: function (place, newValue) {
    var resolved = this._slice.concat(place);
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
   * @param {Place} place
   * @param {*}     newValue
   */
  insert: function (place, newValue) {
    var resolved = this._slice.concat(place);
    var parentValue = resolved.getParent().getValueAt(this.getData());

    var TypeChange = Change.getParentTypeChange(parentValue);
    var change = new TypeChange(Type.Insert, resolved, [newValue]);
    this._state.commit(new Changeset(change));
  },

  /**
   * Commits a change to set the value at the given {@link Place} to the 
   * specified new value, using insert and replace as needed.
   * @param {Place} place
   * @param {*}     newValue
   */
  set: function (place, newValue) {
    var resolved = this._slice.concat(place);
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
   * @param  {Place}  place
   * @param  {number} [length] If removing inside a string, this specifies the
   *                           length of text to remove.
   */
  remove: function (place, length) {
    var resolved = this._slice.concat(place);
    var data = this.getData();
    var parentValue = resolved.getParent().getValueAt(data);
    var oldValue = resolved.getValueAt(data);

    if (typeof parentValue == "string")
      oldValue = parentValue.slice(resolved.getOffset(), length);

    var TypeChange = Change.getParentTypeChange(parentValue);
    var change = new TypeChange(Type.Remove, resolved, [oldValue]);
    this._state.commit(new Changeset(change));
  },

  /**
   * Commits a change to move the array item at the given {@link Place} to the
   * specified new index in the parent array.
   * @param {Place}  place
   * @param {number} newIndex
   */
  move: function (place, newIndex) {
    var resolved = this._slice.concat(place);
    var parentValue = resolved.getParent().getValueAt(this.getData());

    if (!parentValue instanceof Array)
      throw "Only works on arrays.";

    var change = new Change.ArrayChange(Type.Move, resolved, [newIndex]);
    this._state.commit(change);
  }
};

module.exports = Fragment;
