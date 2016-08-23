QmlWeb.registerQmlType({
  module: "QtQuick",
  name: "Positioner",
  versions: /.*/,
  baseClass: "Item",
  properties: {
    spacing: "int"
  }
}, class {
  constructor(meta) {
    QmlWeb.callSuper(this, meta);

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
});
