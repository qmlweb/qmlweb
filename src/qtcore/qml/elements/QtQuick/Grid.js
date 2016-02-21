registerQmlType({
  module: 'QtQuick',
  name: 'Grid',
  versions: /.*/,
  constructor: QMLGrid
});

function QMLGrid(meta) {
    QMLPositioner.call(this, meta);

    this.Grid = {
        LeftToRight: 0,
        TopToBottom: 1
    }

    createSimpleProperty("int", this, "columns");
    createSimpleProperty("int", this, "rows");
    createSimpleProperty("enum", this, "flow");
    createSimpleProperty("enum", this, "layoutDirection");
    this.columnsChanged.connect(this, this.layoutChildren);
    this.rowsChanged.connect(this, this.layoutChildren);
    this.flowChanged.connect(this, this.layoutChildren);
    this.layoutDirectionChanged.connect(this, this.layoutChildren);

    this.flow = 0;
    this.layoutDirection = 0;
}

QMLGrid.prototype.layoutChildren = function() {
    var visibleItems = [],
        r = 0, c = 0,
        colWidth = [],
        rowHeight = [],
        gridWidth = -this.spacing,
        gridHeight = -this.spacing,
        curHPos = 0,
        curVPos = 0;
    var child =0, childWidth=0,childHeight=0;
    var item =0, itemWidth=0, itemHeight=0;
    var i = 0, j = 0;
    var l = this.children.length;
    
    // How many items are actually visible?
    for (i = 0; i < l; i++) {
        child = this.children[i];
        childHeight = child.$isUsingImplicitHeight ? child.implicitHeight : child.height;
        childWidth = child.$isUsingImplicitWidth ? child.implicitWidth : child.width;
        
        if (child.visible && childWidth && childHeight) 
            visibleItems.push(this.children[i]);
    }

    // How many rows and columns do we need?
    if (!this.columns && !this.rows) {
        c = 4;
        r = Math.ceil(visibleItems.length / 4);
    } else if (!this.columns) {
        r = this.rows;
        c = Math.ceil(visibleItems.length / r);
    } else {
        c = this.columns;
        r = Math.ceil(visibleItems.length / c);
    }

    // How big are the colums/rows?
    if (this.flow == 0)
        for (i = 0; i < r; i++) {
            for (j = 0; j < c; j++) {
                item = visibleItems[i*c+j];
                if (!item) break;
 
                itemHeight = item.$isUsingImplicitHeight ? item.implicitHeight : item.height;
                itemWidth = item.$isUsingImplicitWidth ? item.implicitWidth : item.width;
 
                if (!colWidth[j] || itemWidth > colWidth[j])    colWidth[j] = itemWidth;
                if (!rowHeight[i] || itemHeight > rowHeight[i]) rowHeight[i] = itemHeight;
            }
        }
    else
        for (i = 0; i < c; i++) {
            for (j = 0; j < r; j++) {
                item = visibleItems[i*r+j];
                if (!item) break;

                itemHeight = item.$isUsingImplicitHeight ? item.implicitHeight : item.height;
                itemWidth = item.$isUsingImplicitWidth ? item.implicitWidth : item.width;
        
                if (!rowHeight[j] || itemHeight > rowHeight[j])  rowHeight[j] = itemHeight;
                if (!colWidth[i] || itemWidth > colWidth[i])     colWidth[i] = itemWidth;
            }
        }

    for (var i in colWidth)
        gridWidth += colWidth[i] + this.spacing;
    for (var i in rowHeight)
        gridHeight += rowHeight[i] + this.spacing;

    // Do actual positioning
    // When layoutDirection is RightToLeft we need oposite order of coumns
    var step = this.layoutDirection == 1 ? -1 : 1,
        startingPoint = this.layoutDirection == 1 ? c - 1 : 0,
        endPoint = this.layoutDirection == 1 ? -1 : c;
       
    if (this.flow == 0) {   
        for (i = 0; i < r; i++) {
            for (j = startingPoint; j !== endPoint; j += step) {
                item = visibleItems[i*c+j];
                if (!item)
                    break;
                item.x = curHPos;
                item.y = curVPos;

                curHPos += colWidth[j] + this.spacing;
            }
            curVPos += rowHeight[i] + this.spacing;
            curHPos = 0;
        }
    }
    else {
        for (i = startingPoint; i !== endPoint; i += step) {
            for (j = 0; j < r; j++) {
                item = visibleItems[i*r+j];
                if (!item)
                    break;
                item.x = curHPos;
                item.y = curVPos;

                curVPos += rowHeight[j] + this.spacing;
            }
            curHPos += colWidth[i] + this.spacing;
            curVPos = 0;
        }
    }
    
    if (this.$isUsingImplicitWidth) this.implicitWidth = gridWidth;  
    if (this.$isUsingImplicitHeight) this.implicitHeight = gridHeight; 
}
