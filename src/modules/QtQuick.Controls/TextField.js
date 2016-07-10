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
  module: "QtQuick.Controls",
  name: "TextField",
  versions: /.*/,
  baseClass: "QtQuick.Item",
  properties: {
    text: "string",
    maximumLength: "int",
    readOnly: { type: "bool", initialValue: -1 },
    validator: "var",
    echoMode: "enum"
  },
  signals: {
    accepted: []
  }
}, class {
  constructor(meta) {
    callSuper(this, meta);

    const QMLFont = getConstructor("QtQuick", "2.0", "Font");
    this.font = new QMLFont(this);

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

    this.Keys.pressed.connect(this, this.$submitValue);

    input.oninput = () => this.$updateValue();
    input.onpropertychanged = () => this.$updateValue();
  }
  Component$onCompleted() {
    this.implicitWidth = this.impl.offsetWidth;
    this.implicitHeight = this.impl.offsetHeight;
  }
  $onTextChanged(newVal) {
    this.impl.value = newVal;
  }
  $onEchoModeChanged(newVal) {
    switch (newVal) {
      case TextField.Normal:
        this.impl.type = "text";
        break;
      case TextField.Password:
        this.impl.type = "password";
        break;
    }
  }
  $onMaximumLengthChanged(newVal) {
    this.impl.maxLength = newVal < 0 ? null : newVal;
  }
  $onReadOnlyChanged(newVal) {
    this.impl.disabled = newVal;
  }
  $testValidator() {
    if (typeof this.validator !== "undefined" && this.validator !== null) {
      return this.validator.validate(this.text);
    }
    return true;
  }
  $submitValue(e) {
    const is_submit = e.key === Qt.Key_Return || e.key === Qt.Key_Enter;
    if (is_submit && this.$testValidator()) {
      this.accepted();
      e.accepted = true;
    }
  }
  $updateValue() {
    if (this.text !== this.impl.value) {
      this.$canEditReadOnlyProperties = true;
      this.text = this.impl.value;
      this.$canEditReadOnlyProperties = false;
    }
  }
});
