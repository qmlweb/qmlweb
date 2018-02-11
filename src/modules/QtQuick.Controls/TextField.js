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

// eslint-disable-next-line no-undef
class QtQuick_Controls_TextField extends QtQuick_Item {
  static enums = {
    TextInput: { Normal: 0, Password: 1, NoEcho: 2, PasswordEchoOnEdit: 3 }
  };
  static properties = {
    text: "string",
    font: "font",
    maximumLength: { type: "int", initialValue: -1 },
    readOnly: "bool",
    validator: "var",
    echoMode: "enum" // TextInput.Normal
  };
  static signals = {
    accepted: []
  };

  constructor(meta) {
    super(meta);

    const input = this.impl = document.createElement("input");
    input.type = "text";
    input.disabled = true;
    input.style.pointerEvents = "auto";
    input.style.margin = "0";
    input.style.width = "100%";
    this.dom.appendChild(input);
    this.setupFocusOnDom(input);
    input.disabled = false;

    this.Component.completed.connect(this, this.Component$onCompleted);
    this.textChanged.connect(this, this.$onTextChanged);
    this.echoModeChanged.connect(this, this.$onEchoModeChanged);
    this.maximumLengthChanged.connect(this, this.$onMaximumLengthChanged);
    this.readOnlyChanged.connect(this, this.$onReadOnlyChanged);
    this.Keys.pressed.connect(this, this.Keys$onPressed);

    this.impl.addEventListener("input", () => this.$updateValue());
  }
  Component$onCompleted() {
    this.implicitWidth = this.impl.offsetWidth;
    this.implicitHeight = this.impl.offsetHeight;
  }
  $onTextChanged(newVal) {
    // See TextInput for comments
    if (this.impl.value !== newVal) {
      this.impl.value = newVal;
    }
  }
  $onEchoModeChanged(newVal) {
    const TextInput = this.TextInput;
    const input = this.impl;
    switch (newVal) {
      case TextInput.Normal:
        input.type = "text";
        break;
      case TextInput.Password:
        input.type = "password";
        break;
      case TextInput.NoEcho:
        // Not supported, use password, that's nearest
        input.type = "password";
        break;
      case TextInput.PasswordEchoOnEdit:
        // Not supported, use password, that's nearest
        input.type = "password";
        break;
    }
  }
  $onMaximumLengthChanged(newVal) {
    this.impl.maxLength = newVal < 0 ? null : newVal;
  }
  $onReadOnlyChanged(newVal) {
    this.impl.disabled = newVal;
  }
  Keys$onPressed(e) {
    const Qt = QmlWeb.Qt;
    const submit = e.key === Qt.Key_Return || e.key === Qt.Key_Enter;
    if (submit && this.$testValidator()) {
      this.accepted();
      e.accepted = true;
    }
  }
  $testValidator() {
    if (this.validator) {
      return this.validator.validate(this.text);
    }
    return true;
  }
  $updateValue() {
    if (this.text !== this.impl.value) {
      this.$canEditReadOnlyProperties = true;
      this.text = this.impl.value;
      this.$canEditReadOnlyProperties = false;
    }
  }
}
