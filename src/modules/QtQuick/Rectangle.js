registerQmlType({
  module: 'QtQuick',
  name:   'Rectangle',
  versions: /.*/,
  baseClass: 'Item',
  constructor: QMLRectangle
});

function QMLRectangle(meta) {
    callSuper(this, meta);

    createProperty("color", this, "color", {initialValue: 'white'});
    createProperty("real", this, "radius");

    this.border = new QObject(this);
    createProperty("color", this.border, "color", {initialValue: 'black'});
    createProperty("int", this.border, "width", {initialValue: 1});

    const bg = this.impl = document.createElement('div');
    bg.style.pointerEvents = 'none';
    bg.style.position = 'absolute';
    bg.style.left = bg.style.right = bg.style.top = bg.style.bottom = '0px';
    bg.style.borderWidth ='0px';
    bg.style.borderStyle = 'solid';
    bg.style.borderColor = 'black';
    bg.style.backgroundColor = 'white';
    this.dom.appendChild(bg);

    this.colorChanged.connect(this, function(newVal) {
        bg.style.backgroundColor = QMLColor(newVal);
    });
    this.radiusChanged.connect(this, function(newVal) {
        bg.style.borderRadius = newVal + 'px';
    });
    this.border.colorChanged.connect(this, function(newVal) {
        bg.style.borderColor = QMLColor(newVal);
        if (bg.style.borderWidth == '0px') {
            bg.style.borderWidth = this.border.width + 'px';
        }
        this.$updateBorder(this.border.width);
    });
    this.border.widthChanged.connect(this, function(newVal) {
        // ignore negative border width
        if (newVal >= 0) {
            this.$updateBorder(newVal);
        } else {
            bg.style.borderWidth = "0px";
        }
    });
    this.widthChanged.connect(this, function(newVal){
       this.$updateBorder(this.border.width);
    });
    this.heightChanged.connect(this, function(newVal){
       this.$updateBorder(this.border.width);
    });
}

QMLRectangle.prototype.$updateBorder = function(newBorderWidth) {
    const bg = this.dom.firstChild;

    // ignore negative and 0px border width
    if (newBorderWidth == "0px" || newBorderWidth < 0) {
        return;
    }
    // no Rectangle border width was set yet
    if ( (newBorderWidth == "1" && bg.style.borderWidth == "0px") || ( typeof newBorderWidth === "undefined" && bg.style.borderWidth == "0px") ) {
        return;
    }

    var topBottom = typeof newBorderWidth === "undefined" ? bg.style.borderWidth : newBorderWidth + 'px';
    var leftRight = topBottom;

    bg.style.borderTopWidth = topBottom;
    bg.style.borderBottomWidth = topBottom;
    bg.style.borderLeftWidth = leftRight;
    bg.style.borderRightWidth = leftRight;

    // hide border if any of dimensions is less then one
    if (this.width <= 0 || this.height <= 0 || typeof this.width === "undefined" || typeof this.height === "undefined") {
        bg.style.borderWidth = '0px';
    } else {
        // check if border is not greater than Rectangle size
        // react by change of width or height of div (in css)

        if (2 * this.border.width > this.height) {
            topBottom = this.height/2 + 'px';
            bg.style.height = '0px';
        } else {
            if ( this.height - 2 * this.border.width < this.border.width) {
                if (this.height > 2) {
                    bg.style.height = (this.height%2 ? -1 : -2 + this.height + (this.height - (2*this.border.width))) + 'px';
                }
            }
        }

        if (2 * this.border.width > this.width) {
            leftRight = this.width/2 + 'px';
            bg.style.width = '0px';
        } else {
            if (this.width - 2 * this.border.width < this.border.width) {
                if (this.width > 2) {
                    bg.style.width = (this.width%2 ? -1 : -2 + this.width + ( this.width - (2*this.border.width))) + 'px';
                }
            }
        }

        bg.style.borderTopWidth = topBottom;
        bg.style.borderBottomWidth = topBottom;
        bg.style.borderLeftWidth = leftRight;
        bg.style.borderRightWidth = leftRight;
    }
};
