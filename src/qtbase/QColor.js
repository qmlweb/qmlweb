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
      val = (Math.round(val) + 0x1000000).toString(16).substr(-6);
      this.$value = `#${val}`;
    }
  }
  toString() {
    return this.$value;
  }
  $get() {
    // Returns the same instance for all equivalent colors.
    // Note that we can't return this instance, as it could be changed later.
    // TODO: use a WeakMap with a polyfill to reduce the potential memory hit.
    if (!QColor.colors[this.$value]) {
      QColor.colors[this.$value] = new QColor(this.$value);
    }
    return QColor.colors[this.$value];
  }
}
QColor.colors = {};
QmlWeb.QColor = QColor;
