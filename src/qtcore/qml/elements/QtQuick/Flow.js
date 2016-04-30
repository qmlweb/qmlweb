function QMLFlow(meta) {
    QMLPositioner.call(this, meta);

    this.Flow = {
        LeftToRight: 0,
        TopToBottom: 1
    }

    createSimpleProperty("enum", this, "flow");
    createSimpleProperty("enum", this, "layoutDirection");
    this.flowChanged.connect(this, this.layoutChildren);
    this.layoutDirectionChanged.connect(this, this.layoutChildren);
    this.widthChanged.connect(this, this.layoutChildren);

    this.flow = this.Flow.LeftToRight;
    this.layoutDirection = 0;
}

QMLFlow.prototype.layoutChildren = function() {
    var curHPos = 0,
        curVPos = 0,
        rowSize = 0;

    if (children.length == 0) return;

    for (var i = 0; i < this.children.length; i++) {
        var child = this.children[i];
        if (!(child.visible && child.width && child.height))
            continue;

        if (this.flow == this.Flow.LeftToRight) {
            if (curHPos + child.width > this.width) {
                if (this.$isUsingImplicitWidth == false ) curHPos = 0;
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
                if (this.$isUsingImplicitHeight == false ) curVPos = 0;
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

    if (this.$isUsingImplicitHeight)
        this.implicitHeight = curVPos + rowSize;

    if (this.$isUsingImplicitWidth)
        this.implicitWidth = curHPos + rowSize;
}

registerQmlType({
  module:      'QtQuick',
  name:        'Flow',
  versions:    /.*/,
  constructor: QMLFlow
});
