registerQmlType({
    module: 'QtQuick.Window',
    name: 'Screen',
    versions: /.*/,
    baseClass: 'QtQuick.Item',
    constructor: QMLScreen
});

function QMLScreen(meta) {
    callSuper(this, meta);
    var self = this;

    // TODO: rewrite as an attached object and forbid constructing

    createProperty("int", this, "desktopAvailableHeight");
    createProperty("int", this, "desktopAvailableWidth");
    createProperty("real", this, "devicePixelRatio");
    createProperty("int", this, "height");
    createProperty("string", this, "name");
    createProperty("enum", this, "orientation");
    createProperty("enum", this, "orientationUpdateMask");
    createProperty("real", this, "pixelDensity");
    createProperty("enum", this, "primaryOrientation");
    createProperty("int", this, "width");

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
