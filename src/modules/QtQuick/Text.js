registerQmlType({
  module:   'QtQuick',
  name:     'Text',
  versions: /.*/,
  baseClass: "Item",
  enums: {
    Text: {
      NoWrap: 0, WordWrap: 1, WrapAnywhere: 2, Wrap: 3, WrapAtWordBoundaryOrAnywhere: 3,
      AlignLeft: "left", AlignRight: "right", AlignHCenter: "center", AlignJustify: "justify",
      Normal: 0, Outline: 1, Raised: 2, Sunken: 3
    }
  },
  properties: {
    color: "color",
    text: "string",
    lineHeight: "real",
    wrapMode: "enum",
    horizontalAlignment: "enum",
    style: "enum",
    styleColor: "color"
  }
}, class {
  constructor(meta) {
    callSuper(this, meta);

    const fc = this.impl = document.createElement('span');
    fc.style.pointerEvents = 'none';
    fc.style.width = '100%';
    fc.style.height = '100%';
    this.dom.appendChild(fc);

    const QMLFont = getConstructor('QtQuick', '2.0', 'Font');
    this.font   = new QMLFont(this);

    this.colorChanged.connect(this, function(newVal) {
        fc.style.color = QColor(newVal);
    });
    this.textChanged.connect(this, function(newVal) {
        fc.innerHTML = newVal;
    });
    this.lineHeightChanged.connect(this, function(newVal) {
        fc.style.lineHeight = newVal + "px";
    });
    this.wrapModeChanged.connect(this, function(newVal) {
        switch (newVal) {
            case 0:
                fc.style.whiteSpace = "pre";
                break;
            case 1:
                fc.style.whiteSpace = "pre-wrap";
                fc.style.wordWrap = "normal";
                break;
            case 2:
                fc.style.whiteSpace = "pre-wrap";
                fc.style.wordBreak = "break-all";
                break;
            case 3:
                fc.style.whiteSpace = "pre-wrap";
                fc.style.wordWrap = "break-word";
        };
        // AlignJustify doesn't work with pre/pre-wrap, so we decide the
        // lesser of the two evils to be ignoring "\n"s inside the text.
        if (this.horizontalAlignment == "justify")
            fc.style.whiteSpace = "normal";
    });
    this.horizontalAlignmentChanged.connect(this, function(newVal) {
        this.dom.style.textAlign = newVal;
        // AlignJustify doesn't work with pre/pre-wrap, so we decide the
        // lesser of the two evils to be ignoring "\n"s inside the text.
        if (newVal == "justify")
            fc.style.whiteSpace = "normal";
    });
    this.styleChanged.connect(this, function(newVal) {
        switch (newVal) {
            case 0:
                fc.style.textShadow = "none";
                break;
            case 1:
                var color = this.styleColor;
                fc.style.textShadow = "1px 0 0 " + color
                    + ", -1px 0 0 " + color
                    + ", 0 1px 0 " + color
                    + ", 0 -1px 0 " + color;
                break;
            case 2:
                fc.style.textShadow = "1px 1px 0 " + this.styleColor;
                break;
            case 3:
                fc.style.textShadow = "-1px -1px 0 " + this.styleColor;
        };
    });
    this.styleColorChanged.connect(this, function(newVal) {
        newVal = QColor(newVal);
        switch (this.style) {
            case 0:
                fc.style.textShadow = "none";
                break;
            case 1:
                fc.style.textShadow = "1px 0 0 " + newVal
                    + ", -1px 0 0 " + newVal
                    + ", 0 1px 0 " + newVal
                    + ", 0 -1px 0 " + newVal;
                break;
            case 2:
                fc.style.textShadow = "1px 1px 0 " + newVal;
                break;
            case 3:
                fc.style.textShadow = "-1px -1px 0 " + newVal;
        };
    });

    this.font.family = "sans-serif";
    this.font.pointSize = 10;
    this.wrapMode = this.Text.NoWrap;
    this.color = "black";
    this.text = "";

    this.textChanged.connect(this, updateImplicit);
    this.font.boldChanged.connect(this, updateImplicit);
    this.font.weightChanged.connect(this, updateImplicit);
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
            this.implicitHeight = fc.offsetHeight;
            this.implicitWidth = fc.offsetWidth;
        }
    }
  }
});
