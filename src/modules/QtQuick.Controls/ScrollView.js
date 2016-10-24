QmlWeb.registerQmlType({
  module: "QtQuick.Controls",
  name: "ScrollView",
  versions: /.*/,
  baseClass: "QtQuick.Item",
  properties: {
    contentItem: "Item",
    flickableItem: "Item", // TODO  0) implement it  1) make it read-only
    viewport: "Item", // TODO
    frameVisible: "bool",
    highlightOnFocus: "bool", // TODO test
    verticalScrollBarPolicy: "enum",
    horizontalScrollBarPolicy: "enum",
    style: "Component" // TODO
  },
  defaultProperty: "contentItem"
}, class {
  constructor(meta) {
    QmlWeb.callSuper(this, meta);

    this.css.pointerEvents = "auto";
    this.setupFocusOnDom(this.dom);

    this.contentItemChanged.connect(this, this.$onContentItemChanged);
    this.flickableItemChanged.connect(this, this.$onFlickableItemChanged);
    this.viewportChanged.connect(this, this.$onViewportChanged);
    this.frameVisibleChanged.connect(this, this.$onFrameVisibleChanged);
    this.highlightOnFocusChanged.connect(this, this.$onHighlightOnFocusChanged);
    this.horizontalScrollBarPolicyChanged.connect(this,
                                      this.$onHorizontalScrollBarPolicyChanged);
    this.verticalScrollBarPolicyChanged.connect(this,
                                        this.$onVerticalScrollBarPolicyChanged);
    this.styleChanged.connect(this, this.$onStyleChanged);
    this.childrenChanged.connect(this, this.$onChildrenChanged);
    this.focusChanged.connect(this, this.$onFocusChanged);

    this.width = this.implicitWidth = 240; // default QML ScrollView width
    this.height = this.implicitHeight = 150; // default QML ScrollView height
    this.width = this.implicitWidth;
    this.height = this.implicitHeight;

    const Qt = QmlWeb.Qt;
    this.contentItem = undefined;
    this.flickableItem = undefined;
    this.viewport = undefined;
    this.frameVisible = false;
    this.highlightOnFocus = false;
    this.verticalScrollBarPolicy = Qt.ScrollBarAsNeeded;
    this.horizontalScrollBarPolicy = Qt.ScrollBarAsNeeded;
    this.style = undefined;
  }
  $onContentItemChanged(newItem) {
    if (typeof newItem !== undefined) {
      newItem.parent = this;
    }
  }
  $onFlickableItemChanged() {
  }
  $onHighlightOnFocusChanged() {
  }
  $onViewportChanged() {
  }
  $onFocusChanged(focus) {
    this.css.outline = this.highlight && focus
      ? "outline: lightblue solid 2px;"
      : "";
  }
  $onFrameVisibleChanged(visible) {
    this.css.border = visible ? "1px solid gray" : "hidden";
  }
  $onHorizontalScrollBarPolicyChanged(newPolicy) {
    this.css.overflowX = this.$scrollBarPolicyToCssOverflow(newPolicy);
  }
  $onVerticalScrollBarPolicyChanged(newPolicy) {
    this.css.overflowY = this.$scrollBarPolicyToCssOverflow(newPolicy);
  }
  $onStyleChanged() {
  }
  $onChildrenChanged() {
    if (typeof this.contentItem === "undefined" && this.children.length === 1) {
      this.contentItem = this.children[0];
    }
  }
  $scrollBarPolicyToCssOverflow(policy) {
    const Qt = QmlWeb.Qt;
    switch (policy) {
      case Qt.ScrollBarAsNeeded:
        return "auto";
      case Qt.ScrollBarAlwaysOff:
        return "hidden";
      case Qt.ScrollBarAlwaysOn:
        return "scroll";
    }
    return "auto";
  }
});
