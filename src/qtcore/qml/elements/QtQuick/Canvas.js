// TODO
// Currently only a skeleton implementation

registerQmlType({
    module: 'QtQuick',
    name: 'Canvas',
    versions: /.*/,
    baseClass: QMLItem,
    constructor: function(meta) {
        QMLItem.call(this, meta);

        var self = this;

        createProperty({ type: 'bool', object: this, name: 'available' });
        createProperty({ type: 'var', object: this, name: 'canvasSize' });
        createProperty({ type: 'var', object: this, name: 'canvasWindow' });
        createProperty({ type: 'var', object: this, name: 'context' });
        createProperty({ type: 'string', object: this, name: 'contextType' });
        createProperty({ type: 'enum', object: this, name: 'renderStrategy' });
        createProperty({ type: 'enum', object: this, name: 'renderTarget' });
        createProperty({ type: 'var', object: this, name: 'tileSize' });

        this.available = true;
        this.canvasSize = [0, 0];
        this.canvasWindow = [0, 0, 0, 0];
        this.context = {};
        this.contextType = "contextType";
        this.renderStrategy = 0;
        this.renderTarget = 0;
        this.tileSize = [0, 0];

        this.imageLoaded = Signal();
        this.paint = Signal([{type: "var", name: "region"}]);
        this.painted = Signal();

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
