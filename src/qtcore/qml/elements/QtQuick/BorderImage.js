registerQmlType({
  module:   'QtQuick',
  name:     'BorderImage',
  versions: /.*/,
  baseClass: QMLItem,
  constructor: function QMLBorderImage(meta) {
    QMLItem.call(this, meta);
    var self = this;

    this.BorderImage = {
        // tileMode
        Stretch: "stretch",
        Repeat: "repeat",
        Round: "round",
        // status
        Null: 1,
        Ready: 2,
        Loading: 3,
        Error: 4
    }

    createProperty({ type: "url", object: this, name: "source" });
    createProperty({ type: "enum", object: this, name: "status" });
    this.border = new QObject(this);
    createProperty({ type: "int", object: this.border, name: "left" });
    createProperty({ type: "int", object: this.border, name: "right" });
    createProperty({ type: "int", object: this.border, name: "top" });
    createProperty({ type: "int", object: this.border, name: "bottom" });
    createProperty({ type: "enum", object: this, name: "horizontalTileMode" });
    createProperty({ type: "enum", object: this, name: "verticalTileMode" });

    this.source = "";
    this.status = this.BorderImage.Null;
    this.border.left = 0;
    this.border.right = 0;
    this.border.top = 0;
    this.border.bottom = 0;
    this.horizontalTileMode = this.BorderImage.Stretch;
    this.verticalTileMode = this.BorderImage.Stretch;

    this.sourceChanged.connect(this, function() {
        this.dom.style.borderImageSource = "url(" + engine.$resolvePath(this.source) + ")";
    });
    this.border.leftChanged.connect(this, updateBorder);
    this.border.rightChanged.connect(this, updateBorder);
    this.border.topChanged.connect(this, updateBorder);
    this.border.bottomChanged.connect(this, updateBorder);
    this.horizontalTileModeChanged.connect(this, updateBorder);
    this.verticalTileModeChanged.connect(this, updateBorder);

    function updateBorder() {
        this.dom.style.MozBorderImageSource = "url(" + engine.$resolvePath(this.source) + ")";
        this.dom.style.MozBorderImageSlice = this.border.top + " "
                                                + this.border.right + " "
                                                + this.border.bottom + " "
                                                + this.border.left + " "
                                                + "fill";
        this.dom.style.MozBorderImageRepeat = this.horizontalTileMode + " "
                                                    + this.verticalTileMode;
        this.dom.style.MozBorderImageWidth = this.border.top + " "
                                                + this.border.right + " "
                                                + this.border.bottom + " "
                                                + this.border.left;

        this.dom.style.webkitBorderImageSource = "url(" + engine.$resolvePath(this.source) + ")";
        this.dom.style.webkitBorderImageSlice = this.border.top + " "
                                                + this.border.right + " "
                                                + this.border.bottom + " "
                                                + this.border.left + " "
                                                + "fill";
        this.dom.style.webkitBorderImageRepeat = this.horizontalTileMode + " "
                                                    + this.verticalTileMode;
        this.dom.style.webkitBorderImageWidth = this.border.top + " "
                                                + this.border.right + " "
                                                + this.border.bottom + " "
                                                + this.border.left;

        this.dom.style.OBorderImageSource = "url(" + engine.$resolvePath(this.source) + ")";
        this.dom.style.OBorderImageSlice = this.border.top + " "
                                                + this.border.right + " "
                                                + this.border.bottom + " "
                                                + this.border.left + " "
                                                + "fill";
        this.dom.style.OBorderImageRepeat = this.horizontalTileMode + " "
                                                    + this.verticalTileMode;
        this.dom.style.OBorderImageWidth = this.border.top + "px "
                                                + this.border.right + "px "
                                                + this.border.bottom + "px "
                                                + this.border.left + "px";

        this.dom.style.borderImageSlice = this.border.top + " "
                                                + this.border.right + " "
                                                + this.border.bottom + " "
                                                + this.border.left + " "
                                                + "fill";
        this.dom.style.borderImageRepeat = this.horizontalTileMode + " "
                                                    + this.verticalTileMode;
        this.dom.style.borderImageWidth = this.border.top + "px "
                                                + this.border.right + "px "
                                                + this.border.bottom + "px "
                                                + this.border.left + "px";
    }
  }
});
