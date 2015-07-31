registerQmlType({
    module: 'QtQuick',
    name: 'Screen',
    versions: /.*/,
    constructor: QMLScreen
});

function QMLScreen(meta) {
    QMLItem.call(this, meta);
    var self = this;

    var dom = this.dom;

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

    this.desktopAvailableHeight = dom.outerHeight;
    this.desktopAvailableWidth =  dom.outerWidth;
    this.devicePixelRatio = dom.devicePixelRatio;
    this.height = dom.innerHeight;
    this.name = "QMLScreen";
    this.orientation =  Qt.PrimaryOrientation;
    this.orientationUpdateMask =  0;
    this.pixelDensity = 100.0;  // TODO
    this.primaryOrientation =  Qt.PrimaryOrientation;
    this.width =  dom.innerWidth;
}
