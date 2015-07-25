function QMLComboBox(meta) {
    QMLItem.call(this, meta);
    var self = this;

    this.dom.style.pointerEvents = "auto";
    this.name = "QMLComboBox";

    createSimpleProperty("int", this, "count");
    createSimpleProperty("int", this, "currentIndex");
    createSimpleProperty("string", this, "currentText");
    createSimpleProperty("array", this, "menu");
    createSimpleProperty("array", this, "model");
    createSimpleProperty("bool", this, "pressed");

    this.count = 0;
    this.currentIndex = 0;
    this.currentText = "";
    this.menu = [];
    this.model = [];
    this.pressed = false;

    var updateCB = function(){
        var head = "<select>";
        var tail = "</select>";
        var html = head;

        var model = self.model;
        var count = model.length;
        self.count = count;

        for (var i = 0; i < count; i++) {
            var elt = model[i];
            //if (elt instanceof Array) { // TODO - optgroups? update model !
            //    var count_i = elt.length;
            //    for (var j = 0; j < count_i; j++)
            //        html += "<option>" + elt[j] + "</option>";
            //}
            //else
            html += "<option>" + elt + "</option>";
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
