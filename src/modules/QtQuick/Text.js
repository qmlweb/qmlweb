QmlWeb.registerQmlType({
  module: "QtQuick",
  name: "Text",
  versions: /.*/,
  baseClass: "Item",
  enums: {
    Text: {
      NoWrap: 0, WordWrap: 1, WrapAnywhere: 2, Wrap: 3,
      WrapAtWordBoundaryOrAnywhere: 3,
      AlignLeft: 1, AlignRight: 2, AlignHCenter: 4, AlignJustify: 8,
      AlignTop: 32, AlignBottom: 64, AlignVCenter: 128,
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
    QmlWeb.callSuper(this, meta);

    const fc = this.impl = document.createElement("span");
    fc.style.pointerEvents = "none";
    fc.style.width = "100%";
    fc.style.height = "100%";
    this.dom.appendChild(fc);

    const QMLFont = QmlWeb.getConstructor("QtQuick", "2.0", "Font");
    this.font = new QMLFont(this);

    this.colorChanged.connect(this, this.$onColorChanged);
    this.textChanged.connect(this, this.$onTextChanged);
    this.lineHeightChanged.connect(this, this.$onLineHeightChanged);
    this.wrapModeChanged.connect(this, this.$onWrapModeChanged);
    this.horizontalAlignmentChanged.connect(this,
                                            this.$onHorizontalAlignmentChanged);
    this.styleChanged.connect(this, this.$onStyleChanged);
    this.styleColorChanged.connect(this, this.$onStyleColorChanged);

    this.font.family = "sans-serif";
    this.font.pointSize = 10;
    this.wrapMode = this.Text.NoWrap;
    this.color = "black";
    this.text = "";

    this.widthChanged.connect(this, this.$onWidthChanged);

    this.font.boldChanged.connect(this, this.$onFontChanged);
    this.font.weightChanged.connect(this, this.$onFontChanged);
    this.font.pixelSizeChanged.connect(this, this.$onFontChanged);
    this.font.pointSizeChanged.connect(this, this.$onFontChanged);
    this.font.familyChanged.connect(this, this.$onFontChanged);
    this.font.letterSpacingChanged.connect(this, this.$onFontChanged);
    this.font.wordSpacingChanged.connect(this, this.$onFontChanged);

    this.Component.completed.connect(this, this.Component$onCompleted);
  }
  $onColorChanged(newVal) {
    this.impl.style.color = new QmlWeb.QColor(newVal);
  }
  $onTextChanged(newVal) {
    this.impl.innerHTML = newVal;
    this.$updateImplicit();
  }
  $onWidthChanged() {
    this.$updateImplicit();
  }
  $onLineHeightChanged(newVal) {
    this.impl.style.lineHeight = `${newVal}px`;
    this.$updateImplicit();
  }
  $onStyleChanged(newVal) {
    this.$updateShadow(newVal, this.styleColor);
  }
  $onStyleColorChanged(newVal) {
    this.$updateShadow(this.style, new QmlWeb.QColor(newVal));
  }
  $onWrapModeChanged(newVal) {
    const style = this.impl.style;
    switch (newVal) {
      case 0:
        style.whiteSpace = "pre";
        break;
      case 1:
        style.whiteSpace = "pre-wrap";
        style.wordWrap = "normal";
        break;
      case 2:
        style.whiteSpace = "pre-wrap";
        style.wordBreak = "break-all";
        break;
      case 3:
        style.whiteSpace = "pre-wrap";
        style.wordWrap = "break-word";
    }
    this.$updateJustifyWhiteSpace();
  }
  $onHorizontalAlignmentChanged(newVal) {
    let textAlign = null;
    switch (newVal) {
      case this.Text.AlignLeft:
        textAlign = "left";
        break;
      case this.Text.AlignRight:
        textAlign = "right";
        break;
      case this.Text.AlignHCenter:
        textAlign = "center";
        break;
      case this.Text.AlignJustify:
        textAlign = "justify";
        break;
    }
    this.dom.style.textAlign = textAlign;
    this.$updateJustifyWhiteSpace();
  }
  $onFontChanged() {
    this.$updateImplicit();
  }
  Component$onCompleted() {
    this.$updateImplicit();
    this.$onWrapModeChanged(this.wrapMode);
  }
  $updateImplicit() {
    if (!this.text || !this.dom) {
      this.implicitHeight = this.implicitWidth = 0;
      return;
    }
    const fc = this.impl;
    // Need to move the child out of it's parent so that it can properly
    // recalculate it's "natural" offsetWidth/offsetHeight
    if (this.$isUsingImplicitWidth) {
      document.body.appendChild(fc);
    }
    const height = fc.offsetHeight;
    const width = fc.offsetWidth;
    if (this.$isUsingImplicitWidth) {
      this.dom.appendChild(fc);
    }

    this.implicitHeight = height;
    this.implicitWidth = width;
  }
  $updateShadow(textStyle, styleColor) {
    const style = this.impl.style;
    switch (textStyle) {
      case 0:
        style.textShadow = "none";
        break;
      case 1:
        style.textShadow = [
          `1px 0 0 ${styleColor}`,
          `-1px 0 0 ${styleColor}`,
          `0 1px 0 ${styleColor}`,
          `0 -1px 0 ${styleColor}`
        ].join(",");
        break;
      case 2:
        style.textShadow = `1px 1px 0 ${styleColor}`;
        break;
      case 3:
        style.textShadow = `-1px -1px 0 ${styleColor}`;
        break;
    }
  }
  $updateJustifyWhiteSpace() {
    const style = this.impl.style;
    // AlignJustify doesn't work with pre/pre-wrap, so we decide the lesser of
    // the two evils to be ignoring "\n"s inside the text.
    if (this.horizontalAlignment === this.Text.AlignJustify) {
      style.whiteSpace = "normal";
    }
    this.$updateImplicit();
  }
});
