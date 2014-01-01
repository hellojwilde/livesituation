"use strict";

var _ = require("underscore");
var EventEmitter = require("events").EventEmitter;

function OffsetEventEmitter() {
  EventEmitter.call(this);
  this._children = {};
}

OffsetEventEmitter.prototype = _.extend({
  getChild: function (offset, shouldCreate) {
    if (!_.has(this._children, offset) && shouldCreate) {
      this._children[offset] = new OffsetEventEmitter();
    }
    return this._children[offset];
  }
}, EventEmitter.prototype);

function getPlaceEmitters(root, place, shouldCreate) {
  var ctx = root;
  var emitters = [root];
  for (var i = 0, len = place.getDepth(); i < len; i++) {
    ctx = ctx.getChild(place.getOffsetAt(i), shouldCreate);
    if (_.isUndefined(ctx)) break;
    emitters.push(ctx);
  }
  return emitters;
}

function getLastPlaceEmitter(root, place) {
  return _.last(getPlaceEmitters(root, place, true));
}

function PlaceEventEmitter() {
  this._events = new OffsetEventEmitter();
}

PlaceEventEmitter.prototype = {
  addListener: function (place, event, fn) {
    getLastPlaceEmitter(this._events, place).on(event, fn);
    return this;
  },

  on: function () { 
    return this.addListener.apply(this, arguments); 
  },

  once: function (place, event, fn) {
    getLastPlaceEmitter(this._events, place).once(event, fn);
    return this;
  },

  removeListener: function (place, event, fn) {
    getLastPlaceEmitter(this._events, place).removeListener(event, fn);
  },

  emit: function (place, event) {
    var args = _.rest(arguments, 1);
    var emitters = getPlaceEmitters(this._events, place);
    return _.some(emitters, function (emitter) {
      return emitter.emit.apply(emitter, args);
    });
  }
};

module.exports = PlaceEventEmitter;
