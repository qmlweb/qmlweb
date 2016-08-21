class QSizeF extends QmlWeb.QObject {
  constructor(width, height) {
    super();
    const createProperty = QmlWeb.createProperty;
    createProperty("real", this, "width", { initialValue: width });
    createProperty("real", this, "height", { initialValue: height });
  }
}

QmlWeb.QSizeF = QSizeF;
