// eslint-disable-next-line no-undef
class QtQuick_ListView extends QtQuick_Repeater {
  static properties = {
    orientation: "enum",
    spacing: "real"
  };

  constructor(meta) {
    super(meta);
    this.modelChanged.connect(this, this.$styleChanged);
    this.delegateChanged.connect(this, this.$styleChanged);
    this.orientationChanged.connect(this, this.$styleChanged);
    this.spacingChanged.connect(this, this.$styleChanged);
    this._childrenInserted.connect(this, this.$applyStyleOnItem);
  }
  container() {
    return this;
  }
  $applyStyleOnItem($item) {
    const Qt = QmlWeb.Qt;
    $item.dom.style.position = "initial";
    if (this.orientation === Qt.Horizontal) {
      $item.dom.style.display = "inline-block";
      if ($item !== this.$items[0]) {
        $item.dom.style["margin-left"] = `${this.spacing}px`;
      }
    } else {
      $item.dom.style.display = "block";
      if ($item !== this.$items[0]) {
        $item.dom.style["margin-top"] = `${this.spacing}px`;
      }
    }
  }
  $styleChanged() {
    for (let i = 0; i < this.$items.length; ++i) {
      this.$applyStyleOnItem(this.$items[i]);
    }
  }
}
