/*global goog*/

"use strict";

var _ = require("underscore");
var Client = require("../Client");

Client.registerAdapter("appengine", {
  init: function (options) {
    this._channel = new goog.appengine.Channel(options.token);
    this._socket = this._channel.open();
  },
    
  uninit: function (options) {
    this._socket.close();
  },
    
  handleOpen: function () {
    
  },
    
  handleMessage: function (data) {
    
  }
});
