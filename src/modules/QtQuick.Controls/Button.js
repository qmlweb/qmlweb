registerQmlType({
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
    callSuper(this, meta);

    const button = this.impl = document.createElement('button');
    button.style.pointerEvents = 'auto';
    this.dom.appendChild(button);

    this.Component.completed.connect(this, function() {
        this.implicitWidth = button.offsetWidth;
        this.implicitHeight = button.offsetHeight;
    });
    this.textChanged.connect(this, function(newVal) {
        button.textContent = newVal;
        //TODO: Replace those statically sized borders
        this.implicitWidth = button.offsetWidth;
        this.implicitHeight = button.offsetHeight;
    });
    this.enabledChanged.connect(this, function(newVal) {
        button.disabled = !newVal;
    });

    button.onclick = () => {
        this.clicked();
    }
  }
});
