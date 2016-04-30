registerQmlType({
  module:   'QtQuick',
  name:     'Row',
  versions: /.*/,
  constructor: QMLRow
});

function QMLRow(meta) {
    QMLPositioner.call(this, meta);

    createSimpleProperty("enum", this, "layoutDirection");
    this.layoutDirectionChanged.connect(this, this.layoutChildren);
    this.layoutDirection = 0;
}

QMLRow.prototype.layoutChildren = function() {
    var curPos = 0,
        maxHeight = 0,
        // When layoutDirection is RightToLeft we need oposite order
        i = this.layoutDirection == 1 ? this.children.length - 1 : 0,
        endPoint = this.layoutDirection == 1 ? -1 : this.children.length,
        step = this.layoutDirection == 1 ? -1 : 1;

    if (this.children.length == 0) return;

    for (; i !== endPoint; i += step) {
        var child = this.children[i];
        if (!(child.visible && child.width && child.height))
            continue;
        maxHeight = child.height > maxHeight ? child.height : maxHeight;

        child.x = curPos;
        curPos += child.width + this.spacing;
    }

    if (this.$isUsingImplicitHeight) this.implicitHeight = maxHeight;
    if (this.$isUsingImplicitWidth)  this.implicitWidth = curPos - this.spacing; // We want no spacing at the right side
}
