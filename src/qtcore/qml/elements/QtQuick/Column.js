function QMLColumn(meta) {
    QMLPositioner.call(this, meta);
}

QMLColumn.prototype.layoutChildren = function() {
    var curPos = 0,
        maxWidth = 0;
    if (this.children.length === 0) return;
    for (var i = 0; i < this.children.length; i++) {
        var child = this.children[i];
        var childHeight = child.$isUsingImplicitHeight ? child.implicitHeight : child.height;
        var childWidth = child.$isUsingImplicitWidth ? child.implicitWidth : child.width;
        if (!(child.visible && childWidth && childHeight)) {
            continue;
        }
        maxWidth = childWidth > maxWidth ? childWidth : maxWidth;
        child.y = curPos;
        curPos += childHeight + this.spacing;
    }
    if (this.$isUsingImplicitWidth) this.implicitWidth = maxWidth;
    if (this.$isUsingImplicitHeight) this.implicitHeight = curPos - this.spacing; // We want no spacing at the bottom side
}

registerQmlType({
  module: 'QtQuick',
  name:   'Column',
  versions: /.*/,
  constructor: QMLColumn
});
