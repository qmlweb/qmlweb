function QMLTextInput(meta) {
    QMLItem.call(this, meta);

    var self = this;

    this.font = new QMLFont(this);

    this.dom.innerHTML = "<input type=\"text\" disabled/>"
    this.dom.firstChild.style.pointerEvents = "auto";
    // In some browsers text-inputs have a margin by default, which distorts
    // the positioning, so we need to manually set it to 0.
    this.dom.firstChild.style.margin = "0";
    this.dom.firstChild.style.width = "100%";

    createSimpleProperty("string", this, "text", "");
    createSimpleProperty("int",    this, "maximumLength");
    createSimpleProperty("bool",   this, "readOnly");
    createSimpleProperty("var",    this, "validator");
    this.accepted = Signal();
    this.readOnly = false;
    this.maximumLength = -1;
    this.dom.firstChild.disabled = false;

    this.Component.completed.connect(this, function() {
        this.implicitWidth = this.dom.firstChild.offsetWidth;
        this.implicitHeight = this.dom.firstChild.offsetHeight;
    });

    this.textChanged.connect(this, function(newVal) {
        this.dom.firstChild.value = newVal;
    });

    this.maximumLengthChanged.connect(this, function(newVal) {
        if (newVal < 0)
          newVal = null;
        this.dom.firstChild.maxLength = newVal;
    });

    this.readOnlyChanged.connect(this, function(newVal) {
        this.dom.firstChild.disabled = newVal;
    });

    this.dom.firstChild.onkeydown = function(e) {
        if (e.keyCode == 13 && testValidator()) //Enter pressed
            self.accepted();
    }

    function testValidator() {
      if (typeof self.validator != 'undefined' && self.validator != null)
        return self.validator.validate(self.text);
      return true;
    }

    function updateValue(e) {
        if (self.text != self.dom.firstChild.value) {
            self.text = self.dom.firstChild.value;
        }
    }

    this.dom.firstChild.oninput = updateValue;
    this.dom.firstChild.onpropertychanged = updateValue;
}

registerQmlType('TextInput', QMLTextInput);
