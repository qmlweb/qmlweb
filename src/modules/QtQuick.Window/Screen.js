registerQmlType({
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
    callSuper(this, meta);
    var self = this;

    // TODO: rewrite as an attached object and forbid constructing

    this.Component.completed.connect(this, updateSC);

    function updateSC() {
        self.desktopAvailableHeight = window.outerHeight;
        self.desktopAvailableWidth = window.outerWidth;
        self.devicePixelRatio = window.devicePixelRatio;
        self.height = window.innerHeight;
        self.name = this.name;
        self.orientation =  Qt.PrimaryOrientation;
        self.orientationUpdateMask = 0;
        self.pixelDensity = 100.0;  // TODO
        self.primaryOrientation =  Qt.PrimaryOrientation;
        self.width = window.innerWidth;
    }
  }
});
