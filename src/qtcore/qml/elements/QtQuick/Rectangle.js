registerQmlType({
  module: 'QtQuick',
  name:   'Rectangle',
  versions: /.*/,
  baseClass: QMLItem,
  constructor: function QMLRectangle(meta) {
    QMLItem.call(this, meta);

    createSimpleProperty("color", this, "color");
    createSimpleProperty("real", this, "radius");

    this.border = new QObject(this);
    createSimpleProperty("color", this.border, "color");
    createSimpleProperty("int", this.border, "width");

    this.border.color = 'black';
    this.border.width = 1;

    this.colorChanged.connect(this, function(newVal) {
        this.css.backgroundColor = QMLColor(newVal);
    });
    this.radiusChanged.connect(this, function(newVal) {
        this.css.borderRadius = newVal + 'px';
    });
    this.border.colorChanged.connect(this, function(newVal) {
        this.css.borderColor = QMLColor(newVal);
        this.css.borderWidth = this.border.width + 'px';
    });
    this.border.widthChanged.connect(this, function(newVal) {
        if (this.width > 0 && this.height > 0){
            this.css.borderWidth = newVal + "px";
        } else {
            this.css.borderWidth = "0px";
        }
    });

    this.color = "white";
    this.radius = 0;
    this.css.borderWidth ='0px';
    this.css.borderStyle = 'solid';
    this.css.borderColor = 'black';

    this.$drawItem = function(c) {
        c.save();
        c.fillStyle = this.color;
        c.strokeStyle = this.border.color;
        c.lineWidth = this.border.width;

        if (!this.radius) {
            c.fillRect(this.left, this.top, this.width, this.height);
            c.strokeRect(this.left, this.top, this.width, this.height);
        } else {
            var r = this.left + this.width;
            var b = this.top + this.height;
            c.beginPath();
            c.moveTo(this.left + this.radius, this.top);
            c.lineTo(r - this.radius, this.top);
            c.quadraticCurveTo(r, this.top, r, this.top + this.radius);
            c.lineTo(r, this.top + this.height - this.radius);
            c.quadraticCurveTo(r, b, r - this.radius, b);
            c.lineTo(this.left + this.radius, b);
            c.quadraticCurveTo(this.left, b, this.left, b - this.radius);
            c.lineTo(this.left, this.top + this.radius);
            c.quadraticCurveTo(this.left, this.top, this.left + this.radius, this.top);
            c.stroke();
            c.fill();
        }
        c.restore();
    }
  }
});
