// eslint-disable-next-line no-undef
class QtQuick_Positioner extends QtQuick_Item {
  static properties = {
    spacing: "int",
    padding: "int"
  };

  constructor(meta) {
    super(meta);

    this.childrenChanged.connect(this, this.$onChildrenChanged);
    this.spacingChanged.connect(this, this.layoutChildren);
    this.childrenChanged.connect(this, this.layoutChildren);
    this.layoutChildren();
  }
  $onChildrenChanged() {
    const flags = QmlWeb.Signal.UniqueConnection;
    for (let i = 0; i < this.children.length; i++) {
      const child = this.children[i];
      child.widthChanged.connect(this, this.layoutChildren, flags);
      child.heightChanged.connect(this, this.layoutChildren, flags);
      child.visibleChanged.connect(this, this.layoutChildren, flags);
    }
  }
  layoutChildren() {
    // noop, defined in individual positioners
  }
}
