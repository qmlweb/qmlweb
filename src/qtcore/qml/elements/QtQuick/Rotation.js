registerQmlType({
  module: 'QtQuick',
  name:   'Rotation',
  versions: /.*/,
  baseClass: QMLBaseObject,
  constructor: function QMLRotation(meta) {
    QMLBaseObject.call(this, meta);

    createProperty({ type: "real", object: this, name: "angle", initialValue: 0 });

    this.axis = new QObject(this);
    createProperty({ type: "real", object: this.axis, name: "x", initialValue: 0 });
    createProperty({ type: "real", object: this.axis, name: "y", initialValue: 0 });
    createProperty({ type: "real", object: this.axis, name: "z", initialValue: 1 });

    this.origin = new QObject(this);
    createProperty({ type: "real", object: this.origin, name: "x", initialValue: 0 });
    createProperty({ type: "real", object: this.origin, name: "y", initialValue: 0 });

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
