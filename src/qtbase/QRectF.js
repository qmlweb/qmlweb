class QRectF extends QmlWeb.QObject {
  constructor(...args) {
    super();
    let data = args;
    if (args.length === 0) {
      data = [0, 0, 0, 0];
    } else if (args.length === 1 && typeof args[0] === "string") {
      const mask = /^\s*[-\d.]+\s*,\s*[-\d.]+\s*,\s*[-\d.]+\s*x\s*[-\d.]+\s*$/;
      if (!args[0].match(mask)) throw new Error("rect expected");
      data = args[0].replace("x", ",").split(",")
                    .map(x => parseFloat(x.trim()));
    } else if (args.length === 1 && args[0] instanceof QRectF) {
      data = [args[0].x, args[0].y, args[0].z, args[0].width];
    } else if (args.length !== 4) {
      throw new Error("Invalid arguments");
    }
    QmlWeb.createProperties(this, {
      x: { type: "real", initialValue: data[0] },
      y: { type: "real", initialValue: data[1] },
      width: { type: "real", initialValue: data[2] },
      height: { type: "real", initialValue: data[3] }
    });
  }
  toString() {
    return super.$toString(this.x, this.y, this.width, this.height);
  }

  static nonNullableType = true;
  static requireConstructor = true;
}

QmlWeb.QRectF = QRectF;
