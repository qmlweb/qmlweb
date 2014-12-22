function QMLBorderImage(meta) {
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

    createSimpleProperty("url", this, "source");
    createSimpleProperty("enum", this, "status");
    this.border = new QObject(this);
    createSimpleProperty("int", this.border, "left");
    createSimpleProperty("int", this.border, "right");
    createSimpleProperty("int", this.border, "top");
    createSimpleProperty("int", this.border, "bottom");
    createSimpleProperty("enum", this, "horizontalTileMode");
    createSimpleProperty("enum", this, "verticalTileMode");

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
                                                + this.border.left;
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
                                                + this.border.left;
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
                                                + this.border.left;
        this.dom.style.OBorderImageRepeat = this.horizontalTileMode + " "
                                                    + this.verticalTileMode;
        this.dom.style.OBorderImageWidth = this.border.top + "px "
                                                + this.border.right + "px "
                                                + this.border.bottom + "px "
                                                + this.border.left + "px";

        this.dom.style.borderImageSlice = this.border.top + " "
                                                + this.border.right + " "
                                                + this.border.bottom + " "
                                                + this.border.left;
        this.dom.style.borderImageRepeat = this.horizontalTileMode + " "
                                                    + this.verticalTileMode;
        this.dom.style.borderImageWidth = this.border.top + "px "
                                                + this.border.right + "px "
                                                + this.border.bottom + "px "
                                                + this.border.left + "px";
    }

    this.$drawItem = function(c) {
        if (this.horizontalTileMode != this.BorderImage.Stretch || this.verticalTileMode != this.BorderImage.Stretch) {
            console.log("BorderImages support only BorderImage.Stretch tileMode currently with the canvas-backend.");
        }
        if (this.status == this.BorderImage.Ready) {
            c.save();
            c.drawImage(img, 0, 0, this.border.left, this.border.top,
                        this.left, this.top, this.border.left, this.border.top);
            c.drawImage(img, img.naturalWidth - this.border.right, 0,
                        this.border.right, this.border.top,
                        this.left + this.width - this.border.right, this.top,
                        this.border.right, this.border.top);
            c.drawImage(img, 0, img.naturalHeight - this.border.bottom,
                        this.border.left, this.border.bottom,
                        this.left, this.top + this.height - this.border.bottom,
                        this.border.left, this.border.bottom);
            c.drawImage(img, img.naturalWidth - this.border.right, img.naturalHeight - this.border.bottom,
                        this.border.right, this.border.bottom,
                        this.left + this.width - this.border.right,
                        this.top + this.height - this.border.bottom,
                        this.border.right, this.border.bottom);

            c.drawImage(img, 0, this.border.top,
                        this.border.left, img.naturalHeight - this.border.bottom - this.border.top,
                        this.left, this.top + this.border.top,
                        this.border.left, this.height - this.border.bottom - this.border.top);
            c.drawImage(img, this.border.left, 0,
                        img.naturalWidth - this.border.right - this.border.left, this.border.top,
                        this.left + this.border.left, this.top,
                        this.width - this.border.right - this.border.left, this.border.top);
            c.drawImage(img, img.naturalWidth - this.border.right, this.border.top,
                        this.border.right, img.naturalHeight - this.border.bottom - this.border.top,
                        this.right - this.border.right, this.top + this.border.top,
                        this.border.right, this.height - this.border.bottom - this.border.top);
            c.drawImage(img, this.border.left, img.naturalHeight - this.border.bottom,
                        img.naturalWidth - this.border.right - this.border.left, this.border.bottom,
                        this.left + this.border.left, this.bottom - this.border.bottom,
                        this.width - this.border.right - this.border.left, this.border.bottom);
            c.restore();
        } else {
            console.log("Waiting for image to load");
        }
    }
}

constructors['BorderImage'] = QMLBorderImage;
