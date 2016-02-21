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
    var curPos = 0, maxHeight = 0;
    var children    = this.children;
    var child       = undefined;
    var i,l = children.length
    
    if ( l == 0) return;
 
    // When layoutDirection is RightToLeft we need oposite order
    var i = this.layoutDirection == 1 ? l - 1 : 0,
        endPoint = this.layoutDirection == 1 ? -1 : l,
        step = this.layoutDirection == 1 ? -1 : 1;
                
    var rowWidth = this.$isUsingImplicitWidth ? this.implicitWidth : this.width;
    var rowHeight = this.$isUsingImplicitHeight ? this.implicitHeight : this.height;
    
    for (; i !== endPoint; i += step) {
        child = children[i];
        childHeight = child.$isUsingImplicitHeight ? child.implicitHeight : child.height;
        childWidth = child.$isUsingImplicitWidth ? child.implicitWidth : child.width;
        
        if (!(child.visible && childWidth && childHeight)) 
            continue;
        
        maxHeight = childHeight > maxHeight ? childHeight : maxHeight;

        child.x = curPos;
        curPos += childWidth + this.spacing;
    }
    
    if (this.$isUsingImplicitHeight) this.implicitHeight = maxHeight;  
    if (this.$isUsingImplicitWidth)  this.implicitWidth = curPos - this.spacing; // We want no spacing at the right side
}