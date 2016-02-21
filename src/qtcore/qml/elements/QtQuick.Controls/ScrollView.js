registerQmlType({
  module:   'QtQuick.Controls',
  name:     'ScrollView',
  versions: /.*/,
  constructor: function QMLScrollView(meta) {
    QMLItem.call(this, meta);

    var self = this;
    
 
    this.dom.style.pointerEvents = "auto";
    this.setupFocusOnDom(this.dom);
    
    createSimpleProperty("Item", this, "contentItem");
    this.$defaultProperty = "contentItem";
    createSimpleProperty("Item", this, "flickableItem");  //TODO   0) implement it    1) make it read-only
    createSimpleProperty("Item", this, "viewport");      //TODO 
    createSimpleProperty("bool", this, "frameVisible"); 
    createSimpleProperty("bool", this, "highlightOnFocus"); //TODO test
    createSimpleProperty("enum", this, "verticalScrollBarPolicy"); 
    createSimpleProperty("enum", this, "horizontalScrollBarPolicy"); 
    createSimpleProperty("Component", this, "style");   //TODO
 
 
    this.contentItemChanged.connect(this, function(newItem){
          if (typeof newItem !== undefined)
          {
              newItem.parent = self;
          }
    });
    this.flickableItemChanged.connect(this, function(newItem){});

    this.viewportChanged.connect(this, function(newViewport){});
    
    this.frameVisibleChanged.connect(this, function(visible){
        this.dom.style.border= visible ? "1px solid gray" : "hidden";
    });
    this.highlightOnFocusChanged.connect(this, function(highlight){

    });
    
    this.horizontalScrollBarPolicyChanged.connect(this, function(newPolicy){
        var newVal = "auto";
        switch (newPolicy){
            case Qt.ScrollBarAsNeeded:{
                newVal = "auto";
                break;
            }
            case Qt.ScrollBarAlwaysOff:{
                newVal = "hidden";
                break;
            }
            case Qt.ScrollBarAlwaysOn:{
                newVal = "scroll";
                break;
            }
        }
                    
       this.dom.style.overflowX = newVal;
    });
    this.verticalScrollBarPolicyChanged.connect(this, function(newPolicy){
        var newVal = "auto";
        switch (newPolicy){
            case Qt.ScrollBarAsNeeded:{
                newVal = "auto";
                break;
            }
            case Qt.ScrollBarAlwaysOff:{
                newVal = "hidden";
                break;
            }
            case Qt.ScrollBarAlwaysOn:{
                newVal= "scroll";
                break;
            }            
        }
            
        this.dom.style.overflowY = newVal;
    });
    
    this.styleChanged.connect(this, function(newStyle){});

    ////
    this.childrenChanged.connect(this, function(){
       if (typeof self.contentItem == undefined && self.children.length == 1){
           self.contentItem = self.children[0];
       }
    });
    this.focusChanged.connect(this, function(focus){
        this.dom.style.outline = self.highlight && focus ? "outline: lightblue solid 2px;" : "";
    });
 
    this.width = this.implicitWidth = 240;  // default QML ScrollView width
    this.height = this.implicitHeight = 150; // default QML ScrollView height 
    this.width = this.implicitWidth; 
    this.height = this.implicitHeight;
    
    this.contentItem = undefined;
    this.flickableItem = undefined;
    this.viewport = undefined;
    this.frameVisible = false;
    this.highlightOnFocus = false;
    this.verticalScrollBarPolicy = Qt.ScrollBarAsNeeded;
    this.horizontalScrollBarPolicy = Qt.ScrollBarAsNeeded;
    this.style = undefined;
 
  }
});
