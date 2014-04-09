registerQmlType({
  module: 'QtQuick',
  name:   'Font',
  versions: /.*/,
  baseClass: QMLBaseObject,
  constructor: function QMLFont(parent) {
    QObject.call(this);
    createProperty({ type: "bool", object: this, name: "bold" });
    createProperty({ type: "enum", object: this, name: "capitalization" });
    createProperty({ type: "string", object: this, name: "family" });
    createProperty({ type: "bool", object: this, name: "italic" });
    createProperty({ type: "real", object: this, name: "letterSpacing" });
    createProperty({ type: "int", object: this, name: "pixelSize" });
    createProperty({ type: "real", object: this, name: "pointSize" });
    createProperty({ type: "bool", object: this, name: "strikeout" });
    createProperty({ type: "bool", object: this, name: "underline" });
    createProperty({ type: "enum", object: this, name: "weight" });
    createProperty({ type: "real", object: this, name: "wordSpacing" });

        this.pointSizeChanged.connect(function(newVal) {
            parent.dom.firstChild.style.fontSize = newVal + "pt";
        });
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
        this.pixelSizeChanged.connect(function(newVal) {
            var val = newVal !== undefined ? newVal + "px "
                : (parent.font.pointSize || 10) + "pt";
            parent.dom.style.fontSize = val;
            parent.dom.firstChild.style.fontSize = val;
        });
        this.pointSizeChanged.connect(function(newVal) {
            var val = parent.font.pixelSize !== undefined ? parent.font.pixelSize + "px "
                : (newVal || 10) + "pt";
            parent.dom.style.fontSize = val;
            parent.dom.firstChild.style.fontSize = val;
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

