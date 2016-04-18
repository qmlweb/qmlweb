registerQmlType({
  module:   'QtQuick',
  name:     'Text',
  versions: /.*/,
  baseClass: QMLItem,
  constructor: function QMLText(meta) {
    QMLItem.call(this, meta);

    // We create another span inside the text to distinguish the actual
    // (possibly html-formatted) text from child elements
    this.dom.innerHTML = "<span></span>";
    this.dom.style.pointerEvents = "auto";
    this.dom.firstChild.style.width = "100%";
    this.dom.firstChild.style.height = "100%";

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

    createProperty({ type: "color", object: this, name: "color" });
    createProperty({ type: "string", object: this, name: "text" });
    createProperty({ type: "real", object: this, name: "lineHeight" });
    createProperty({ type: "enum", object: this, name: "wrapMode" });
    createProperty({ type: "enum", object: this, name: "horizontalAlignment" });
    createProperty({ type: "enum", object: this, name: "style" });
    createProperty({ type: "color", object: this, name: "styleColor" });

    this.colorChanged.connect(this, function(newVal) {
        this.dom.firstChild.style.color = QMLColor(newVal);
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
        newVal = QMLColor(newVal);
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

    this.textChanged.connect(this, updateImplicitHeight);
    this.textChanged.connect(this, updateImplicitWidth);
    this.font.boldChanged.connect(this, updateImplicitHeight);
    this.font.boldChanged.connect(this, updateImplicitWidth);
    this.font.pixelSizeChanged.connect(this, updateImplicitHeight);
    this.font.pixelSizeChanged.connect(this, updateImplicitWidth);
    this.font.pointSizeChanged.connect(this, updateImplicitHeight);
    this.font.pointSizeChanged.connect(this, updateImplicitWidth);
    this.font.familyChanged.connect(this, updateImplicitHeight);
    this.font.familyChanged.connect(this, updateImplicitWidth);
    this.font.letterSpacingChanged.connect(this, updateImplicitHeight);
    this.font.wordSpacingChanged.connect(this, updateImplicitWidth);

    this.Component.completed.connect(this, updateImplicitHeight);
    this.Component.completed.connect(this, updateImplicitWidth);

    function updateImplicitHeight() {
        var height;

        if (this.text === undefined || this.text === "") {
            height = 0;
        } else {
            height = this.dom ? this.dom.firstChild.offsetHeight : 0;
        }

        this.implicitHeight = height;
    }

    function updateImplicitWidth() {
        var width;

        if (this.text === undefined || this.text === "")
            width = 0;
        else
            width = this.dom ? this.dom.firstChild.offsetWidth : 0;

        this.implicitWidth = width;
    }
  }
});
