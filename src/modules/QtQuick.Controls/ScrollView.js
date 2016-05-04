function QMLScrollView(meta) {
    callSuper(this, meta);

    var self = this;

    this.css.pointerEvents = "auto";
    this.setupFocusOnDom(this.dom);

    createProperty("Item", this, "contentItem");
    this.$defaultProperty = "contentItem";
    createProperty("Item", this, "flickableItem"); //TODO  0) implement it  1) make it read-only
    createProperty("Item", this, "viewport"); //TODO
    createProperty("bool", this, "frameVisible");
    createProperty("bool", this, "highlightOnFocus"); //TODO test
    createProperty("enum", this, "verticalScrollBarPolicy");
    createProperty("enum", this, "horizontalScrollBarPolicy");
    createProperty("Component", this, "style"); //TODO

    this.contentItemChanged.connect(this, function(newItem){
        if (typeof newItem !== undefined) {
            newItem.parent = self;
        }
    });
    this.flickableItemChanged.connect(this, function(newItem) {
    });
    this.viewportChanged.connect(this, function(newViewport) {
    });
    this.frameVisibleChanged.connect(this, function(visible) {
        this.css.border= visible ? "1px solid gray" : "hidden";
    });
    this.highlightOnFocusChanged.connect(this, function(highlight) {
    });

    this.horizontalScrollBarPolicyChanged.connect(this, function(newPolicy) {
        this.css.overflowX = this.scrollBarPolicyToCssOverflow(newPolicy);
    });
    this.verticalScrollBarPolicyChanged.connect(this, function(newPolicy) {
        this.css.overflowY = this.scrollBarPolicyToCssOverflow(newPolicy);
    });

    this.styleChanged.connect(this, function(newStyle){});

    ////
    this.childrenChanged.connect(this, function(){
       if (typeof self.contentItem == undefined && self.children.length == 1) {
           self.contentItem = self.children[0];
       }
    });
    this.focusChanged.connect(this, function(focus){
        this.css.outline = self.highlight && focus ? "outline: lightblue solid 2px;" : "";
    });

    this.width = this.implicitWidth = 240; // default QML ScrollView width
    this.height = this.implicitHeight = 150; // default QML ScrollView height
    this.width = this.implicitWidth;
    this.height = this.implicitHeight;

    this.contentItem = undefined;
    this.flickableItem = undefined;
    this.viewport = undefined;
    this.frameVisible = false;
    this.highlightOnFocus = false;
    this.verticalScrollBarPolicy = Qt.ScrollBarAsNeeded;
    this.horizontalScrollBarPolicy = Qt.ScrollBarAsNeeded;
    this.style = undefined;
}

QMLScrollView.prototype.scrollBarPolicyToCssOverflow = function(policy) {
    switch (newPolicy) {
        case Qt.ScrollBarAsNeeded:
            return 'auto';
        case Qt.ScrollBarAlwaysOff:
            return 'hidden';
        case Qt.ScrollBarAlwaysOn:
            return 'scroll';
    }
    return 'auto';
};

registerQmlType({
  module:   'QtQuick.Controls',
  name:     'ScrollView',
  versions: /.*/,
  baseClass: 'QtQuick.Item',
  constructor: QMLScrollView
});
