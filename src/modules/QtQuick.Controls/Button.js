QmlWeb.registerQmlType({
  module: "QtQuick.Controls",
  name: "Button",
  versions: /.*/,
  baseClass: "QtQuick.Item",
  properties: {
    text: "string",
    enabled: { type: "bool", initialValue: true }
  },
  signals: {
    clicked: []
  }
}, class {
  constructor(meta) {
    QmlWeb.callSuper(this, meta);

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

});
