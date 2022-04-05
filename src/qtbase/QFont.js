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
  $style() {
    return this.$parent.dom.firstChild.style;
  }
  $onBoldChanged(newVal) {
    const Font = this.Font;
    this.weight = newVal ? Font.Bold : Font.Normal;
  }
  $onCapitalizationChanged(newVal) {
    const style = this.$style();
    style.fontVariant = newVal === this.Font.SmallCaps ? "small-caps" : "none";
    style.textTransform = this.$capitalizationToTextTransform(newVal);
  }
  $onFamilyChanged(newVal) {
    const style = this.$style();
    style.fontFamily = newVal;
  }
  $onItalicChanged(newVal) {
    const style = this.$style();
    style.fontStyle = newVal ? "italic" : "normal";
  }
  $onLetterSpacingChanged(newVal) {
    const style = this.$style();
    style.letterSpacing = newVal !== undefined ? `${newVal}px` : "";
  }
  $onPixelSizeChanged(newVal) {
    if (!this.$sizeLock) {
      this.pointSize = newVal * 0.75;
    }
    const val = `${newVal}px`;
    this.$parent.dom.style.fontSize = val;
    this.$style().fontSize = val;
  }
  $onPointSizeChanged(newVal) {
    this.$sizeLock = true;
    this.pixelSize = Math.round(newVal / 0.75);
    this.$sizeLock = false;
  }
  $onStrikeoutChanged(newVal) {
    const style = this.$style();
    style.textDecoration = newVal
      ? "line-through"
      : this.$parent.font.underline
        ? "underline"
        : "none";
  }
  $onUnderlineChanged(newVal) {
    const style = this.$style();
    style.textDecoration = this.$parent.font.strikeout
      ? "line-through"
      : newVal
        ? "underline"
        : "none";
  }
  $onWidthChanged(newVal) {
    const style = this.$style();
    style.fontWeight = this.$weightToCss(newVal);
  }
  $onWordSpacingChanged(newVal) {
    const style = this.$style();
    style.wordSpacing = newVal !== undefined ? `${newVal}px` : "";
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
