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

    this.find = function(text) {
        var ix = -1;
        for (var i = 0; i < this.count; i++)
            if (self.model[i] == text)
                return i;
        return ix;
    };
    this.selectAll = function () {};    // TODO
    this.textAt = function(index) {
        if (index >= 0 && index < this.count)
            return this.model[index];
        return;
    };

    this.Component.completed.connect(this, function () {
        var child = this.dom.firstChild;
        this.dom.innerHTML = updateCB();
        this.implicitWidth = child.offsetWidth;
        this.implicitHeight = child.offsetHeight;
    });

    this.modelChanged.connect(updateCB);

    this.dom.onclick = function (e) {
        var index = self.dom.firstChild.selectedIndex
        self.currentIndex = index ;
        self.currentText = self.model[index];
        self.accepted();
        self.activated(index);
    };
}

registerQmlType('ComboBox', QMLComboBox);
