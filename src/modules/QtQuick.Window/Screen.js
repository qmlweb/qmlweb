// eslint-disable-next-line no-undef
class QtQuick_Window_Screen extends QtQml_QtObject {
  constructor(meta) {
    super(meta);
    throw new Error("Screen can only be used via the attached property.");
  }
  static getAttachedObject() {
    if (!QtQuick_Window_Screen.$Screen) {
      const screen = QtQuick_Window_Screen.$Screen = new QmlWeb.QObject();
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
      QtQuick_Window_Screen.$populateScreen();
      window.addEventListener("resize", () =>
        QtQuick_Window_Screen.$populateScreen()
      );

      // TODO: orientation
      const Qt = QmlWeb.Qt;
      screen.orientationUpdateMask = 0;
      screen.orientation = Qt.PrimaryOrientation;
      screen.primaryOrientation = Qt.PrimaryOrientation;
    }
    return QtQuick_Window_Screen.$Screen;
  }
  static $populateScreen() {
    const screen = QtQuick_Window_Screen.$Screen;
    screen.desktopAvailableHeight = window.outerHeight;
    screen.desktopAvailableWidth = window.outerWidth;
    screen.height = window.innerHeight;
    screen.width = window.innerWidth;
  }
}
