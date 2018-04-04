class QQuaternion extends QmlWeb.QObject {
  constructor(...args) {
    super();
    let data = args;
    if (args.length === 1 && typeof args[0] === "string") {
      data = args[0].split(",").map(x => parseFloat(x.trim()));
      if (data.length !== 4) data = [];
    } else if (args.length === 1 && args[0] instanceof QQuaternion) {
      data = [args[0].scalar, args[0].x, args[0].y, args[0].z];
    }
    if (data.length === 0) {
      data = [1, 0, 0, 0];
    } else if (data.length !== 4) {
      throw new Error("Invalid arguments");
    }
    QmlWeb.createProperties(this, {
      scalar: { type: "real", initialValue: data[0] },
      x: { type: "real", initialValue: data[1] },
      y: { type: "real", initialValue: data[2] },
      z: { type: "real", initialValue: data[3] }
    });
  }
  toString() {
    return super.$toString(this.scalar, this.x, this.y, this.z);
  }

  static nonNullableType = true;
  static requireConstructor = true;
}

QmlWeb.QQuaternion = QQuaternion;
