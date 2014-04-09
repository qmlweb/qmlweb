registerQmlType({
  module:   'QtQuick',
  name:     'Translate',
  versions: /.*/,
  baseClass: QMLBaseObject,
  constructor: function QMLTranslate(meta) {
    QMLBaseObject.call(this, meta);

    createProperty({ type: "real", object: this, name: "x" });
    createProperty({ type: "real", object: this, name: "y" });

    this.xChanged.connect(this.$parent, this.$parent.$updateTransform);
    this.yChanged.connect(this.$parent, this.$parent.$updateTransform);

    this.x = 0;
    this.y = 0;
  }
});
