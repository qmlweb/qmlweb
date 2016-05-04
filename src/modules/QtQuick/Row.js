registerQmlType({
  module:   'QtQuick',
  name:     'Row',
  versions: /.*/,
  baseClass: 'Positioner',
  constructor: QMLRow
});

function QMLRow(meta) {
    callSuper(this, meta);

    createProperty("enum", this, "layoutDirection", {initialValue: 0});
    this.layoutDirectionChanged.connect(this, this.layoutChildren);
    this.layoutChildren();
}

QMLRow.prototype.layoutChildren = function() {
    var curPos = 0,
        maxHeight = 0,
        // When layoutDirection is RightToLeft we need oposite order
        i = this.layoutDirection == 1 ? this.children.length - 1 : 0,
        endPoint = this.layoutDirection == 1 ? -1 : this.children.length,
        step = this.layoutDirection == 1 ? -1 : 1;
    for (; i !== endPoint; i += step) {
        var child = this.children[i];
        if (!(child.visible && child.width && child.height))
            continue;
        maxHeight = child.height > maxHeight ? child.height : maxHeight;

        child.x = curPos;
        curPos += child.width + this.spacing;
    }
    this.implicitHeight = maxHeight;
    this.implicitWidth = curPos - this.spacing; // We want no spacing at the right side
}
