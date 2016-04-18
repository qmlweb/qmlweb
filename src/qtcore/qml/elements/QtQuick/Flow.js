function QMLFlow(meta) {
    QMLPositioner.call(this, meta);

    this.Flow = {
        LeftToRight: 0,
        TopToBottom: 1
    }

    createProperty({ type: "enum", object: this, name: "flow", initialValue: this.Flow.LeftToRight });
    createProperty({ type: "enum", object: this, name: "layoutDirection", initialValue: 0 });
    this.flowChanged.connect(this, this.layoutChildren);
    this.layoutDirectionChanged.connect(this, this.layoutChildren);
    this.widthChanged.connect(this, this.layoutChildren);
    this.flowChanged();
}

QMLFlow.prototype.layoutChildren = function() {
    var curHPos = 0,
        curVPos = 0,
        rowSize = 0;
    for (var i = 0; i < this.children.length; i++) {
        var child = this.children[i];
        if (!(child.visible && child.opacity && child.width && child.height))
            continue;

        if (this.flow == this.Flow.LeftToRight) {
            if (curHPos + child.width > this.width) {
                curHPos = 0;
                curVPos += rowSize + this.spacing;
                rowSize = 0;
            }
            rowSize = child.height > rowSize ? child.height : rowSize;

            child.x = this.layoutDirection == 1
                    ? this.width - curHPos - child.width : curHPos;
            child.y = curVPos;
            curHPos += child.width + this.spacing;
        } else {
            if (curVPos + child.height > this.height) {
                curVPos = 0;
                curHPos += rowSize + this.spacing;
                rowSize = 0;
            }
            rowSize = child.width > rowSize ? child.width : rowSize;

            child.x = this.layoutDirection == 1
                    ? this.width - curHPos - child.width : curHPos;
            child.y = curVPos;
            curVPos += child.height + this.spacing;
        }
    }
    if (this.flow == 0)
        this.implicitHeight = curVPos + rowSize;
    else
        this.implicitWidth = curHPos + rowSize;
}

registerQmlType({
  module:      'QtQuick',
  name:        'Flow',
  versions:    /.*/,
  baseClass: QMLPositioner,
  constructor: QMLFlow
});
