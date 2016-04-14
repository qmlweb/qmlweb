function QMLContext() {
    this.nameForObject = function(obj) {
        for (var name in this) {
            if (this[name] == obj)
                return name;
        }
    }
}

QMLComponent.getAttachedObject = function() { // static
    if (!this.$Component) {
        this.$Component = new QObject(this);
        this.$Component.completed = Signal([]);
        engine.completedSignals.push(this.$Component.completed);

        this.$Component.destruction = Signal([]);
    }
    return this.$Component;
}

QMLComponent.prototype.createObject = function(parent, properties) {
    var oldState = engine.operationState;
    engine.operationState = QMLOperationState.Init;
    // change base path to current component base path
    var bp = engine.$basePath; engine.$basePath = this.$basePath ? this.$basePath : engine.$basePath;

    var item = construct({
        object: this.$metaObject,
        parent: parent,
        context: this.$context ? Object.create(this.$context) : new QMLContext(),
        isComponentRoot: true
    });

    // change base path back
    //TODO looks a bit hacky
    engine.$basePath = bp;

    engine.operationState = oldState;
    return item;
}

function QMLComponent(meta) {
    if (constructors[meta.object.$class] == QMLComponent)
        this.$metaObject = meta.object.$children[0];
    else
        this.$metaObject = meta.object;
    this.$context = meta.context;

    var jsImports = [];

    this.finalizeImports = (function($context) {
      for (var i = 0 ; i < jsImports.length ; ++i) {
        var importDesc = jsImports[i];
        var src = importDesc[1];
        var js;

        if (typeof engine.$basePath != 'undefined')
          src = engine.$basePath + src;
        if (typeof qrc[src] != 'undefined')
          js = qrc[src];
        else
          js = global.jsparse(getUrlContents(src));
        if (importDesc[3] !== "") {
          $context[importDesc[3]] = {};
          importJavascriptInContext(js, $context[importDesc[3]]);
        }
        else
          importJavascriptInContext(js, $context);
      }
    }).bind(this);

    if (meta.object.$imports instanceof Array)
    {
      var moduleImports = [];
      var loadImport    = (function(importDesc) {
        if (/\.js$/.test(importDesc[1]))
          jsImports.push(importDesc);
        else
          moduleImports.push(importDesc);
      }).bind(this);

      for (var i = 0 ; i < meta.object.$imports.length ; ++i) {
        loadImport(meta.object.$imports[i]);
      }
      loadImports(this, moduleImports);
      if (typeof this.$context != 'undefined' && this.$context != null)
        this.finalizeImports(this.$context);
    }
}
inherit(QMLComponent, QMLBaseObject);

registerQmlType('Component',   QMLComponent);
registerQmlType('QMLDocument', QMLComponent);
