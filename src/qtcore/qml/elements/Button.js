function QMLButton(meta) {
    this.dom = document.createElement("button");
    QMLItem.call(this, meta);
    var self = this;

    this.dom.style.pointerEvents = "auto";
    this.dom.innerHTML = "<span></span>";

    createSimpleProperty("string", this, "text");
    this.clicked = Signal();

    this.Component.completed.connect(this, function() {
        this.implicitWidth = this.dom.firstChild.offsetWidth + 20;
        this.implicitHeight = this.dom.firstChild.offsetHeight + 5;
    });
    this.textChanged.connect(this, function(newVal) {
        this.dom.firstChild.innerHTML = newVal;
        //TODO: Replace those statically sized borders
        this.implicitWidth = this.dom.firstChild.offsetWidth + 20;
        this.implicitHeight = this.dom.firstChild.offsetHeight + 5;
    });

    this.dom.onclick = function(e) {
        self.clicked();
    }
}

registerQmlType('Button', QMLButton);
