"use strict";

var {Change} = require("../core/Changeset");
var Changeset = require("../core/Changeset");
var Revision = require("../core/Revision");
var Adapter = require("../client/Adapter");
var Message = require("../client/Message");
var Q = require("q");

var Marshalling = {
  getChange: function ([type, ...args]) {
    return Change.getTypeChangeConstructor(type)(...args);
  },

  getChangeset: function (obj) {
    return new Changeset(obj.baseSequenceId, obj.changes.map(this.getChange));
  },

  getRevision: function (obj) {
    return new Revision(obj.id, this.getChangeset(obj.changeset));
  },

  getChangesets: function (obj) {
    return obj.map(this.getChangeset);
  },

  getMessage: function (obj) {
    return new Message(obj.name, obj.type, obj.data);
  }
};

class AppEngineAdapter extends Adapter {
  constructor(url, token) {
    this._url = url;
    this._token = token;
    this._subscriptions = {};
    this._connect();
  }

  create(name, data) { 
    return this._request("put", name, data); 
  }

  getLatest(name) { 
    return this._request("get", name).then(Marshalling.getRevision);
  }

  getChangesets(name, from, to) {
    var path = name + "?from=" + from + "&to=" + to;
    return this._request("get", path).then(Marshalling.getChangesets);
  }

  commit(name, changeset) {
    return this._request("put", name, changeset).then((obj) => obj.id);
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
    var deferred = Q.defer();
    var req = new XMLHTTPRequest();

    req.open(method.toUpperCase(), this.url + path, true);
    req.addEventListener("load", () => {
      if (req.status != 200) {
        deferred.reject(request.status);
      } else {
        deferred.resolve(JSON.parse(req.responseText));
      }
    }, false);
    req.addEventListener("error", () => deferred.reject(), false);

    req.send(data);
    return deferred.promise;
  }

  _connect() {
    return new Promise((resolve, reject) => {
      var channel = new goog.appengine.Channel(this._token);
      this._socket = channel.open();
      this._socket.onopen = resolve;
      this._socket.onmessage = this._handleMessage;
    }); 
  }

  _handleMessage(channelMessage) {
    var message = Marshalling.getMessage(JSON.decode(channelMessage.data));
    (this._subscriptions[message.name] || new Function())(message);
  }
}

module.exports = AppEngineAdapter;
