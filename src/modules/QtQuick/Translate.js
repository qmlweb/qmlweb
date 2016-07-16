registerQmlType({
  module: "QtQuick",
  name: "Translate",
  versions: /.*/,
  baseClass: "QtQml.QtObject",
  properties: {
    x: "real",
    y: "real"
  }
}, class {
  constructor(meta) {
    callSuper(this, meta);

    this.xChanged.connect(this.$parent, this.$parent.$updateTransform);
    this.yChanged.connect(this.$parent, this.$parent.$updateTransform);

    this.x = 0;
    this.y = 0;
  }
});
