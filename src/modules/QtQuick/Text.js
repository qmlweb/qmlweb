QmlWeb.registerQmlType({
  module: "QtQuick",
  name: "Text",
  versions: /.*/,
  baseClass: "Item",
  enums: {
    Text: {
      NoWrap: 0, WordWrap: 1, WrapAnywhere: 2, Wrap: 3,
      WrapAtWordBoundaryOrAnywhere: 4,
      AlignLeft: 1, AlignRight: 2, AlignHCenter: 4, AlignJustify: 8,
      AlignTop: 32, AlignBottom: 64, AlignVCenter: 128,
      Normal: 0, Outline: 1, Raised: 2, Sunken: 3
    }
  },
  properties: {
    color: { type: "color", initialValue: "black" },
    text: "string",
    font: "font",
    lineHeight: "real",
    wrapMode: { type: "enum", initialValue: 0 }, // Text.NoWrap
    horizontalAlignment: { type: "enum", initialValue: 1 }, // Text.AlignLeft
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
    fc.style.whiteSpace = "pre";
    this.dom.style.textAlign = "left";
    this.dom.appendChild(fc);

    this.colorChanged.connect(this, this.$onColorChanged);
    this.textChanged.connect(this, this.$onTextChanged);
    this.lineHeightChanged.connect(this, this.$onLineHeightChanged);
    this.wrapModeChanged.connect(this, this.$onWrapModeChanged);
    this.horizontalAlignmentChanged.connect(this,
                                            this.$onHorizontalAlignmentChanged);
    this.styleChanged.connect(this, this.$onStyleChanged);
    this.styleColorChanged.connect(this, this.$onStyleColorChanged);

    this.widthChanged.connect(this, this.$onWidthChanged);
    this.fontChanged.connect(this, this.$onFontChanged);

    this.Component.completed.connect(this, this.Component$onCompleted);
  }
  $onColorChanged(newVal) {
    this.impl.style.color = newVal.$css;
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
    this.$updateShadow(newVal, this.styleColor.$css);
  }
  $onStyleColorChanged(newVal) {
    this.$updateShadow(this.style, newVal.$css);
  }
  $onWrapModeChanged(newVal) {
    const style = this.impl.style;
    switch (newVal) {
      case this.Text.NoWrap:
        style.whiteSpace = "pre";
        break;
      case this.Text.WordWrap:
        style.whiteSpace = "pre-wrap";
        style.wordWrap = "normal";
        break;
      case this.Text.WrapAnywhere:
        style.whiteSpace = "pre-wrap";
        style.wordBreak = "break-all";
        break;
      case this.Text.Wrap:
      case this.Text.WrapAtWordBoundaryOrAnywhere:
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
  }
  $updateImplicit() {
    if (!this.text || !this.dom) {
      this.implicitHeight = this.implicitWidth = 0;
      return;
    }

    if (!this.$isUsingImplicitWidth) {
      this.implicitWidth = this.impl.offsetWidth;
      this.implicitHeight = this.impl.offsetHeight;
      return;
    }

    const fc = this.impl;
    const engine = QmlWeb.engine;
    // Need to move the child out of it's parent so that it can properly
    // recalculate it's "natural" offsetWidth/offsetHeight
    if (engine.dom === document.body && engine.dom !== engine.domTarget) {
      // Can't use document.body here, as it could have Shadow DOM inside
      // The root is document.body, though, so it's probably not hidden
      engine.domTarget.appendChild(fc);
    } else {
      document.body.appendChild(fc);
    }
    const height = fc.offsetHeight;
    const width = fc.offsetWidth;
    this.dom.appendChild(fc);

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
