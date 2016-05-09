global.TextInput = {
  Normal: 0, Password: 1, NoEcho: 2, PasswordEchoOnEdit: 3
};

registerQmlType({
  module:   'QtQuick',
  name:     'TextInput',
  versions: /.*/,
  baseClass: 'Item',
  constructor: function QMLTextInput(meta) {
    callSuper(this, meta);

    var self = this;

    this.font = new getConstructor('QtQuick', '2.0', 'Font')(this);

    const input = this.impl = document.createElement('input');
    input.type = 'text';
    input.disabled = true;
    input.style.pointerEvents = "auto";
    // In some browsers text-inputs have a margin by default, which distorts
    // the positioning, so we need to manually set it to 0.
    input.style.margin = "0";
    input.style.padding = "0";
    input.style.width = "100%";
    input.style.height = "100%";
    this.dom.appendChild(input);

    this.setupFocusOnDom(input);

    createProperty("string", this, "text");
    createProperty("int", this, "maximumLength", {initialValue: -1});
    createProperty("bool",   this, "readOnly");
    createProperty("var",    this, "validator");
    createProperty("enum",   this, "echoMode");
    this.accepted = Signal();
    input.disabled = false;

    this.Component.completed.connect(this, function() {
        this.implicitWidth = input.offsetWidth;
        this.implicitHeight = input.offsetHeight;
    });

    this.textChanged.connect(this, function(newVal) {
        // We have to check if value actually changes.
        // If we do not have this check, then after user updates text input following occurs:
        // user update gui text -> updateValue called -> textChanged called -> gui value updates again -> caret position moves to the right!
        if (input.value != newVal)
            input.value = newVal;
    });

    this.echoModeChanged.connect(this, (function(newVal) {
        switch (newVal) {
          case TextInput.Normal:
            input.type = "text";
            break ;
          case TextInput.Password:
            input.type = "password";
            break ;
          case TextInput.NoEcho:
            // Not supported, use password, that's nearest
            input.type = "password";
            break;
          case TextInput.PasswordEchoOnEdit:
            // Not supported, use password, that's nearest
            input.type = "password";
            break;
        }
    }).bind(this));

    this.maximumLengthChanged.connect(this, function(newVal) {
        if (newVal < 0)
          newVal = null;
        input.maxLength = newVal;
    });

    this.readOnlyChanged.connect(this, function(newVal) {
        input.disabled = newVal;
    });

    this.Keys.pressed.connect(this, (function(e) {
      if ((e.key == Qt.Key_Return || e.key == Qt.Key_Enter) &&
          testValidator()) {
        self.accepted();
        e.accepted = true;
      }
    }).bind(this));

    function testValidator() {
      if (typeof self.validator != 'undefined' && self.validator != null)
        return self.validator.validate(self.text);
      return true;
    }

    function updateValue(e) {
        if (self.text != self.dom.firstChild.value) {
          self.$canEditReadOnlyProperties = true;
          self.text = self.dom.firstChild.value;
          self.$canEditReadOnlyProperties = false;
        }
    }

    input.oninput = updateValue;
    input.onpropertychanged = updateValue;
  }
});
