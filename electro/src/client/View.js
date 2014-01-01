"use strict";

var _ = require("underscore");
var Diff = require("diff");

var Place = require("../core/Place");
var Change = require("../core/Change");
var Changeset = require("../core/Changeset");
var Type = Change.Type;
var StringChange = Change.StringChange;

function getChangesetForData(data, parent, type, place, newValueOrLength){
  var resolved = parent.concat(Place.normalize(place));
  var parentValue = resolved.getParent().getValueAt(data);
  var existingValue = resolved.getValueAt(data);

  if (!_.contains(["object", "string"], typeof parentValue))
    throw "Can't modify non-collection parent.";

  var args = null;
  switch (type) {
    case Type.Insert:
    case Type.Move:
      args = [newValueOrLength];
      break;
    case Type.Replace:
      args = [existingValue, newValueOrLength];
      break;
    case Type.Remove:
      if (typeof parentValue == "string") {
        args = [parentValue.slice(resolved.getOffset(), newValueOrLength)];
      } else {
        args = [existingValue];
      }
      break;
  }

  var TypeChange = Change.getParentTypeChange(parentValue);
  return new Changeset([new TypeChange(type, resolved, args)]);
}

function getChangesetForStrings(parent, existingValue, newValue) {
  var diff = Diff.diffChars(existingValue, newValue);
  var cursor = 0, changes = [];
  _.each(diff, function (block) {
    if (block.added || block.removed) {
      var type = (block.added) ? Type.Insert : Type.Remove;
      var place = parent.concat(new Place([cursor]));
      var change = new StringChange(type, place, [block.value]);
      changes.push(change);
    }

    if (!block.removed) cursor += block.value.length;
  });

  return new Changeset(changes);
}

function View(state, parent) {
  this._state = state;
  this._parent = parent || new Place();
}

View.prototype = {
  getData: function () {
    return this._state.getRevision().getData();
  },

  getView: function (parent) {
    var resolved = this._parent.concat(Place.normalize(parent));
    return new View(this._state, resolved);
  },

  get: function (place) {
    var resolved = this._parent.concat(Place.normalize(place));
    return resolved.getValueAt(this.getData());
  },

  set: function (place, newValue) {
    var resolved = this._parent.concat(Place.normalize(place));
    var existingValue = resolved.getValueAt(this.getData());

    if (typeof newValue == "string" && typeof existingValue == "string") {
      var changeset = getChangesetForStrings(resolved, existingValue, newValue);
      this._state.commit(changeset);
      return this;
    }

    var method = _.isUndefined(existingValue) ? this.insert : this.replace;
    return method.apply(this, arguments);
  },

  on: function (event, fn) {
    this._state.on(this._parent, event, fn);
  }
};

_.each(Type, function (name) {
  View.prototype[name] = function (place, newValueOrLength) {
    var args = [this.getData(), this._parent, name, place, newValueOrLength];
    var changeset = getChangesetForData.apply(null, args);
    this._state.commit(changeset);
    return this;
  };
});

module.exports = View;
