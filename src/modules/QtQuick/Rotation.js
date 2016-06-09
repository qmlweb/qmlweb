registerQmlType({
  module: 'QtQuick',
  name:   'Rotation',
  versions: /.*/,
  baseClass: 'QtQml.QtObject',
  constructor: function QMLRotation(meta) {
    callSuper(this, meta);

    createProperty("real", this, "angle");

    this.axis = new QObject(this);
    createProperty("real", this.axis, "x");
    createProperty("real", this.axis, "y");
    createProperty("real", this.axis, "z", {initialValue: 1});

    this.origin = new QObject(this);
    createProperty("real", this.origin, "x");
    createProperty("real", this.origin, "y");

    function updateOrigin() {
        this.$parent.dom.style.transformOrigin = this.origin.x + "px " + this.origin.y + "px";
        this.$parent.dom.style.MozTransformOrigin = this.origin.x + "px " + this.origin.y + "px";    // Firefox
        this.$parent.dom.style.webkitTransformOrigin = this.origin.x + "px " + this.origin.y + "px"; // Chrome, Safari and Opera
    }
    this.angleChanged.connect(this.$parent, this.$parent.$updateTransform);
    this.axis.xChanged.connect(this.$parent, this.$parent.$updateTransform);
    this.axis.yChanged.connect(this.$parent, this.$parent.$updateTransform);
    this.axis.zChanged.connect(this.$parent, this.$parent.$updateTransform);
    this.origin.xChanged.connect(this, updateOrigin);
    this.origin.yChanged.connect(this, updateOrigin);
    this.$parent.$updateTransform();
  }
});
