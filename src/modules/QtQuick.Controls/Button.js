// eslint-disable-next-line no-undef
class QtQuick_Controls_Button extends QtQuick_Item {
  static properties = {
    text: "string",
    enabled: { type: "bool", initialValue: true }
  };
  static signals = {
    clicked: []
  };

  constructor(meta) {
    super(meta);

    this.Component.completed.connect(this, this.Component$onCompleted);
    this.textChanged.connect(this, this.$onTextChanged);
    this.enabledChanged.connect(this, this.$onEnabledChanged);

    const button = this.impl = document.createElement("button");
    button.style.pointerEvents = "auto";
    this.dom.appendChild(button);

    button.onclick = () => {
      this.clicked();
    };
  }
  Component$onCompleted() {
    this.implicitWidth = this.impl.offsetWidth;
    this.implicitHeight = this.impl.offsetHeight;
  }
  $onTextChanged(newVal) {
    this.impl.textContent = newVal;
    //TODO: Replace those statically sized borders
    this.implicitWidth = this.impl.offsetWidth;
    this.implicitHeight = this.impl.offsetHeight;
  }
  $onEnabledChanged(newVal) {
    this.impl.disabled = !newVal;
  }
}
