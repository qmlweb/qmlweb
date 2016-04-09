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

    createSimpleProperty("int", this, "desktopAvailableHeight");
    createSimpleProperty("int", this, "desktopAvailableWidth");
    createSimpleProperty("real", this, "devicePixelRatio");
    createSimpleProperty("int", this, "height");
    createSimpleProperty("string", this, "name");
    createSimpleProperty("enum", this, "orientation");
    createSimpleProperty("enum", this, "orientationUpdateMask");
    createSimpleProperty("real", this, "pixelDensity");
    createSimpleProperty("enum", this, "primaryOrientation");
    createSimpleProperty("int", this, "width");

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
