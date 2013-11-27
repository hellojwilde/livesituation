"use strict";

var Adapter = require("../client/Adapter");
var Transaction = require("../client/Transaction");
var Revision = require("../core/Revision");
var Changeset = require("../core/Changeset");
var Promise = require("promise");

class AppEngineAdapter extends Adapter {
  constructor(url, token) {
    this._url = url;
    this._token = token;
    this._subscriptions = {};
    this._connectToChannel();
  }

  create(name, data) {
    return this._request("put", name);
  }

  getLatest(name) {
    return this._request("get", name);
  }

  getChangesets(name, from, to) {
    var path = name + "?from=" + from + "&to=" + to;
    return this._request("get", path);
  }

  commit(name, changeset) {
    return this._request("put", name, changeset).then(
      (rsp) => new Transaction(rsp.id, changeset));
  }

  remove(name) {
    return this._request("delete", name);
  }

  subscribe(name, revision, listener) {
    if (this._subscriptions.hasOwnProperty(name))
      throw "There is already a bound subscriber for this document.";

    this._subscriptions[name] = listener;
    var path = name + "/subs";
    var data = { rev: revision.sequenceId };
    return this._request("post", path, data);
  }

  unsubscribe(name) { 
    if (!this._subscriptions.hasOwnProperty(name))
      throw "There is no bound subscriber for this document.";

    delete this._subscriptions[name];
    var path = name + "/subs/me";
    return this._request("delete", path, data);
  }

  _request(method, path, data) {
    return new Promise((resolve, reject) => {
      var req = new XMLHTTPRequest();
      req.open(method.toUpperCase(), this.url + path, true);
      req.addEventListener("load", 
        () => resolve(JSON.parse(req.responseText)), false);
      req.addEventListener("error", reject, false);
      req.send(data);
    });
  }

  _connectToChannel() {
    return new Promise((resolve, reject) => {
      var channel = new goog.appengine.Channel(this._token);
      this._socket = channel.open();
      this._socket.onopen = resolve;
      this._socket.onmessage = this._handleChannelMessage;
    }); 
  }

  _handleChannelMessage(message) {
    var json = JSON.decode(message.data);
    (this._subscriptions[json.name] || new Function())(json.update);
  }
}

module.exports = AppEngineAdapter;
