class QSizeF extends QmlWeb.QObject {
  constructor(...args) {
    super();
    let data = args;
    if (args.length === 0) {
      data = [-1, -1];
    } else if (args.length === 1 && typeof args[0] === "string") {
      data = args[0].split("x").map(x => parseFloat(x.trim()));
      if (data.length !== 2) throw new Error("size expected");
    } else if (args.length === 1 && args[0] instanceof QSizeF) {
      data = [args[0].width, args[0].height];
    } else if (args.length !== 2) {
      throw new Error("Invalid arguments");
    }
    QmlWeb.createProperties(this, {
      width: { type: "real", initialValue: data[0] },
      height: { type: "real", initialValue: data[1] }
    });
  }
  toString() {
    return super.$toString(this.width, this.height);
  }

  static nonNullableType = true;
  static requireConstructor = true;
}

QmlWeb.QSizeF = QSizeF;
