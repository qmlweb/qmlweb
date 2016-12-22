class QSizeF extends QmlWeb.QObject {
  constructor(width, height) {
    super();
    QmlWeb.createProperties(this, {
      width: { type: "real", initialValue: width },
      height: { type: "real", initialValue: height }
    });
  }
}

QmlWeb.QSizeF = QSizeF;
