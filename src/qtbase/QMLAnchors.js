class QMLAnchors extends QmlWeb.QObject {
  constructor(parent) {
    super(parent);
    QmlWeb.createProperties(this, {
      left: "var",
      right: "var",
      top: "var",
      bottom: "var",
      horizontalCenter: "var",
      verticalCenter: "var",
      fill: "Item",
      centerIn: "Item",
      margins: "real",
      leftMargin: "real",
      rightMargin: "real",
      topMargin: "real",
      bottomMargin: "real"
    });
    this.leftChanged.connect(parent, parent.$updateHGeometry);
    this.rightChanged.connect(parent, parent.$updateHGeometry);
    this.topChanged.connect(parent, parent.$updateVGeometry);
    this.bottomChanged.connect(parent, parent.$updateVGeometry);
    this.horizontalCenterChanged.connect(parent, parent.$updateHGeometry);
    this.verticalCenterChanged.connect(parent, parent.$updateVGeometry);
    this.fillChanged.connect(parent, parent.$updateHGeometry);
    this.fillChanged.connect(parent, parent.$updateVGeometry);
    this.centerInChanged.connect(parent, parent.$updateHGeometry);
    this.centerInChanged.connect(parent, parent.$updateVGeometry);
    this.leftMarginChanged.connect(parent, parent.$updateHGeometry);
    this.rightMarginChanged.connect(parent, parent.$updateHGeometry);
    this.topMarginChanged.connect(parent, parent.$updateVGeometry);
    this.bottomMarginChanged.connect(parent, parent.$updateVGeometry);
    this.marginsChanged.connect(parent, parent.$updateHGeometry);
    this.marginsChanged.connect(parent, parent.$updateVGeometry);
  }
}

QmlWeb.QMLAnchors = QMLAnchors;
