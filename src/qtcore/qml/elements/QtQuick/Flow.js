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
    this.implicitWidthChanged.connect(this, this.layoutChildren);
  
    this.flow = this.Flow.LeftToRight;
    this.layoutDirection = 0 ;
}

QMLFlow.prototype.layoutChildren = function() {
    var curHPos = 0,
        curVPos = 0,
        rowSize = 0;
    var children = this.children;
    var child    = undefined;

    if (children.length == 0) return;
 
    var flowWidth = this.$isUsingImplicitWidth ? this.implicitWidth : this.width;
    var flowHeight = this.$isUsingImplicitHeight ? this.implicitHeight : this.height;
    
    for (var i=0;i < children.length;i++) {
        child = children[i];
        childHeight = child.$isUsingImplicitHeight ? child.implicitHeight : child.height;
        childWidth = child.$isUsingImplicitWidth ? child.implicitWidth : child.width;
        
        if (!(child.visible && childWidth && childHeight))
            continue;

        if (this.flow == this.Flow.LeftToRight) {
            if (curHPos + childWidth > flowWidth) {
                if (this.$isUsingImplicitWidth == false ) curHPos = 0;
                curVPos += rowSize + this.spacing;
                rowSize = 0;
            }
            rowSize = childHeight > rowSize ? childHeight : rowSize;

            child.x = this.layoutDirection == 1
                    ? flowWidth - curHPos - childWidth : curHPos;
            child.y = curVPos;
            curHPos += childWidth + this.spacing;
        } else {
            if (curVPos + childHeight > flowHeight) {
                if (this.$isUsingImplicitHeight == false ) curVPos = 0; 
                curHPos += rowSize + this.spacing;
                rowSize = 0;
            }
            rowSize = childWidth > rowSize ? childWidth : rowSize;

            child.x = this.layoutDirection == 1
                    ? flowWidth - curHPos - childWidth : curHPos;
            child.y = curVPos;
            curVPos += childHeight + this.spacing;
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
