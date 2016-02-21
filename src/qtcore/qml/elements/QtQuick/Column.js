function QMLColumn(meta) {
    QMLPositioner.call(this, meta);
}

QMLColumn.prototype.layoutChildren = function() {
    var curPos = 0, maxWidth = 0;
    var children = this.children;
    var child    = undefined;  
    var childWidth =0, childHeight = 0;    
    var i,l = children.length; 
    if ( l == 0) return;   
       
    for (i = 0; i < l; i++) {
        child = children[i]; 
        childHeight = child.$isUsingImplicitHeight ? child.implicitHeight : child.height;
        childWidth = child.$isUsingImplicitWidth ? child.implicitWidth : child.width;
        
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
