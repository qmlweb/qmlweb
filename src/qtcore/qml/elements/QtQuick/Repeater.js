registerQmlType({
  module:   'QtQuick',
  name:     'Repeater',
  versions: /.*/,
  constructor: function QMLRepeater(meta) {
    QMLItem.call(this, meta);
    var self = this;
    
    var QMLListModel = getConstructor('QtQuick', '2.0', 'ListModel');

    this.parent = meta.parent; // TODO: some (all ?) of the components including Repeater needs to know own parent at creation time. Please consider this major change.
    
    createSimpleProperty("Component", this, "delegate");
    this.container = function() { return this.parent; }
    this.$defaultProperty = "delegate";
    createSimpleProperty("variant", this, "model");
    createSimpleProperty("int", this, "count");
    this.$completed = false;
    this.$items = []; // List of created items
    this._childrenInserted = Signal();

    this.modelChanged.connect(applyModel);
    this.delegateChanged.connect(applyModel);
    this.parentChanged.connect(applyModel);
 
    this.count = 0;

    this.itemAt = function(index) {
        return this.$items[index];
    }

    function callOnCompleted(child) {
        child.Component.completed();
        for (var i = 0; i < child.children.length; i++)
            callOnCompleted(child.children[i]);
    }
    function insertChildren(startIndex, endIndex) {
        
        if (endIndex <= 0) return;
                
        var index = 0;
        var model = self.model instanceof QMLListModel ? self.model.$model : self.model;
        var newItem;
        var l=0;
        var roleName;
        var isEngineInit = engine.operationState == QMLOperationState.Init;
          
        for ( index = startIndex; index < endIndex; index++) {
            newItem = self.delegate.createObject();
            newItem.parent = self.parent;
            self.delegate.finalizeImports(); // To properly import JavaScript in the context of a component 

            
            createSimpleProperty("int", newItem, "index");
            newItem.index = index;
       
            if ( typeof model == "number" || model instanceof Array ) {
                 if (typeof newItem.$properties["modelData"] == 'undefined'){
                    createSimpleProperty("variant", newItem, "modelData");
                 }
                
                 var value = model instanceof Array ? model[index] : typeof model == "number" ? index : "undefined";
                 newItem.$properties["modelData"].set(value, true, newItem, model.$context);
            } else {
                for (var i=0;i<model.roleNames.length;i++) {
                    roleName = model.roleNames[i];
                    if (typeof newItem.$properties[roleName] == 'undefined')
                    createSimpleProperty("variant", newItem, roleName);
                    newItem.$properties[roleName].set(model.data(index, roleName), true, newItem, self.model.$context);
                }
                
            }
            
            self.$items.splice(index, 0, newItem);

            if (isEngineInit == false) {
                // We don't call those on first creation, as they will be called
                // by the regular creation-procedures at the right time.
                callOnCompleted(newItem);
            }
        }
         if (isEngineInit == false) {
             // We don't call those on first creation, as they will be called
             // by the regular creation-procedures at the right time.
             engine.$initializePropertyBindings();    
        }
            
        if (index > 0) {
            self.container().childrenChanged();
        }
        
        l = self.$items.length;
        for (var i = endIndex; i < l; i++)
            self.$items[i].index = i;

        self.count = l;
    }

    function onModelDataChanged(startIndex, endIndex) { //TODO
    }
    function onRowsMoved(sourceStartIndex, sourceEndIndex, destinationIndex){
        var i, l;
        var vals = self.$items.splice(sourceStartIndex, sourceEndIndex-sourceStartIndex);

        for (i = 0; i < vals.length; i++) {
            self.$items.splice(destinationIndex + i, 0, vals[i]);
        }
        var smallestChangedIndex = sourceStartIndex < destinationIndex
                                ? sourceStartIndex : destinationIndex;
        for (i = smallestChangedIndex; i < self.$items.length; i++) {
            self.$items[i].index = i;
        } 
    }
    function onRowsRemoved(startIndex, endIndex){
        removeChildren(startIndex, endIndex);
        
        var l = self.$items.length;
        for (var i = startIndex; i < l; i++) {
            self.$items[i].index = i;
        }
        self.count = l;
    }
    function onModelReset(){
       var model = self.model instanceof QMLListModel ? self.model.$model : self.model;
       removeChildren(0, self.$items.length);
    }
    function applyModel() {
        
        if (!self.delegate || !self.parent)
            return;
        
        removeChildren(0, self.$items.length);
                         
        var model = self.model instanceof QMLListModel ? self.model.$model : self.model;
     
        if (model instanceof JSItemModel) {
            
            if ( model.dataChanged.isConnected(onModelDataChanged) == false ) model.dataChanged.connect(onModelDataChanged);
            if ( model.rowsInserted.isConnected(insertChildren) == false ) model.rowsInserted.connect(insertChildren);
            if ( model.rowsMoved.isConnected(onRowsMoved) == false  ) model.rowsMoved.connect(onRowsMoved);
            if ( model.rowsRemoved.isConnected(onRowsRemoved) == false  ) model.rowsRemoved.connect(onRowsRemoved);
            if ( model.modelReset.isConnected(onModelReset) == false  ) model.modelReset.connect(onModelReset);
    
            insertChildren(0, model.rowCount());
        } else if (typeof model == "number") {
            insertChildren(0, model);
        } else if (model instanceof Array) {
            insertChildren(0, model.length);
        }  
        
    }
    
    function removeChildren(startIndex, endIndex) {
        var removed = self.$items.splice(startIndex, endIndex - startIndex);
        var l = removed.length;
        var item;
        
        for (var i=0;i<l;i++) {
            item = removed[i];
            item.$delete();
            item.parent = undefined;
            removeChildProperties(item);
        }
    }
    function removeChildProperties(child) {
        engine.completedSignals.splice(engine.completedSignals.indexOf(child.Component.completed), 1);
        
        var l = child.children.length;
        for (var i = 0; i < l; i++)
            removeChildProperties(child.children[i])
    }
  }
});
