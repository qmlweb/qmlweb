QMLComponent.prototype.create = function(context, options) {
    var options = options || {}
    var oldState = qmlEngine.operationState;
    qmlEngine.operationState = QMLOperationState.Init;

    if(context != undefined) {
        this.context = context
    }
    else if(!this.context) {
        this.context = new QMLContext(qmlEngine.rootContext);
    }
    if(this.context.rootComponent) {
        throw "Only one component per context is allowed"
    }
    this.context.rootComponent = this;

    if(typeof baseUrl != "undefined")
        this.context.baseUrl = baseUrl

    if(!options.skipImports)
        loadImports(this.context, this.moduleImports);

    var item = construct({
        object: this.$metaObject,
        parent: this.$parent || null,
        context: this.context,
        isComponentRoot: true
    });
 
    for (var i = 0 ; i < this.jsImports.length ; ++i) {
      var importDesc = this.jsImports[i];
      this.context.importJS(importDesc);
    }

    qmlEngine.operationState = oldState;

    if(!options.skipInitProp)
        qmlEngine.$initializePropertyBindings();
    if(!options.skipCompleted)
        this.completed()

    return item;
}

QMLComponent.prototype.createObject = function (parentObj, properties) {
    var options = {skipInitProp: true, skipCompeted: true}
    if(!this.context) {
        this.context = new QMLContext(qmlEngine.rootContext);
    }
    else if(this.context.parentContext) {
        copyImports(this.context.parentContext.contextId, this.context.contextId)
        options.skipImports = true;
    }

    if(parentObj) {
        this.$parent = parentObj
    }

    debugger;
    var item = this.create(null,options);
    //item.parent = parentObj

    qmlEngine.$initializePropertyBindings();
    this.completed()
}

QMLComponent.prototype.loadUrl = function(url) {
    var tree
    qmlEngine.ensureFileIsLoadedInQrc(url);
    tree = convertToEngine(qrc[url]);
    this.setData(tree, url);
}

function QMLComponent(url) {
    this.url
    this.completed = Signal();
    if(typeof url != "undefined") {
        this.loadUrl(url)
    }
}

QMLComponent.prototype.setData = function(meta, url) {
    if(qmlEngine.debugTree)
        qmlEngine.debugTree(meta)

    if(typeof url != "undefined") {
        this.url = url
        this.baseUrl = pathFromFilepath(url)
    }

    if (constructors[meta.$class] == QMLComponent) {
        if(meta.$children instanceof Array)
            this.$metaObject = meta.$children[0];
        else if(meta.$children instanceof QMLMetaElement)
            this.$metaObject = meta.$children;
    }
    else
        this.$metaObject = meta;

    this.jsImports = [];

    var loadJsImport = (function(importDesc) {
      this.jsImports.push(importDesc);
    }).bind(this);

//    var loadQmlImport = (function(importDesc) {
//      var src = importDesc.subject;
//      var qml;
//
//      if (typeof basePath != 'undefined')
//        src = qmlEngine.basePath + src;
//      qml = getUrlContents(src);
//      qmlEngine.loadQML(qml);
//    });

    this.moduleImports = [];
    if (meta.$imports instanceof Array)
    {
      var loadImport    = (function(importDesc) {
        if (/\.js$/.test(importDesc.subject))
          loadJsImport(importDesc);
//Unsupported in Qt5
//        else if (/\.qml$/.test(importDesc.subject))
//          loadQmlImport(importDesc);
//TODO: directory import
        else
          this.moduleImports.push(importDesc);
      }).bind(this);

      for (var i = 0 ; i < meta.$imports.length ; ++i) {
        loadImport(meta.$imports[i]);
      }
    }
}

registerQmlType('Component',   QMLComponent);
registerQmlType('QMLDocument', QMLComponent);
