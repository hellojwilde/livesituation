/**
 * Emitter for events sandboxed to a specific branch in a Place hierarchy.
 * Listeners and events are bound to instances of Place. For an event fired on 
 * a given Place, listeners will be fired on that Place and all parents through 
 * the root Place instance.
 * 
 * @module core/PlaceEventEmitter
 */

"use strict";

var _ = require("underscore");
var EventEmitter = require("events").EventEmitter;

/**
 * Extension of EventEmitter that represents an offset in a Place heirarchy.
 * Stores references to all child nodes in the heirarchy.  
 * 
 * @constructor
 * @internal
 */
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
  },

  getPlaceEmitters: function (place, shouldCreate) {
    var ctx = this;
    var emitters = [this];
    for (var i = 0, len = place.getDepth(); i < len; i++) {
      ctx = ctx.getChild(place.getOffsetAt(i), shouldCreate);
      if (_.isUndefined(ctx)) break;
      emitters.push(ctx);
    }
    return emitters;
  },

  getLastPlaceEmitter: function (place) {
    return _.last(this.getPlaceEmitters(place, true));
  }
}, EventEmitter.prototype);

/**
 * Wrapper around OffsetEventEmitter to allow for listening and firing on 
 * instances of Place. Not an extension of EventEmitter, so not all of the
 * original methods are necessarily supported.
 *
 * @constructor
 */
function PlaceEventEmitter() {
  this._root = new OffsetEventEmitter();
}

PlaceEventEmitter.prototype = {
  addListener: function (place, event, fn) {
    this._root.getLastPlaceEmitter(place).on(event, fn);
    return this;
  },

  on: function () { 
    return this.addListener.apply(this, arguments); 
  },

  once: function (place, event, fn) {
    this._root.getLastPlaceEmitter(place).once(event, fn);
    return this;
  },

  removeListener: function (place, event, fn) {
    this._root.getLastPlaceEmitter(place).removeListener(event, fn);
  },

  emit: function (place, event) {
    var args = _.rest(arguments, 1);
    var emitters = this._root.getPlaceEmitters(place);
    return _.some(emitters, function (emitter) {
      return emitter.emit.apply(emitter, args);
    });
  }
};

module.exports = PlaceEventEmitter;
