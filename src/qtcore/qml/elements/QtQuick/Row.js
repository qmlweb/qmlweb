registerQmlType({
    module: 'QtQuick',
    name: 'Row',
    versions: /.*/,
    constructor: QMLRow
});

function QMLRow(meta) {
    QMLPositioner.call(this, meta);

    createSimpleProperty("enum", this, "layoutDirection");
    createSimpleProperty("enum", this, "effectiveLayoutDirection");
    this.layoutDirectionChanged.connect(this, this.layoutChildren);
    this.layoutDirection = 0;
}

QMLRow.prototype.layoutChildren = function () {
    var curPos = 0,
        maxHeight = 0,
        i = this.layoutDirection == 1 ? this.children.length - 1 : 0,
        endPoint = this.layoutDirection == 1 ? -1 : this.children.length,
        step = this.layoutDirection == 1 ? -1 : 1;
    for (; i !== endPoint; i += step) {
        var child = this.children[i];
        if (!(child.visible && child.opacity && child.width && child.height))
            continue;
        maxHeight = child.height > maxHeight ? child.height : maxHeight;

        child.x = curPos;
        curPos += child.width + this.spacing;
    }
    this.implicitHeight = maxHeight;
    this.implicitWidth = curPos - this.spacing;
}
