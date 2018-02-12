// eslint-disable-next-line no-undef
class QtQuick_Controls_2_Container extends QtQuick_Controls_2_Control {
  static versions = /^2\./;
  static properties = {
    contentChildren: "list",
    contentData: "list",
    contentModel: "model",
    count: "int",
    currentIndex: "int",
    currentItem: "Item"
  };

  constructor(meta) {
    super(meta);

    this.widthChanged.connect(this, this.layoutChildren);
    this.heightChanged.connect(this, this.layoutChildren);
    this.childrenChanged.connect(this, this.layoutChildren);
    this.childrenChanged.connect(this, this.$onChildrenChanged);
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
