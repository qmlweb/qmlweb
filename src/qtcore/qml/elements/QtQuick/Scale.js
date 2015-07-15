registerQmlType({
    module: 'QtQuick',
    name: 'Scale',
    versions: /.*/,
    constructor: function QMLScale(meta) {
        QMLBaseObject.call(this, meta);

        createSimpleProperty("real", this, "xScale");
        createSimpleProperty("real", this, "yScale");

        this.origin = new QObject(this);
        createSimpleProperty("real", this.origin, "x");
        createSimpleProperty("real", this.origin, "y");

        function updateOrigin() {
            this.$parent.dom.style.transformOrigin = this.origin.x + "px " + this.origin.y + "px";
            this.$parent.dom.style.MozTransformOrigin = this.origin.x + "px " + this.origin.y + "px"; // Firefox
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
