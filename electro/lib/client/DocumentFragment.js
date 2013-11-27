"use strict";

class DocumentFragment {
  constructor(document, prefix) {
    this._document = document;
    this._prefix = prefix;
  }

  get(...args) { return this._callDocument("get", this, ...args); }
  set(...args) { return this._callDocument("set", this, ...args); }

  insert(...args)  { return this._callDocument("insert", this, ...args); }
  replace(...args) { return this._callDocument("replace", this, ...args); }
  move(...args)    { return this._callDocument("move", this, ...args); }
  remove(...args)  { return this._callDocument("remove", this, ...args); }

  _callDocument(method, place, ...args) {
    var prefixed = this._prefix.concat(place);
    return this._document[method](prefixed, ...args);
  }
}

module.exports = DocumentFragment;
