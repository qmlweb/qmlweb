function QMLColumn(meta) {
    QMLPositioner.call(this, meta);
}

QMLColumn.prototype.layoutChildren = function () {
    var curPos = 0,
        maxWidth = 0;
    for (var i = 0; i < this.children.length; i++) {
        var child = this.children[i];
        if (!(child.visible && child.opacity && child.width && child.height))
            continue;
        maxWidth = child.width > maxWidth ? child.width : maxWidth;

        child.y = curPos;
        curPos += child.height + this.spacing;
    }
    this.implicitWidth = maxWidth;
    this.implicitHeight = curPos - this.spacing;
}

registerQmlType({
    module: 'QtQuick',
    name: 'Column',
    versions: /.*/,
    constructor: QMLColumn
});
