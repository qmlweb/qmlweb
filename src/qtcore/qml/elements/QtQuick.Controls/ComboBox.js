function QMLComboBox(meta) {
    this.dom = document.createElement("form");
    QMLItem.call(this, meta);
    var self = this;

    this.dom.style.pointerEvents = "auto";

    createSimpleProperty("int", this, "count");
    createSimpleProperty("int", this, "currentIndex");
    createSimpleProperty("string", this, "currentText");
    createSimpleProperty("var", this, "menu");
    createSimpleProperty("var", this, "model");
    createSimpleProperty("bool", this, "pressed");
    createSimpleProperty("list", this, "$items");

    this.count = 0;
    this.currentIndex = 0;
    this.currentText = "";
    this.menu = undefined;
    this.model = undefined;
    this.pressed = false;

    this.$items = [];

    var updateCB = function(){
        var head = "<select>";
        var tail = "</select>";
        var html = head;

        var model = self.model;
        var count = model.length;
        self.count = count;

        for (var i = 0; i < count; i++) {
            html += "<option>" + model[i] + "</option>"; // TODO - setting via QML not working
        }
        html += tail;
        return html;
    };

    this.accepted = Signal();
    this.activated = Signal([{type: "int", name: "index"}]);

    this.find = function(text) { return 0; };
    this.selectAll = function () {};
    this.textAt = function(index) {
        var mx = this.count - 1;
        var ix = index < 0 ? 0 : index;
        ix = ix > mx ? mx : ix;
        return this.model[ix];
    };

    this.Component.completed.connect(this, function () {
        this.dom.innerHTML = updateCB();
        this.implicitWidth = this.dom.firstChild.offsetWidth;
        this.implicitHeight = this.dom.firstChild.offsetHeight;
    });

    this.modelChanged.connect(updateCB);

    this.dom.onclick = function (e) {
        self.currentIndex = self.dom.firstChild.selectedIndex;
        self.currentText = self.model[self.currentIndex];
        self.accepted();
        self.activated(self.currentIndex);
    };
}

registerQmlType('ComboBox', QMLComboBox);
