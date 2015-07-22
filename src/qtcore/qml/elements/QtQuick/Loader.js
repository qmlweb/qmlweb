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

        createSimpleProperty('bool', this, 'active');
        createSimpleProperty('bool', this, 'asynchronous');
        createSimpleProperty('var', this, 'item');
        createSimpleProperty('real', this, 'progress');
        createSimpleProperty('url', this, 'source');
        createSimpleProperty('Component', this, 'sourceComponent');
        createSimpleProperty('enum', this, 'status');

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
