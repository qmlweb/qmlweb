registerQmlType({
    module: 'QtQuick.Controls',
    name: 'ComboBox',
    versions: /.*/,
    baseClass: 'QtQuick.Item',
    constructor: QMLComboBox
});

function QMLComboBox(meta) {
    callSuper(this, meta);
    var self = this;

    this.dom.style.pointerEvents = "auto";
    this.name = "QMLComboBox";

    createProperty("int", this, "count");
    createProperty("int", this, "currentIndex");
    createProperty("string", this, "currentText");
    createProperty("array", this, "menu");
    createProperty("array", this, "model");
    createProperty("bool", this, "pressed");

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
        return self.model.indexOf(text)
    };
    this.selectAll = function () {};    // TODO
    this.textAt = function(index) {
        return this.model[index];
    };

    this.Component.completed.connect(this, function () {
        this.dom.innerHTML = updateCB();
        var child = this.dom.firstChild;
        this.implicitWidth = child.offsetWidth;
        this.implicitHeight = child.offsetHeight;
    });

    this.modelChanged.connect(updateCB);

    this.dom.onclick = function (e) {
        var index = self.dom.firstChild.selectedIndex;
        self.currentIndex = index ;
        self.currentText = self.model[index];
        self.accepted();
        self.activated(index);
    };
}
