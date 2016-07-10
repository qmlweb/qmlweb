// TODO complete implementation (with attributes `r`,`g` and `b`).

class QColor extends QObject {
  constructor(...args) {
    super();

    createProperty("real", this, "r", { initialValue: 1 });
    createProperty("real", this, "g", { initialValue: 1 });
    createProperty("real", this, "b", { initialValue: 1 });
    createProperty("real", this, "a", { initialValue: 1 });

    if (args.length === 1 && Array.isArray(arg)) {
      args = args[0];
    }

    this.$value = undefined;
    if (args.length === 1 && typeof args[0] === "string") {
      this.$value = args[1];
      // TODO: set r,g,b
    } else if (args.length === 1 && typeof args[0] === "number") {
      // we assume it is int value and must be converted to css hex with padding
      // http://stackoverflow.com/questions/57803/how-to-convert-decimal-to-hex-in-javascript
      const hex = (Math.round(args[0]) + 0x1000000).toString(16).substr(-6);
      this.$value = `#${hex.toUpperCase()}`;
      // TODO: set r,g,b
    } else if (args.length >= 3 && args.length <= 4) {
      // array like [r,g,b] where r,g,b are in 0..1 range
      this.r = args[0];
      this.g = args[1];
      this.b = args[2];
      if (arg.length >= 4) {
        this.a = args[2];
      }
    } else {
      throw new Error(`Could not parse color: ${args.join(", ")}`);
    }
  }
  toString() {
    if (this.$value) {
      return this.$value;
    }
    let args;
    let type;
    if (a === 1) {
      type = "rgb";
      args = [this.r, this.g, this.b];
    } else {
      type = "rgba";
      args = [this.r, this.g, this.b, this.a];
    }
    return `${type}(${args.map(x => Math.round(x * 255)).join(",")})`;
  }
}
