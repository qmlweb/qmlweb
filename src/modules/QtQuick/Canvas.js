// TODO
// Currently only a skeleton implementation

// eslint-disable-next-line no-undef
class QtQuick_Canvas extends QtQuick_Item {
  static properties = {
    available: { type: "bool", initialValue: true },
    canvasSize: { type: "var", initialValue: [0, 0] },
    canvasWindow: { type: "var", initialValue: [0, 0, 0, 0] },
    context: { type: "var", initialValue: {} },
    contextType: { type: "string", initialValue: "contextType" },
    renderStrategy: "enum",
    renderTarget: "enum",
    tileSize: { type: "var", initialValue: [0, 0] }
  };
  static signals = {
    imageLoaded: [],
    paint: [{ type: "var", name: "region" }],
    painted: []
  };

  cancelRequestAnimationFrame(/*handle*/) {
    return false;
  }
  getContext(/*context_id, ...args*/) {
    return {};
  }
  isImageError(/*image*/) {
    return true;
  }
  isImageLoaded(/*image*/) {
    return false;
  }
  isImageLoading(/*image*/) {
    return false;
  }
  loadImage(image) {
    //loadImageAsync(image);
    if (this.isImageLoaded(image)) {
      this.imageLoaded();
    }
  }
  markDirty(area) {
    // if dirty
    this.paint(area);
  }
  requestAnimationFrame(/*callback*/) {
    return 0;
  }
  requestPaint() {
  }
  save(/*file_name*/) {
    return false;
  }
  toDataURL(/*mime_type*/) {
    return "";
  }
  unloadImage(/*image*/) {
  }
}
