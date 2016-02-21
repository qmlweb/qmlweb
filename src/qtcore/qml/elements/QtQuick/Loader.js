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
    constructor: function QMLLoader(meta) {
        QMLItem.call(this, meta);

        var self = this;

        createSimpleProperty('bool', this, 'active');   //totest
        createSimpleProperty('bool', this, 'asynchronous');  //todo
        createSimpleProperty('var', this, 'item');
        createSimpleProperty('real', this, 'progress'); //todo
        createSimpleProperty('url', this, 'source');
        createSimpleProperty('Component', this, 'sourceComponent');   //totest
        createSimpleProperty('enum', this, 'status');


        this.active = true;
        this.asynchronous = false;
        this.item = undefined;
        this.progress = 0.0;
        this.source = undefined;
        this.sourceComponent = undefined;
        this.status = 1;
        this.sourceUrl = '';

        this.loaded = Signal();
 
        this.activeChanged.connect( function(newVal) {
                                   
            if (self.active){
                if (self.source) 
                    sourceChanged(); 
                else if (self.sourceComponent)
                    sourceComponentChanged();
            }else{
                unload();
            }
         });
        
        this.sourceChanged.connect( function(newVal) {
            if (self.active == false )//|| (newVal == self.sourceUrl && self.item !== undefined) ) //todo
            {
                console.log( " Loader isn't active.");
                return;  
            }
            
            unload();
            
            if (self.source.length>0) { 
               var fileName = newVal.lastIndexOf(".qml") == newVal.length-4 ? newVal.substring(0, newVal.length-4) : "";

               if ( fileName !== "" ) {
             
                   var tree = engine.loadComponent(fileName);               
                   var meta = { object: tree, context: self , parent: self};
                    
                   var qmlComponent = new QMLComponent(meta);
                   var loadedComponent = createComponentObject(qmlComponent, self);
                   
                   self.sourceComponent = loadedComponent; 
                   self.sourceUrl = newVal;
               }
            }

        } );
        
        this.sourceComponentChanged.connect(function(newItem) {

            if ( self.active == false ) {
                return;
            }
            
            unload();
            
            var qmlComponent = newItem;
             
            if (newItem instanceof QMLComponent) {
                  var meta = { object: newItem.$metaObject, context: self , parent: self};
                  qmlComponent = construct(meta);      
            }
        
            qmlComponent.parent = self;
            self.item = qmlComponent;
    
            updateGeometry();

            if (self.item){
                // setTimeout(self.loaded(), 5000)
                self.loaded();
            }
        } );
        
        
        this.widthChanged.connect(function(newWidth) {updateGeometry();} );
        this.heightChanged.connect(function(newHeight) {updateGeometry();} );
  
        function createComponentObject(qmlComponent, parent){
            var newComponent = qmlComponent.createObject(parent);
                    
            newComponent.parent = parent;
            qmlComponent.finalizeImports();
                
             if (engine.operationState !== QMLOperationState.Init) {
                 
             //   We don't call those on first creation, as they will be called
             //   by the regular creation-procedures at the right time.
                engine.$initializePropertyBindings();
                callOnCompleted(newComponent);
             }    
     
            return newComponent;           
        }
        
        function updateGeometry(){
            // Loader size doesn't exist
            if (!self.width) {
                self.width = self.item ? self.item.width : 0;
            }
            else{
                // Loader size exists
                if (self.item) self.item.width = self.width;
            }
            
            if (!self.height) {
                self.height = self.item ? self.item.height : 0;
            } else {
                // Loader size exists
                 if (self.item) self.item.height = self.height;
            }
        }
        
        function unload(){
          if (self.item){
            self.item.$delete();            
            self.item.parent = undefined;
            self.item = undefined;
          }
        }

        function callOnCompleted(child) {
            child.Component.completed();
            for (var i = 0; i < child.children.length; i++)
                callOnCompleted(child.children[i]);
        }
  
        this.setSource = function(url, options) {
            this.sourceUrl = url;
            this.props = options;
            this.source = url;
        }

    }
});

