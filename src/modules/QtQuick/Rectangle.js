registerQmlType({
  module: 'QtQuick',
  name:   'Rectangle',
  versions: /.*/,
  baseClass: 'Item',
  constructor: function QMLRectangle(meta) {
    callSuper(this, meta);

    createProperty("color", this, "color", {initialValue: 'white'});
    createProperty("real", this, "radius");

    this.border = new QObject(this);
    createProperty("color", this.border, "color", {initialValue: 'black'});
    createProperty("int", this.border, "width", {initialValue: 1});

    const bg = this.impl = document.createElement('div');
    bg.style.pointerEvents = 'none';
    bg.style.position = 'absolute';
    bg.style.left = bg.style.right = bg.style.top = bg.style.bottom = '0px';
    bg.style.borderWidth ='0px';
    bg.style.borderStyle = 'solid';
    bg.style.borderColor = 'black';
    bg.style.backgroundColor = 'white';
    this.dom.appendChild(bg);

    this.colorChanged.connect(this, function(newVal) {
        bg.style.backgroundColor = QMLColor(newVal);
    });
    this.radiusChanged.connect(this, function(newVal) {
        bg.style.borderRadius = newVal + 'px';
    });
    this.border.colorChanged.connect(this, function(newVal) {
        bg.style.borderColor = QMLColor(newVal);
        bg.style.borderWidth = this.border.width + 'px';
    });
    this.border.widthChanged.connect(this, function(newVal) {
        bg.style.borderWidth = newVal + 'px';
    });
  }
});
