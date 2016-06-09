registerQmlType({
  module: 'QtQuick',
  name:   'Font',
  versions: /.*/,
  baseClass: 'QtQml.QtObject',
  constructor: function QMLFont(parent) {
    QObject.call(this);
    createProperty("bool", this, "bold");
    createProperty("enum", this, "capitalization", {initialValue: 0});
    createProperty("string", this, "family", {initialValue: 'sans-serif'});
    createProperty("bool", this, "italic");
    createProperty("real", this, "letterSpacing");
    createProperty("int", this, "pixelSize", {initialValue: 13});
    createProperty("real", this, "pointSize", {initialValue: 10});
    createProperty("bool", this, "strikeout");
    createProperty("bool", this, "underline");
    createProperty("enum", this, "weight");
    createProperty("real", this, "wordSpacing");
    var sizeLock = false;

        this.boldChanged.connect(function(newVal) {
            parent.dom.firstChild.style.fontWeight =
                parent.font.weight !== undefined ? parent.font.weight :
                newVal ? "bold" : "normal";
        });
        this.capitalizationChanged.connect(function(newVal) {
            parent.dom.firstChild.style.fontVariant =
                newVal == "smallcaps" ? "small-caps" : "normal";
            newVal = newVal == "smallcaps" ? "none" : newVal;
            parent.dom.firstChild.style.textTransform = newVal;
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
            if (!sizeLock) {
              this.pointSize = newVal * 0.75;
            }
            const val = newVal + 'px';
            parent.dom.style.fontSize = val;
            parent.dom.firstChild.style.fontSize = val;
        });
        this.pointSizeChanged.connect(newVal => {
            sizeLock = true;
            this.pixelSize = Math.round(newVal / 0.75);
            sizeLock = false;
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
            parent.dom.firstChild.style.fontWeight =
                newVal !== undefined ? newVal :
                parent.font.bold ? "bold" : "normal";
        });
        this.wordSpacingChanged.connect(function(newVal) {
            parent.dom.firstChild.style.wordSpacing = newVal !== undefined ? newVal + "px" : "";
        });
  }
});

