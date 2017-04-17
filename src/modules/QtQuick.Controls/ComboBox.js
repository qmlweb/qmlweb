QmlWeb.registerQmlType({
  module: "QtQuick.Controls",
  name: "ComboBox",
  versions: /.*/,
  baseClass: "QtQuick.Item",
  properties: {
    count: "int",
    currentIndex: "int",
    size: { type: "int", initialValue: 1 }, // non-standard property to qtquick, but useful in dom
    currentText: "string",
    menu: { type: "array", initialValue: [] },
    model: { type: "array", initialValue: [] },
    pressed: "bool"
  },
  signals: {
    accepted: [],
    activated: [{ type: "int", name: "index" }]
  }
}, class {
  constructor(meta) {
    QmlWeb.callSuper(this, meta);

    this.dom.style.pointerEvents = "auto";
    this.name = "QMLComboBox";

    this.Component.completed.connect(this, this.Component$onCompleted);
    this.modelChanged.connect(this, this.$onModelChanged);
    this.sizeChanged.connect(this, this.$onSizeChanged);
    this.currentIndexChanged.connect(this, this.$onCurrentIndexChanged);
    this.heightChanged.connect(this, this.$onHeightChanged);
    this.widthChanged.connect(this, this.$onWidthChanged);

    this.dom.onclick = () => {
      const index = this.dom.firstChild.selectedIndex;
      this.currentIndex = index;
      this.currentText = this.model[index];
      this.accepted();
      this.activated(index);
    };
  }
  find(text) {
    return this.model.indexOf(text);
  }
  selectAll() {
    // TODO
  }
  textAt(index) {
    return this.model[index];
  }
  $updateImpl() {   
    this.count = this.model.length;
    
    // TODO change innerHTML to DOM
    this.dom.innerHTML = "<select></select>";
    this.impl = this.dom.firstChild;

    const k = this.count; const m = this.model;

    this.impl.options.length = k;
    for(var i = 0; i < k; i++) {
      this.impl.options[i] = new Option(m[i]);
    }    
    
    this.$onSizeChanged();

    // should call this, because width/heights calls updateV(H)Geometry 
    // which sets valid $useImplicitHeight flag    
    var h = this.height; var w = this.width;

    this.implicitWidth = this.impl.offsetWidth;
    this.implicitHeight = this.impl.offsetHeight;

    this.$onHeightChanged();
    this.$onWidthChanged();

    // check wherever currentIndex is in valid range, e.g -1...count
    if (this.currentIndex >= this.count) 
    	  this.currentIndex = this.count-1; 
    else
    if (this.currentIndex < 0 && this.count > 0)
        this.currentIndex = 0;
    
    // should call this to force selected item in newly created select tag
    this.impl.selectedIndex = this.currentIndex;

    if (this.currentText !== this.model[ this.currentIndex ])
        this.currentText = this.model[ this.currentIndex ];        
  }
  Component$onCompleted() {
    this.$updateImpl();
  }
  $onModelChanged() {
    this.$updateImpl();
  }
  $onCurrentIndexChanged() {
    var i = this.currentIndex;
    if (this.dom.firstChild.selectedIndex != i) {
      this.dom.firstChild.selectedIndex = i;
      this.currentText = this.model[i];
      this.activated(i);
    }
  }
  $onHeightChanged() {
    // follow height property of ComboBox for select tag
    // useful in conjuction with 'size: 2'
    if (this.height > 0 && this.impl && this.height != this.impl.offsetHeight) {
      this.impl.style.height = this.height + "px";
    }
  }
  $onWidthChanged() {
    if (this.width > 0 && this.impl && this.width != this.impl.offsetWidth) {
      this.impl.style.width = this.width + "px";
    }
  }
  $onSizeChanged() {
    if (this.impl) this.impl.size = this.size;
  }
});
