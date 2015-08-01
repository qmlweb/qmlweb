/**
 *
 * TextField is used to accept a line of text input.
 * Input constraints can be placed on a TextField item
 * (for example, through a validator or inputMask).
 * Setting echoMode to an appropriate value enables TextField
 * to be used for a password input field.
 *
 * Valid entries for echoMode and alignment are defined in TextInput.
 *
 */

registerQmlType({
    module: 'QtQuick',
    name: 'TextField',
    versions: /.*/,
    constructor: QMLTextInput
});

function QMLTextInput(meta) {
    QMLItem.call(this, meta);

    var self = this;

    this.font = new getConstructor('QtQuick', '2.0', 'Font')(this);

    this.dom.innerHTML = "<input type=\"text\" disabled/>"
    this.dom.firstChild.style.pointerEvents = "auto";
    this.dom.firstChild.style.margin = "0";
    this.dom.firstChild.style.width = "100%";

    this.setupFocusOnDom(this.dom.firstChild);

    createSimpleProperty("string", this, "text");
    createSimpleProperty("int", this, "maximumLength");
    createSimpleProperty("bool", this, "readOnly");
    createSimpleProperty("var", this, "validator");
    createSimpleProperty("enum", this, "echoMode");
    this.accepted = Signal();
    this.readOnly = false;
    this.maximumLength = -1;
    this.dom.firstChild.disabled = false;

    this.Component.completed.connect(this, function () {
        this.implicitWidth = this.dom.firstChild.offsetWidth;
        this.implicitHeight = this.dom.firstChild.offsetHeight;
    });

    this.textChanged.connect(this, function (newVal) {
        this.dom.firstChild.value = newVal;
    });

    this.echoModeChanged.connect(this, (function (newVal) {
        switch (newVal) {
        case TextField.Normal:
            this.dom.firstChild.type = "text";
            break;
        case TextField.Password:
            this.dom.firstChild.type = "password";
            break;
        }
    }).bind(this));

    this.maximumLengthChanged.connect(this, function (newVal) {
        if (newVal < 0)
            newVal = null;
        this.dom.firstChild.maxLength = newVal;
    });

    this.readOnlyChanged.connect(this, function (newVal) {
        this.dom.firstChild.disabled = newVal;
    });

    this.Keys.pressed.connect(this, (function (e) {
        if ((e.key === Qt.Key_Return || e.key === Qt.Key_Enter) &&
            testValidator()) {
            self.accepted();
            e.accepted = true;
        }
    }).bind(this));

    function testValidator() {
        if (typeof self.validator !== 'undefined' && self.validator !== null)
            return self.validator.validate(self.text);
        return true;
    }

    function updateValue(e) {
        if (self.text !== self.dom.firstChild.value) {
            self.$canEditReadOnlyProperties = true;
            self.text = self.dom.firstChild.value;
            self.$canEditReadOnlyProperties = false;
        }
    }

    this.dom.firstChild.oninput = updateValue;
    this.dom.firstChild.onpropertychanged = updateValue;
}
