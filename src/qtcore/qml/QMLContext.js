var nextContextId = (function (){var contextId = 0; return function(){return contextId++;}})();

function QMLContext(pc) {
    this.parentContext = pc ? pc : qmlEngine.rootContext;
    this.context = {}
    this.contextId = nextContextId();
    this.object
    this.baseUrl = qmlEngine.baseUrl;
    this.combinedContext = {}
    this.needsRecombine = false;
    this.changed = Signal()
    this.rootComponent
    this.isRootContext = true

    if (this.parentContext) {
        this.parentContext.changed.connect(this, function(){this.needsRecombine = true;})
        this.needsRecombine = true;
        this.rootContext = false;
    }
}

QMLContext.prototype.setContextProperty = function(name, value) {
    this.context[name] = value;
    this.needsRecombine = true;
    this.changed();
}

QMLContext.prototype.contextProperty = function(name) {
    return this.context[name];
}

QMLContext.prototype.setContextObject = function(object) {
    this.object = object
    this.changed.signal();
    this.needsRecombine = true;
}

QMLContext.prototype.getContextObject = function() {
    return this.context
}

QMLContext.prototype.getCombinedContext = function() {
    if(this.rootContext)
        return this.context
    if(this.needsRecombine) {
        this.combinedContext = mergeContext(this.context,this.parentContext.getCombinedContext());
        this.needsRecombine = false;
    }
    return this.combinedContext;
}

function mergeContext(o1, o2) {
    var merge = {};
    var propNames1 = Object.getOwnPropertyNames(o1);
    var propNames2 = Object.getOwnPropertyNames(o2);

    propNames1.forEach(
        function(name){
            var desc = Object.getOwnPropertyDescriptor(o1, name);
            Object.defineProperty(merge, name, desc);
        });
    propNames2.forEach(
        function(name){
            var desc = Object.getOwnPropertyDescriptor(o2, name);
            Object.defineProperty(merge, name, desc);
        });

    return merge;
}

QMLContext.prototype.importJS = function(importDesc) {
    var src = basePath + importDesc.subject;
    var alias = importDesc.alias

    var $jsData;
    if (typeof qrc[src] != 'undefined')
        $jsData = qrc[src];
    else
        $jsData = jsparse(getUrlContents(src));

    this.context[alias] = {};
    var $contextAlias = {}
    with(this.context) {
        eval($jsData.source);
        for (var $iii = 0 ; $iii < $jsData.exports.length ; ++$iii) {
            var $symbolName = $jsData.exports[i];
            $contextAlias = eval($symbolName);
        }
    }
    context[alias] = $contextAlias;
}
