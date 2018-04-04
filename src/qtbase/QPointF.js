class QPointF extends QmlWeb.QObject {
  constructor(...args) {
    super();
    let data = args;
    if (args.length === 0) {
      data = [0, 0];
    } else if (args.length === 1 && typeof args[0] === "string") {
      data = args[0].split(",").map(x => parseFloat(x.trim()));
      if (data.length !== 2) throw new Error("point expected");
    } else if (args.length === 1 && args[0] instanceof QPointF) {
      data = [args[0].x, args[0].y];
    } else if (args.length !== 2) {
      throw new Error("Invalid arguments");
    }
    QmlWeb.createProperties(this, {
      x: { type: "real", initialValue: data[0] },
      y: { type: "real", initialValue: data[1] }
    });
  }
  toString() {
    return super.$toString(this.x, this.y);
  }

  static nonNullableType = true;
  static requireConstructor = true;
}

QmlWeb.QPointF = QPointF;
