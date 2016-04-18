/**
 *
 * Loader is used to dynamically load QML components.
 *
 * Loader can load a QML file (using the source property)
 * or a Component object (using the sourceComponent property).
 * It is useful for delaying the creation of a component until
 * it is required: for example, when a component should be created
 * on demand, or when a component should not be created unnecessarily
 * for performance reasons.
 *
 */

registerQmlType({
    module: 'QtQuick',
    name: 'Loader',
    versions: /.*/,
    baseClass: QMLItem,
    constructor: function(meta) {
        QMLItem.call(this, meta);

        var self = this;

        createProperty({ type: 'bool', object: this, name: 'active' });
        createProperty({ type: 'bool', object: this, name: 'asynchronous' });
        createProperty({ type: 'var', object: this, name: 'item' });
        createProperty({ type: 'real', object: this, name: 'progress' });
        createProperty({ type: 'url', object: this, name: 'source' });
        createProperty({ type: 'Component', object: this, name: 'sourceComponent' });
        createProperty({ type: 'enum', object: this, name: 'status' });

        this.active = true;
        this.asynchronous = false;
        this.item = undefined;
        this.progress = 0.0;
        this.source = undefined;
        this.sourceComponent = undefined;
        this.status = 1;

        this.loaded = Signal();

        this.qml = 'not set';
        this.sourceUrl = 'empty';
        this.sourceQml = 'empty';

        this.setSource = function(url, options) {
            this.sourceUrl = url;
            this.sourceQml = getUrlContents(url);

            this.props = options;
            this.source = url;
            this.sourceComponent = null; // TODO Component
            this.item = {}; // TODO
            this.loaded();
        }

    }
});
