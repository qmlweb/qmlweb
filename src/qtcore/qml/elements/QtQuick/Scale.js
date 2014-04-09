registerQmlType({
  module:   'QtQuick',
  name:     'Scale',
  versions: /.*/,
  baseClass: QMLBaseObject,
  constructor: function QMLScale(meta) {
    QMLBaseObject.call(this, meta);

    createProperty({ type: "real", object: this, name: "xScale" });
    createProperty({ type: "real", object: this, name: "yScale" });

    this.origin = new QObject(this);
    createProperty({ type: "real", object: this.origin, name: "x" });
    createProperty({ type: "real", object: this.origin, name: "y" });

    function updateOrigin() {
        this.$parent.dom.style.transformOrigin = this.origin.x + "px " + this.origin.y + "px";
        this.$parent.dom.style.MozTransformOrigin = this.origin.x + "px " + this.origin.y + "px";    // Firefox
        this.$parent.dom.style.webkitTransformOrigin = this.origin.x + "px " + this.origin.y + "px"; // Chrome, Safari and Opera
    }
    this.xScaleChanged.connect(this.$parent, this.$parent.$updateTransform);
    this.yScaleChanged.connect(this.$parent, this.$parent.$updateTransform);
    this.origin.xChanged.connect(this, updateOrigin);
    this.origin.yChanged.connect(this, updateOrigin);

    this.xScale = 0;
    this.yScale = 0;
    this.origin.x = 0;
    this.origin.y = 0;
  }
});
