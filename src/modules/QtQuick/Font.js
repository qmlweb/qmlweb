registerQmlType({
  module: "QtQuick",
  name: "Font",
  versions: /.*/,
  baseClass: "QtQml.QtObject"
}, class extends QObject {
  constructor(parent) {
    super(parent);
    createProperty("bool", this, "bold");
    createProperty("enum", this, "capitalization", { initialValue: Font.MixedCase });
    createProperty("string", this, "family", { initialValue: "sans-serif" });
    createProperty("bool", this, "italic");
    createProperty("real", this, "letterSpacing");
    createProperty("int", this, "pixelSize", { initialValue: 13 });
    createProperty("real", this, "pointSize", { initialValue: 10 });
    createProperty("bool", this, "strikeout");
    createProperty("bool", this, "underline");
    createProperty("enum", this, "weight", { initialValue: Font.Normal });
    createProperty("real", this, "wordSpacing");

    this.$sizeLock = false;

    const weightToCss = (weight) => {
      switch (weight) {
        case Font.Thin:
          return "100";
        case Font.ExtraLight:
          return "200";
        case Font.Light:
          return "300";
        case Font.Normal:
          return "400";
        case Font.Medium:
          return "500";
        case Font.DemiBold:
          return "600";
        case Font.Bold:
          return "700";
        case Font.ExtraBold:
          return "800";
        case Font.Black:
          return "900";
        default:
          return "normal";
      }
    }

    const capitalizationToTextTransform = (capitalization) => {
      switch (capitalization) {
        case Font.AllUppercase:
          return "uppercase";
        case Font.AllLowercase:
          return "lowercase";
        case Font.Capitalize:
          return "capitalize";
        default:
          return "none";
      }
    }

    this.boldChanged.connect(this, this.$onBoldChanged);
        this.capitalizationChanged.connect(function(newVal) {
          parent.dom.firstChild.style.fontVariant =
            newVal === Font.SmallCaps ? "small-caps" : "none";
          parent.dom.firstChild.style.textTransform =
            capitalizationToTextTransform(newVal);
        });
        this.familyChanged.connect(function(newVal) {
            parent.dom.firstChild.style.fontFamily = newVal;
        });
        this.italicChanged.connect(function(newVal) {
            parent.dom.firstChild.style.fontStyle = newVal ? "italic" : "normal";
        });
        this.letterSpacingChanged.connect(function(newVal) {
            parent.dom.firstChild.style.letterSpacing = newVal !== undefined ? newVal + "px" : "";
        });
        this.pixelSizeChanged.connect(newVal => {
            if (!this.$sizeLock) {
              this.pointSize = newVal * 0.75;
            }
            const val = newVal + 'px';
            parent.dom.style.fontSize = val;
            parent.dom.firstChild.style.fontSize = val;
        });
        this.pointSizeChanged.connect(newVal => {
            this.$sizeLock = true;
            this.pixelSize = Math.round(newVal / 0.75);
            this.$sizeLock = false;
        });
        this.strikeoutChanged.connect(function(newVal) {
            parent.dom.firstChild.style.textDecoration = newVal
                ? "line-through"
                : parent.font.underline
                ? "underline"
                : "none";
        });
        this.underlineChanged.connect(function(newVal) {
            parent.dom.firstChild.style.textDecoration = parent.font.strikeout
                ? "line-through"
                : newVal
                ? "underline"
                : "none";
        });
        this.weightChanged.connect(function(newVal) {
            var w = weightToCss(newVal);
            parent.dom.firstChild.style.fontWeight = w || "normal";
        });
        this.wordSpacingChanged.connect(function(newVal) {
            parent.dom.firstChild.style.wordSpacing = newVal !== undefined ? newVal + "px" : "";
        });
  }
  $onBoldChanged(newVal) {
    this.weight = newVal ? Font.Bold : Font.Normal;
  }
});
