QmlWeb.registerQmlType({
  module: "QtQuick.Window",
  name: "Screen",
  versions: /.*/,
  baseClass: "QtQuick.Item",
  properties: {
    name: "string",
    orientation: "enum",
    orientationUpdateMask: "enum",
    primaryOrientation: "enum",
    pixelDensity: "real",
    devicePixelRatio: "real",
    desktopAvailableHeight: "int",
    desktopAvailableWidth: "int",
    height: "int",
    width: "int"
  }
}, class {
  constructor(meta) {
    QmlWeb.callSuper(this, meta);

    // TODO: rewrite as an attached object and forbid constructing
    this.Component.completed.connect(this, this.Component$onCompleted);
  }
  Component$onCompleted() {
    const Qt = QmlWeb.Qt;
    this.desktopAvailableHeight = window.outerHeight;
    this.desktopAvailableWidth = window.outerWidth;
    this.devicePixelRatio = window.devicePixelRatio;
    this.height = window.innerHeight;
    this.name = this.name;
    this.orientation = Qt.PrimaryOrientation;
    this.orientationUpdateMask = 0;
    this.pixelDensity = 100.0;  // TODO
    this.primaryOrientation = Qt.PrimaryOrientation;
    this.width = window.innerWidth;
  }
});
