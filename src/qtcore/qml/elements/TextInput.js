function QMLTextInput(meta) {
    QMLItem.call(this, meta);

    if (engine.renderMode == QMLRenderMode.Canvas) {
        console.log("TextInput-type is only supported within the DOM-backend.");
        return;
    }

    var self = this;

    this.font = new QMLFont(this);

    this.dom.innerHTML = "<input type=\"text\"/>"
    this.dom.firstChild.style.pointerEvents = "auto";
    // In some browsers text-inputs have a margin by default, which distorts
    // the positioning, so we need to manually set it to 0.
    this.dom.firstChild.style.margin = "0";
    this.dom.firstChild.style.width = "100%";

    createSimpleProperty("string", this, "text", "");
    this.accepted = Signal();

    this.Component.completed.connect(this, function() {
        this.implicitWidth = this.dom.firstChild.offsetWidth;
        this.implicitHeight = this.dom.firstChild.offsetHeight;
    });

    this.textChanged.connect(this, function(newVal) {
        this.dom.firstChild.value = newVal;
    });

    this.dom.firstChild.onkeydown = function(e) {
        if (e.keyCode == 13) //Enter pressed
            self.accepted();
    }

    function updateValue(e) {
        if (self.text != self.dom.firstChild.value) {
            self.text = self.dom.firstChild.value;
        }
    }

    this.dom.firstChild.oninput = updateValue;
    this.dom.firstChild.onpropertychanged = updateValue;
}

constructors['TextInput'] = QMLTextInput;
