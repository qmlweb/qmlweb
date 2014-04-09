registerQmlType({
  module:   'QtQuick',
  name:     'Translate',
  versions: /.*/,
  baseClass: QMLBaseObject,
  constructor: function QMLTranslate(meta) {
    QMLBaseObject.call(this, meta);

    createProperty("real", this, "x");
    createProperty("real", this, "y");

    this.xChanged.connect(this.$parent, this.$parent.$updateTransform);
    this.yChanged.connect(this.$parent, this.$parent.$updateTransform);

    this.x = 0;
    this.y = 0;
  }
});
