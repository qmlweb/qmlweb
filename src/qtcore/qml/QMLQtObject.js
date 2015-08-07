// Base object for all qml elements
function QMLQtObject(meta) {
    QObject.call(this, meta.parent);
    var i,
        prop;

    if (!this.$draw)
        this.$draw = noop;

    if (!this.$isComponentRoot)
        this.$isComponentRoot = meta.isComponentRoot;
    // scope
    this.$context = meta.context;

    // Component.onCompleted
    this.Component = new QObject(this);
    this.Component.completed = Signal([]);
    this.completed = this.Component.completed;
    this.$context.rootComponent.completed.connect(this,"completed")

    this.completedAlreadyCalled = false;

    // Component get own properties
    var attributes = [];
    for (var key in meta.object) {
      if (meta.object.hasOwnProperty(key) &&
          typeof meta.object[key] != 'undefined' && meta.object[key] != null &&
          (meta.object[key].__proto__.constructor.name == 'QMLPropertyDefinition' ||
           meta.object[key].__proto__.constructor.name == 'QMLAliasDefinition')) {
        attributes.push(key);
      }
    }

    this.getAttributes = function() { return (attributes); }
}

constructors['QtObject'] = QMLQtObject;
