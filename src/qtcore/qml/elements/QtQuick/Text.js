registerQmlType({
  module:   'QtQuick',
  name:     'Text',
  versions: /.*/,
  constructor: function QMLText(meta) {
    QMLItem.call(this, meta);

    // We create another span inside the text to distinguish the actual
    // (possibly html-formatted) text from child elements
    this.dom.innerHTML = "<span></span>";
    this.dom.firstChild.style.width = "100%";
    this.dom.firstChild.style.height = "100%";

    // Creates font css description
    function fontCss(font) {
        var css = "";
        css += font.italic ? "italic " : "normal ";
        css += font.capitalization == "smallcaps" ? "small-caps " : "normal ";
        // Canvas seems to only support bold yes or no
        css += (font.weight == Font.Bold
            || font.weight == Font.DemiBold
            || font.weight == Font.Black
            || font.bold) ? "bold " : "normal ";
        css += font.pixelSize !== Undefined
            ? font.pixelSize + "px "
            : (font.pointSize || 10) + "pt ";
        css += this.lineHeight !== Undefined ? this.lineHeight + "px " : " ";
        css += (font.family || "sans-serif") + " ";
        return css;
    }

    this.Text = {
        // Wrap Mode
        NoWrap: 0,
        WordWrap: 1,
        WrapAnywhere: 2,
        Wrap: 3,
        WrapAtWordBoundaryOrAnywhere: 3, // COMPAT
        // Horizontal-Alignment
        AlignLeft: "left",
        AlignRight: "right",
        AlignHCenter: "center",
        AlignJustify: "justify",
        // Style
        Normal: 0,
        Outline: 1,
        Raised: 2,
        Sunken: 3
    }

    var QMLFont = new getConstructor('QtQuick', '2.0', 'Font');
    this.font   = new QMLFont(this);

    createSimpleProperty("color", this, "color");
    createSimpleProperty("string", this, "text");
    createSimpleProperty("real", this, "lineHeight");
    createSimpleProperty("enum", this, "wrapMode");
    createSimpleProperty("enum", this, "horizontalAlignment");
    createSimpleProperty("enum", this, "style");
    createSimpleProperty("color", this, "styleColor");

    this.colorChanged.connect(this, function(newVal) {
        this.dom.firstChild.style.color = newVal;
    });
    this.textChanged.connect(this, function(newVal) {
        this.dom.firstChild.innerHTML = newVal;
    });
    this.lineHeightChanged.connect(this, function(newVal) {
        this.dom.firstChild.style.lineHeight = newVal + "px";
    });
    this.wrapModeChanged.connect(this, function(newVal) {
        switch (newVal) {
            case 0:
                this.dom.firstChild.style.whiteSpace = "pre";
                break;
            case 1:
                this.dom.firstChild.style.whiteSpace = "pre-wrap";
                this.dom.firstChild.style.wordWrap = "normal";
                break;
            case 2:
                this.dom.firstChild.style.whiteSpace = "pre-wrap";
                this.dom.firstChild.style.wordBreak = "break-all";
                break;
            case 3:
                this.dom.firstChild.style.whiteSpace = "pre-wrap";
                this.dom.firstChild.style.wordWrap = "break-word";
        };
        // AlignJustify doesn't work with pre/pre-wrap, so we decide the
        // lesser of the two evils to be ignoring "\n"s inside the text.
        if (this.horizontalAlignment == "justify")
            this.dom.firstChild.style.whiteSpace = "normal";
    });
    this.horizontalAlignmentChanged.connect(this, function(newVal) {
        this.dom.style.textAlign = newVal;
        // AlignJustify doesn't work with pre/pre-wrap, so we decide the
        // lesser of the two evils to be ignoring "\n"s inside the text.
        if (newVal == "justify")
            this.dom.firstChild.style.whiteSpace = "normal";
    });
    this.styleChanged.connect(this, function(newVal) {
        switch (newVal) {
            case 0:
                this.dom.firstChild.style.textShadow = "none";
                break;
            case 1:
                var color = this.styleColor;
                this.dom.firstChild.style.textShadow = "1px 0 0 " + color
                    + ", -1px 0 0 " + color
                    + ", 0 1px 0 " + color
                    + ", 0 -1px 0 " + color;
                break;
            case 2:
                this.dom.firstChild.style.textShadow = "1px 1px 0 " + this.styleColor;
                break;
            case 3:
                this.dom.firstChild.style.textShadow = "-1px -1px 0 " + this.styleColor;
        };
    });
    this.styleColorChanged.connect(this, function(newVal) {
        switch (this.style) {
            case 0:
                this.dom.firstChild.style.textShadow = "none";
                break;
            case 1:
                this.dom.firstChild.style.textShadow = "1px 0 0 " + newVal
                    + ", -1px 0 0 " + newVal
                    + ", 0 1px 0 " + newVal
                    + ", 0 -1px 0 " + newVal;
                break;
            case 2:
                this.dom.firstChild.style.textShadow = "1px 1px 0 " + newVal;
                break;
            case 3:
                this.dom.firstChild.style.textShadow = "-1px -1px 0 " + newVal;
        };
    });

    this.font.family = "sans-serif";
    this.font.pointSize = 10;
    this.wrapMode = this.Text.NoWrap;
    this.color = "black";
    this.text = "";

    this.textChanged.connect(this, updateImplicit);
    this.font.boldChanged.connect(this, updateImplicit);
    this.font.pixelSizeChanged.connect(this, updateImplicit);
    this.font.pointSizeChanged.connect(this, updateImplicit);
    this.font.familyChanged.connect(this, updateImplicit);
    this.font.letterSpacingChanged.connect(this, updateImplicit);
    this.font.wordSpacingChanged.connect(this, updateImplicit);

    this.Component.completed.connect(this, updateImplicit);

    function updateImplicit() {
        if (typeof this.text == undefined || this.text === "" || !this.dom) {
             this.implicitHeigh = this.implicitWidth = 0;
        } else {
            var fc = this.dom.firstChild;
            this.implicitHeight = fc.offsetHeight;
            this.implicitWidth = fc.offsetWidth;
        }
    }

    this.$drawItem = function(c) {
        //descr("draw text", this, ["x", "y", "text",
        //                          "implicitWidth", "implicitHeight"]);
        c.save();
        c.font = fontCss(this.font);
        c.fillStyle = this.color;
        c.textAlign = "left";
        c.textBaseline = "top";
        c.fillText(this.text, this.left, this.top);
        c.restore();
    }
  }
});
