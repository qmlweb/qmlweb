registerQmlType({
  module:   'QtQuick',
  name:     'Scale',
  versions: /.*/,
  baseClass: 'QtQml.QtObject',
  constructor: function QMLScale(meta) {
    callSuper(this, meta);

    createProperty("real", this, "xScale");
    createProperty("real", this, "yScale");

    this.origin = new QObject(this);
    createProperty("real", this.origin, "x");
    createProperty("real", this.origin, "y");

    const updateOrigin = () => {
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

    /* QML default origin is top-left, while CSS default origin is centre, so
     * updateOrigin must be called to set the initial transformOrigin. */
    updateOrigin();
  }
});
