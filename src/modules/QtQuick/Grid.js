registerQmlType({
  module: 'QtQuick',
  name: 'Grid',
  versions: /.*/,
  baseClass: 'Positioner',
  constructor: QMLGrid
});

function QMLGrid(meta) {
    callSuper(this, meta);

    this.Grid = {
        LeftToRight: 0,
        TopToBottom: 1
    }

    createProperty("int", this, "columns");
    createProperty("int", this, "rows");
    createProperty("enum", this, "flow", {initialValue: 0});
    createProperty("enum", this, "layoutDirection", {initialValue: 0});
    this.columnsChanged.connect(this, this.layoutChildren);
    this.rowsChanged.connect(this, this.layoutChildren);
    this.flowChanged.connect(this, this.layoutChildren);
    this.layoutDirectionChanged.connect(this, this.layoutChildren);
    this.layoutChildren();
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

    // How many items are actually visible?
    for (var i = 0; i < this.children.length; i++) {
        var child = this.children[i];
        if (child.visible && child.width && child.height)
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
        for (var i = 0; i < r; i++) {
            for (var j = 0; j < c; j++) {
                var item = visibleItems[i*c+j];
                if (!item)
                    break;
                if (!colWidth[j] || item.width > colWidth[j])
                    colWidth[j] = item.width;
                if (!rowHeight[i] || item.height > rowHeight[i])
                    rowHeight[i] = item.height;
            }
        }
    else
        for (var i = 0; i < c; i++) {
            for (var j = 0; j < r; j++) {
                var item = visibleItems[i*r+j];
                if (!item)
                    break;
                if (!rowHeight[j] || item.height > rowHeight[j])
                    rowHeight[j] = item.height;
                if (!colWidth[i] || item.width > colWidth[i])
                    colWidth[i] = item.width;
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
    if (this.flow == 0)
        for (var i = 0; i < r; i++) {
            for (var j = startingPoint; j !== endPoint; j += step) {
                var item = visibleItems[i*c+j];
                if (!item)
                    break;
                item.x = curHPos;
                item.y = curVPos;

                curHPos += colWidth[j] + this.spacing;
            }
            curVPos += rowHeight[i] + this.spacing;
            curHPos = 0;
        }
    else
        for (var i = startingPoint; i !== endPoint; i += step) {
            for (var j = 0; j < r; j++) {
                var item = visibleItems[i*r+j];
                if (!item)
                    break;
                item.x = curHPos;
                item.y = curVPos;

                curVPos += rowHeight[j] + this.spacing;
            }
            curHPos += colWidth[i] + this.spacing;
            curVPos = 0;
        }

    this.implicitWidth = gridWidth;
    this.implicitHeight = gridHeight;
}
