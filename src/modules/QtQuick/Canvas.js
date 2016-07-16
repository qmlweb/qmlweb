// TODO
// Currently only a skeleton implementation

registerQmlType({
  module: "QtQuick",
  name: "Canvas",
  versions: /.*/,
  baseClass: "Item",
  properties: {
    available: { type: "bool", initialValue: true },
    canvasSize: { type: "var", initialValue: [0, 0] },
    canvasWindow: { type: "var", initialValue: [0, 0, 0, 0] },
    context: { type: "var", initialValue: {} },
    contextType: { type: "string", initialValue: "contextType" },
    renderStrategy: "enum",
    renderTarget: "enum",
    tileSize: { type: "var", initialValue: [0, 0] }
  },
  signals: {
    imageLoaded: [],
    paint: [{ type: "var", name: "region" }],
    painted: []
  }
}, class {
  constructor(meta) {
        callSuper(this, meta);

        var self = this;

        this.cancelRequestAnimationFrame = function(handle) {
            return false;
        };

        this.getContext = function(context_id) {
            var args = arguments.slice(1, arguments.length);
            return {};
        };

        this.isImageError = function(image) {
            return true;
        };

        this.isImageLoaded = function(image) {
            return false;
        };

        this.isImageLoading = function(image) {
            return false;
        };

        this.loadImage = function(image) {
            //loadImageAsync(image);
            if (this.isImageLoaded(image))
                this.imageLoaded();
        };

        this.markDirty = function(area) {
            // if dirty
            this.paint(area);
        };

        this.requestAnimationFrame = function(callback) {
            return 0;
        };

        this.requestPaint = function() {
        };

        this.save = function(file_name) {
            return false;
        };

        this.toDataURL = function(mime_type) {
            return "";
        };

        this.unloadImage = function(image) {
        };
    }
});
