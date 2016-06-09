registerQmlType({
  module:   'QtQuick',
  name:     'Translate',
  versions: /.*/,
  baseClass: 'QtQml.QtObject',
  constructor: function QMLTranslate(meta) {
    callSuper(this, meta);

    createProperty("real", this, "x");
    createProperty("real", this, "y");

    this.xChanged.connect(this.$parent, this.$parent.$updateTransform);
    this.yChanged.connect(this.$parent, this.$parent.$updateTransform);

    this.x = 0;
    this.y = 0;
  }
});
