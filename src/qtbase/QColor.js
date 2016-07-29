// TODO complete implementation (with attributes `r`,`g` and `b`).

class QColor {
  constructor(val) {
    this.$value = "black";
    if (val instanceof QColor) {
      // Copy constructor
      this.$value = val.$value;
    } else if (typeof val === "string") {
      this.$value = val.toLowerCase();
    } else if (typeof val === "number") {
      // we assume it is int value and must be converted to css hex with padding
      const rgb = (Math.round(val) + 0x1000000).toString(16).substr(-6);
      this.$value = `#${rgb}`;
    }
  }
  toString() {
    return this.$value;
  }
  $get() {
    // Returns the same instance for all equivalent colors.
    // NOTE: the returned value should not be changed using method calls, if
    // those would be added in the future, the returned value should be wrapped.
    if (!QColor.$colors[this.$value]) {
      if (QColor.$colorsCount >= QColor.comparableColorsLimit) {
        // Too many colors created, bail out to avoid memory hit
        return this;
      }
      QColor.$colors[this.$value] = this;
      QColor.$colorsCount++;
      if (QColor.$colorsCount === QColor.comparableColorsLimit) {
        console.warn(
          "QmlWeb: the number of QColor instances reached the limit set in",
          "QmlWeb.QColor.comparableColorsLimit. Further created colors would",
          "not be comparable to avoid memory hit."
        );
      }
    }
    return QColor.$colors[this.$value];
  }
}
QColor.$colors = {};
QColor.$colorsCount = 0;
QColor.comparableColorsLimit = 10000;
QmlWeb.QColor = QColor;
