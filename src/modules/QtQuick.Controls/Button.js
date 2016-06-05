function QMLButton(meta) {
    callSuper(this, meta);

    const button = this.impl = document.createElement('button');
    button.style.pointerEvents = 'auto';
    this.dom.appendChild(button);

    createProperty("string", this, "text");
    createProperty("bool", this, "enabled", {initialValue: true});
    this.clicked = Signal();

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

registerQmlType({
  module: 'QtQuick.Controls',
  name: 'Button',
  versions: /.*/,
  baseClass: 'QtQuick.Item',
  constructor: QMLButton
});
