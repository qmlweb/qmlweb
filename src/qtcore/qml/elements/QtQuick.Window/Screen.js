registerQmlType({
    module: 'QtQuick.Window',
    name: 'Screen',
    versions: /.*/,
    baseClass: QMLItem,
    constructor: QMLScreen
});

function QMLScreen(meta) {
    QMLItem.call(this, meta);
    var self = this;

    // TODO: rewrite as an attached object and forbid constructing

    createProperty({ type: "int", object: this, name: "desktopAvailableHeight" });
    createProperty({ type: "int", object: this, name: "desktopAvailableWidth" });
    createProperty({ type: "real", object: this, name: "devicePixelRatio" });
    createProperty({ type: "int", object: this, name: "height" });
    createProperty({ type: "string", object: this, name: "name" });
    createProperty({ type: "enum", object: this, name: "orientation" });
    createProperty({ type: "enum", object: this, name: "orientationUpdateMask" });
    createProperty({ type: "real", object: this, name: "pixelDensity" });
    createProperty({ type: "enum", object: this, name: "primaryOrientation" });
    createProperty({ type: "int", object: this, name: "width" });

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
