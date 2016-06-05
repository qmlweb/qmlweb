function QMLButton(meta) {
    callSuper(this, meta);
    this.dom = document.createElement("button");
    var self = this;

    this.dom.style.pointerEvents = "auto";
    this.dom.innerHTML = "<span></span>";

    createProperty("string", this, "text");
    createProperty("bool", this, "enabled", {initialValue: true});
    this.clicked = Signal();

    this.Component.completed.connect(this, function() {
        this.implicitWidth = this.dom.offsetWidth;
        this.implicitHeight = this.dom.offsetHeight;
    });
    this.textChanged.connect(this, function(newVal) {
        this.dom.firstChild.innerHTML = newVal;
        //TODO: Replace those statically sized borders
        this.implicitWidth = this.dom.offsetWidth;
        this.implicitHeight = this.dom.offsetHeight;
    });
    this.enabledChanged.connect(this, function(newVal) {
        this.dom.disabled = !newVal;
    });

    this.dom.onclick = function(e) {
        self.clicked();
    }
}

registerQmlType({
  module: 'QtQuick.Controls',
  name: 'Button',
  versions: /.*/,
  baseClass: 'QtQuick.Item',
  constructor: QMLButton
});
