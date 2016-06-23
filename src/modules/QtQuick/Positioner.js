registerQmlType({
  module: "QtQuick",
  name: "Positioner",
  versions: /.*/,
  baseClass: "Item",
  properties: {
    spacing: "int"
  }
}, class {
  constructor(meta) {
    callSuper(this, meta);

    this.spacingChanged.connect(this, this.layoutChildren);
    this.childrenChanged.connect(this, this.layoutChildren);
    this.childrenChanged.connect(() => {
      for (var i = 0; i < this.children.length; i++) {
        var child = this.children[i];
        if (!child.widthChanged.isConnected(this, this.layoutChildren))
            child.widthChanged.connect(this, this.layoutChildren);
        if (!child.heightChanged.isConnected(this, this.layoutChildren))
            child.heightChanged.connect(this, this.layoutChildren);
        if (!child.visibleChanged.isConnected(this, this.layoutChildren))
            child.visibleChanged.connect(this, this.layoutChildren);
      }
    });

    this.layoutChildren();
  }
});
