registerQmlType({
    module: 'QtQuick',
    name: 'Loader',
    versions: /.*/,
    baseClass: 'Item',
    constructor: function(meta) {
        callSuper(this, meta);

        createProperty('bool', this, 'active', {initialValue: true});
        createProperty('bool', this, 'asynchronous');
        createProperty('var', this, 'item');
        createProperty('real', this, 'progress');
        createProperty('url', this, 'source');
        createProperty('Component', this, 'sourceComponent');
        createProperty('enum', this, 'status', {initialValue: 1});

        let sourceUrl = '';

        this.loaded = Signal();

        this.activeChanged.connect(() => {
            if (!this.active) {
                unload();
                return;
            }
            if (this.source) {
                sourceChanged();
            } else if (this.sourceComponent) {
                sourceComponentChanged();
            }
        });

        this.sourceChanged.connect(newVal => {
            // if (newVal == sourceUrl && this.item !== undefined) return // TODO
            if (!this.active) {
                return;
            }

            unload();

            // TODO: we require '.qml' for now, that should be fixed
            if (newVal.length <= 4) { // 0
                return;
            }
            if (newVal.substr(newVal.length - 4, 4) !== '.qml') {
                return;
            }
            var fileName = newVal.substring(0, newVal.length - 4);

            var tree = engine.loadComponent(fileName);
            var meta = { object: tree, context: this, parent: this };
            var qmlComponent = new QMLComponent(meta);
            var loadedComponent = createComponentObject(qmlComponent, this);
            this.sourceComponent = loadedComponent;
            sourceUrl = newVal;
        });

        this.sourceComponentChanged.connect(newItem => {
            if (!this.active) {
                return;
            }

            unload();

            var qmlComponent = newItem;

            if (newItem instanceof QMLComponent) {
                  var meta = { object: newItem.$metaObject, context: this, parent: this };
                  qmlComponent = construct(meta);
            }

            qmlComponent.parent = this;
            this.item = qmlComponent;

            updateGeometry();

            if (this.item) {
                this.loaded();
            }
        });

        function createComponentObject(qmlComponent, parent) {
            var newComponent = qmlComponent.createObject(parent);

            newComponent.parent = parent;
            qmlComponent.finalizeImports();

             if (engine.operationState !== QMLOperationState.Init) {
                // We don't call those on first creation, as they will be called
                // by the regular creation-procedures at the right time.
                engine.$initializePropertyBindings();
                callOnCompleted(newComponent);
             }

            return newComponent;
        }

        const updateGeometry = () => {
            // Loader size doesn't exist
            if (!this.width) {
                this.width = this.item ? this.item.width : 0;
            } else if (this.item) {
                // Loader size exists
                this.item.width = this.width;
            }

            if (!this.height) {
                this.height = this.item ? this.item.height : 0;
            } else if (this.item) {
                // Loader size exists
                this.item.height = this.height;
            }
        }
        this.widthChanged.connect(updateGeometry);
        this.heightChanged.connect(updateGeometry);

        const unload = () => {
          if (this.item) {
            this.item.$delete();
            this.item.parent = undefined;
            this.item = undefined;
          }
        }

        function callOnCompleted(child) {
            child.Component.completed();
            child.children.forEach(callOnCompleted);
        }

        this.setSource = function(url, options) {
            sourceUrl = url;
            this.props = options;
            this.source = url;
        }
    }
});
