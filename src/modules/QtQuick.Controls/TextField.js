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
    module: 'QtQuick.Controls',
    name: 'TextField',
    versions: /.*/,
    baseClass: 'QtQuick.Item',
    constructor: QMLTextInput
});

function QMLTextInput(meta) {
    callSuper(this, meta);

    var self = this;

    this.font = new getConstructor('QtQuick', '2.0', 'Font')(this);

    const input = this.impl = document.createElement('input');
    input.type = 'text';
    input.disabled = true;
    input.style.pointerEvents = "auto";
    input.style.margin = "0";
    input.style.width = "100%";
    this.dom.appendChild(input);

    this.setupFocusOnDom(input);

    createProperty("string", this, "text");
    createProperty("int", this, "maximumLength");
    createProperty("bool", this, "readOnly");
    createProperty("var", this, "validator");
    createProperty("enum", this, "echoMode");
    this.accepted = Signal();
    this.readOnly = false;
    this.maximumLength = -1;
    input.disabled = false;

    this.Component.completed.connect(this, function () {
        this.implicitWidth = input.offsetWidth;
        this.implicitHeight = input.offsetHeight;
    });

    this.textChanged.connect(this, function (newVal) {
        input.value = newVal;
    });

    this.echoModeChanged.connect(this, (function (newVal) {
        switch (newVal) {
        case TextField.Normal:
            input.type = "text";
            break;
        case TextField.Password:
            input.type = "password";
            break;
        }
    }).bind(this));

    this.maximumLengthChanged.connect(this, function (newVal) {
        if (newVal < 0)
            newVal = null;
        input.maxLength = newVal;
    });

    this.readOnlyChanged.connect(this, function (newVal) {
        input.disabled = newVal;
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

    input.oninput = updateValue;
    input.onpropertychanged = updateValue;
}
