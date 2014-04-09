registerQmlType({
  module: 'QtQuick',
  name:   'Rectangle',
  versions: /.*/,
  baseClass: QMLItem,
  constructor: function QMLRectangle(meta) {
    QMLItem.call(this, meta);

    createProperty("color", this, "color");
    createProperty("real", this, "radius");

    this.border = new QObject(this);
    createProperty("color", this.border, "color");
    createProperty("int", this.border, "width");

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
        this.css.borderWidth = newVal + 'px';
    });

    this.color = "white";
    this.radius = 0;
    this.css.borderWidth ='0px';
    this.css.borderStyle = 'solid';
    this.css.borderColor = 'black';
  }
});
