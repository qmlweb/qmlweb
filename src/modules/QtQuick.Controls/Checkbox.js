registerQmlType({
  module:   'QtQuick.Controls',
  name:     'CheckBox',
  versions: /.*/,
  baseClass: 'QtQuick.Item',
  constructor: function QMLCheckbox(meta) {
    callSuper(this, meta);

    const label = this.impl = document.createElement('label');
    label.style.pointerEvents = 'auto';

    const checkbox = document.createElement('input');
    checkbox.type = 'checkbox';
    checkbox.style.verticalAlign = 'text-bottom';
    label.appendChild(checkbox);

    const span = document.createElement('span');
    label.appendChild(span);

    this.dom.appendChild(label);

    var self = this;

    var QMLFont = new getConstructor('QtQuick', '2.0', 'Font');
    this.font = new QMLFont(this);

    createProperty("string", this, "text");
    createProperty("bool", this, "checked");
    createProperty("color", this, "color");

    this.Component.completed.connect(this, function() {
        this.implicitHeight = label.offsetHeight;
        this.implicitWidth = label.offsetWidth > 0 ? label.offsetWidth + 4 : 0;
    });
    this.textChanged.connect(this, function(newVal) {
        span.innerHTML = newVal;
        this.implicitHeight = label.offsetHeight;
        this.implicitWidth = label.offsetWidth > 0 ? label.offsetWidth + 4 : 0;
    });
    this.colorChanged.connect(this, function(newVal) {
        span.style.color = QMLColor(newVal);
    });

    this.checkedChanged.connect(this, function(newVal) {
        checkbox.checked = self.checked;
    });

    checkbox.onchange = function() {
        self.checked = this.checked;
    };
  }
});
