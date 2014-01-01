"use strict";

var _ = require("underscore");

var offsetLeaf = { handlers: {}, children: {} };

function PlaceEventEmitter() {
  this._events = _.clone(offsetLeaf);
}

PlaceEventEmitter.prototype = {
  on: function (place, event, fn) {
    var ctx = this._events;

    for (var i = 0, len = place.getDepth(); i < len; i++) {
      var offset = place.getOffsetAt(i);
      if (_.isUndefined(ctx.children[offset]))
        ctx.children[offset] = _.clone(offsetLeaf);
      ctx = ctx.children[offset];
    }

    if (_.isUndefined(ctx.handlers[event]))
      ctx.handlers[event] = [];
    ctx.handlers[event].push(fn);

    return this;
  },

  emit: function (place, event) {
    var args = _.rest(arguments, 2);
    var ctx = this._events;
    var hadListeners = false;

    function emitForLeaf (leaf) {
      var handlers = leaf.handlers[event];
      _.each(handlers, function (handler) { handler.apply(null, args); });
      return handlers > 0;
    }

    for (var i = 0, len = place.getDepth(); i < len; i++) {
      hadListeners = hadListeners || emitForLeaf(ctx);

      var offset = place.getOffsetAt(i);
      if (_.isUndefined(ctx.children[offset])) return hadListeners;
      ctx = ctx.children[offset];
    }

    return hadListeners;
  }
};

module.exports = PlaceEventEmitter;
