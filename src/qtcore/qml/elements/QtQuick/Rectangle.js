registerQmlType({
  module: 'QtQuick',
  name:   'Rectangle',
  versions: /.*/,
  baseClass: QMLItem,
  constructor: function QMLRectangle(meta) {
    QMLItem.call(this, meta);

    createProperty({ type: "color", object: this, name: "color", initialValue: 'white' });
    createProperty({ type: "real", object: this, name: "radius", initialValue: 0 });

    this.border = new QObject(this);
    createProperty({ type: "color", object: this.border, name: "color", initialValue: 'black' });
    createProperty({ type: "int", object: this.border, name: "width", initialValue: 1 });

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

    this.colorChanged(this.color);
    this.css.borderWidth ='0px';
    this.css.borderStyle = 'solid';
    this.css.borderColor = 'black';
  }
});
