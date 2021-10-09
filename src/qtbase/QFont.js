class QFont extends QmlWeb.QObject {
  constructor(parent) {
    super(parent);
    this.Font = QFont.Font;

    const Font = this.Font;

    QmlWeb.createProperties(this, {
      bold: "bool",
      capitalization: { type: "enum", initialValue: Font.MixedCase },
      family: { type: "string", initialValue: "sans-serif" },
      italic: "bool",
      letterSpacing: "real",
      pixelSize: { type: "int", initialValue: 13 },
      pointSize: { type: "real", initialValue: 10 },
      strikeout: "bool",
      underline: "bool",
      weight: { type: "enum", initialValue: Font.Normal },
      wordSpacing: "real"
    });

    this.$sizeLock = false;

    this.boldChanged.connect(this, this.$onBoldChanged);
    this.capitalizationChanged.connect(this, this.$onCapitalizationChanged);
    this.familyChanged.connect(this, this.$onFamilyChanged);
    this.italicChanged.connect(this, this.$onItalicChanged);
    this.letterSpacingChanged.connect(this, this.$onLetterSpacingChanged);
    this.pixelSizeChanged.connect(this, this.$onPixelSizeChanged);
    this.pointSizeChanged.connect(this, this.$onPointSizeChanged);
    this.strikeoutChanged.connect(this, this.$onStrikeoutChanged);
    this.underlineChanged.connect(this, this.$onUnderlineChanged);
    this.weightChanged.connect(this, this.$onWidthChanged);
    this.wordSpacingChanged.connect(this, this.$onWordSpacingChanged);
  }
  $onBoldChanged(newVal) {
    const Font = this.Font;
    this.weight = newVal ? Font.Bold : Font.Normal;
    this.$parent.$Component.completed();
  }
  $onCapitalizationChanged(newVal) {
    const style = this.$parent.dom.firstChild.style;
    style.fontVariant = newVal === this.Font.SmallCaps ? "small-caps" : "none";
    style.textTransform = this.$capitalizationToTextTransform(newVal);
    this.$parent.$Component.completed();
  }
  $onFamilyChanged(newVal) {
    const style = this.$parent.dom.firstChild.style;
    style.fontFamily = newVal;
    this.$parent.$Component.completed();
  }
  $onItalicChanged(newVal) {
    const style = this.$parent.dom.firstChild.style;
    style.fontStyle = newVal ? "italic" : "normal";
    this.$parent.$Component.completed();
  }
  $onLetterSpacingChanged(newVal) {
    const style = this.$parent.dom.firstChild.style;
    style.letterSpacing = newVal !== undefined ? `${newVal}px` : "";
    this.$parent.$Component.completed();
  }
  $onPixelSizeChanged(newVal) {
    if (!this.$sizeLock) {
      this.pointSize = newVal * 0.75;
    }
    const val = `${newVal}px`;
    this.$parent.dom.style.fontSize = val;
    this.$parent.dom.firstChild.style.fontSize = val;
    this.$parent.$Component.completed();
  }
  $onPointSizeChanged(newVal) {
    this.$sizeLock = true;
    this.pixelSize = Math.round(newVal / 0.75);
    this.$sizeLock = false;
    this.$parent.$Component.completed();
  }
  $onStrikeoutChanged(newVal) {
    const style = this.$parent.dom.firstChild.style;
    style.textDecoration = newVal
      ? "line-through"
      : this.$parent.font.underline
        ? "underline"
        : "none";
    this.$parent.$Component.completed();
  }
  $onUnderlineChanged(newVal) {
    const style = this.$parent.dom.firstChild.style;
    style.textDecoration = this.$parent.font.strikeout
      ? "line-through"
      : newVal
        ? "underline"
        : "none";
    this.$parent.$Component.completed();
  }
  $onWidthChanged(newVal) {
    const style = this.$parent.dom.firstChild.style;
    style.fontWeight = this.$weightToCss(newVal);
    this.$parent.$Component.completed();
  }
  $onWordSpacingChanged(newVal) {
    const style = this.$parent.dom.firstChild.style;
    style.wordSpacing = newVal !== undefined ? `${newVal}px` : "";
    this.$parent.$Component.completed();
  }

  $weightToCss(weight) {
    const Font = this.Font;
    switch (weight) {
      case Font.Thin: return "100";
      case Font.ExtraLight: return "200";
      case Font.Light: return "300";
      case Font.Normal: return "400";
      case Font.Medium: return "500";
      case Font.DemiBold: return "600";
      case Font.Bold: return "700";
      case Font.ExtraBold: return "800";
      case Font.Black: return "900";
    }
    return "normal";
  }
  $capitalizationToTextTransform(capitalization) {
    const Font = this.Font;
    switch (capitalization) {
      case Font.AllUppercase: return "uppercase";
      case Font.AllLowercase: return "lowercase";
      case Font.Capitalize: return "capitalize";
    }
    return "none";
  }

  static Font = {
    // Capitalization
    MixedCase: 0,
    AllUppercase: 1,
    AllLowercase: 2,
    SmallCaps: 3,
    Capitalize: 4,
    // Weight
    Thin: 0,
    ExtraLight: 12,
    Light: 25,
    Normal: 50,
    Medium: 57,
    DemiBold: 63,
    Bold: 75,
    ExtraBold: 81,
    Black: 87
  };
  static requireParent = true;
}

QmlWeb.QFont = QFont;
global.Font = QFont.Font; // HACK
