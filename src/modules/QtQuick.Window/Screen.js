QmlWeb.registerQmlType({
  module: "QtQuick.Window",
  name: "Screen",
  versions: /.*/,
  baseClass: "QtQml.QtObject"
}, class Screen {
  constructor(meta) {
    QmlWeb.callSuper(this, meta);
    throw new Error("Screen can only be used via the attached property.");
  }
  static getAttachedObject() {
    if (!Screen.$Screen) {
      const screen = Screen.$Screen = new QmlWeb.QObject();
      // TODO: read-only
      QmlWeb.createProperties(screen, {
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
      });
      screen.name = window.navigator.appName;
      screen.devicePixelRatio = window.devicePixelRatio;
      screen.pixelDensity = window.devicePixelRatio * 96 / 25.4; // per mm
      Screen.$populateScreen();
      window.addEventListener("resize", () => Screen.$populateScreen());

      // TODO: orientation
      const Qt = QmlWeb.Qt;
      screen.orientationUpdateMask = 0;
      screen.orientation = Qt.PrimaryOrientation;
      screen.primaryOrientation = Qt.PrimaryOrientation;
    }
    return Screen.$Screen;
  }
  static $populateScreen() {
    const screen = Screen.$Screen;
    screen.desktopAvailableHeight = window.outerHeight;
    screen.desktopAvailableWidth = window.outerWidth;
    screen.height = window.innerHeight;
    screen.width = window.innerWidth;
  }
});
