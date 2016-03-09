function QMLTextEdit(meta) {
    QMLItem.call(this, meta);

    var self = this;

    var QMLFont = new getConstructor('QtQuick', '2.0', 'Font');
    this.font = new QMLFont(this);

    this.dom.innerHTML = "<textarea></textarea>"
    this.dom.firstChild.style.pointerEvents = "auto";
    this.dom.firstChild.style.width = "100%";
    this.dom.firstChild.style.height = "100%";
    // In some browsers text-areas have a margin by default, which distorts
    // the positioning, so we need to manually set it to 0.
    this.dom.firstChild.style.margin = "0";

    createSimpleProperty("string", this, "text", "");

    this.Component.completed.connect(this, function() {
        this.implicitWidth = this.dom.firstChild.offsetWidth;
        this.implicitHeight = this.dom.firstChild.offsetHeight;
    });

    this.textChanged.connect(this, function(newVal) {
        this.dom.firstChild.value = newVal;
    });

    function updateValue(e) {
        if (self.text != self.dom.firstChild.value) {
            self.text = self.dom.firstChild.value;
        }
    }

    this.dom.firstChild.oninput = updateValue;
    this.dom.firstChild.onpropertychanged = updateValue;
}

registerQmlType({
  module:   'QtQuick',
  name:     'TextEdit',
  versions: /.*/,
  baseClass: QMLItem,
  constructor: QMLTextEdit
});

registerQmlType({ // non-standard, to be removed!
  module:   'QtQuick.Controls',
  name:     'TextArea',
  versions: /.*/,
  baseClass: QMLItem,
  constructor: QMLTextEdit
});
