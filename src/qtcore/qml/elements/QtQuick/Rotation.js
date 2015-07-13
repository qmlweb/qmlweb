registerQmlType({
  module: 'QtQuick',
  name:   'Rotation',
  versions: /.*/,
  constructor: function QMLRotation(meta) {
    QMLQtObject.call(this, meta);

    createSimpleProperty("real", this, "angle");

    this.axis = new QObject(this);
    createSimpleProperty("real", this.axis, "x");
    createSimpleProperty("real", this.axis, "y");
    createSimpleProperty("real", this.axis, "z");

    this.origin = new QObject(this);
    createSimpleProperty("real", this.origin, "x");
    createSimpleProperty("real", this.origin, "y");

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

    this.angle = 0;
    this.axis.x = 0;
    this.axis.y = 0;
    this.axis.z = 1;
    this.origin.x = 0;
    this.origin.y = 0;
  }
});
