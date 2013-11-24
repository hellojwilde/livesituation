var {Place} = require("./place");

class Change {
  constructor(op, place, ...args) {
    this._op = op;
    this._place = place;
    this._args = args;
  }

  get op() { return this._op; }
  get place() { return this._place; }
  get args() { return this._args; }

  get type() { throw new Error("Change.getType: not implemented."); }
  get inverted() { throw new Error("Change.getInverted: not implemented."); }

  relocate(toRelocate) { 
    throw new Error("Change.relocate: not implemented."); 
  }

  mutate(toMutate) { 
    throw new Error("Change.mutate: not implemented."); 
  }

  transform(toTransform) {
    var relocated = this.relocate(toTransform.place);
    var constr = toTransform.constructor;
    return new constr(toTransform.op, relocated, ...toTransform.args);
  }
}

class StringChange extends Change {
  get type() { return "string"; }
  get inverted() {
    var op = (this.op == "insert") ? "remove" : "insert";
    return new StringChange(op, this.place, ...this.args)
  }

  relocate(toRelocate) {
    var [union, branch] = this.place.getBranch(toRelocate);
    if (!union) return toRelocate;
    if (union > this.place.offset) {
      var [str] = this.args;
      union += (this.op == "remove" ? -1 : 1) * str.length;
    }
    return this.place.parent.concat(new Place([union]), branch);
  }
}
exports.StringChange = StringChange;

class ArrayChange extends Change {
  get type() { return "array"; }
  get inverted() {
    var op = this.op, place = this.place, args = this.args;
    switch (this.op) {
      case "insert":
      case "remove":
        op = (this.op == "insert") ? "remove" : "insert";
        break;
      case "replace":
        var [before, after] = this.args;
        args = [after, before];
        break;
      case "move":
        args = [this.place.offset];
        place = this.place.parent.concat(new Place([this.args[0]]));
        break;
    }
    return new ArrayChange(op, place, ...args);
  }

  relocate(toRelocate) {
    var [union, branch] = this.place.getBranch(toRelocate);
    if (!union) return toRelocate;
    switch (this.op) {
      case "insert":
      case "remove":
        if (union > this.path.offset) {
          union += (this.op == "remove" ? -1 : 1);
        }
        break;
      case "replace":
        return null;
        break;
      case "move":
        var [newOffset] = this.args, offset = this.place.offset;
        if (newOffset > offset && union > offset && union <= newOffset) union--;
        if (newOffset < offset && union > newOffset && union <= offset) union++;
        break;
    }
    return this.place.parent.concat(new Place(union), branch);
  }
}
exports.ArrayChange = ArrayChange;

class ObjectChange extends Change {
  get type() { return "object"; }
  get inverted() {
    var op = this.op, args = this.args;
    switch (this.op) {
      case "insert":
      case "remove":
        op = (this.op == "insert") ? "remove" : "insert";
        break;
      case "replace":
        var [before, after] = this.args;
        args = [after, before];
        break;
    }
    return new ObjectChange(op, this.place, ...args);
  }

  relocate(toRelocate) {
    if (this.place.isAncestorOf(toRelocate)) return null;
  }
}
exports.ObjectChange = ObjectChange;
