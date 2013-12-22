"use strict";

/**
 * Abstract class representing a low-level system to connect to a remote server 
 * and perform live editing. This allows Electro to be largely agnostic to wire
 * formats and server implementations.
 *
 * @class Adapter
 */
class Adapter {
  getLatest(name) { throw "Method not implemented."; }
  getChangesets(name, from, to) { throw "Method not implemented."; }

  create(name, data) { throw "Method not implemented."; }
  commit(name, changeset) { throw "Method not implemented."; }
  remove(name) { throw "Method not implemented"; }

  subscribe(name, revision, listener) { throw "Method not implemented."; }
  unsubscribe(name) { throw "Method not implemented."; }
}

module.exports = Adapter;
