QmlWeb.registerQmlType({
  module: "QtQuick.Controls",
  name: "ComboBox",
  versions: /.*/,
  baseClass: "QtQuick.Item",
  properties: {
    count: "int",
    currentIndex: "int",
    currentText: "string",
    menu: { type: "array", initialValue: [] },
    model: { type: "array", initialValue: [] },
    pressed: "bool"
  },
  signals: {
    accepted: [],
    activated: [{ type: "int", name: "index" }]
  }
}, class {
  constructor(meta) {
    QmlWeb.callSuper(this, meta);

    this.dom.style.pointerEvents = "auto";
    this.name = "QMLComboBox";

    this.Component.completed.connect(this, this.Component$onCompleted);
    this.modelChanged.connect(this, this.$onModelChanged);

    this.dom.onclick = () => {
      const index = this.dom.firstChild.selectedIndex;
      this.currentIndex = index;
      this.currentText = this.model[index];
      this.accepted();
      this.activated(index);
    };
  }
  find(text) {
    return this.model.indexOf(text);
  }
  selectAll() {
    // TODO
  }
  textAt(index) {
    return this.model[index];
  }
  $updateImpl() {
    this.currentIndex = 0;
    this.count = this.model.length;
    const entries = [];
    for (let i = 0; i < this.count; i++) {
      const elt = this.model[i];
      //if (elt instanceof Array) { // TODO - optgroups? update model !
      //    var count_i = elt.length;
      //    for (var j = 0; j < count_i; j++)
      //        html += "<option>" + elt[j] + "</option>";
      //}
      //else
      entries.push(`<option>${elt}</option>`);
    }
    // TODO: remove innerHTML, port to DOM
    this.dom.innerHTML = `<select>${entries.join("")}</select>`;
    this.impl = this.dom.firstChild;
  }
  Component$onCompleted() {
    this.$updateImpl();
    this.implicitWidth = this.impl.offsetWidth;
    this.implicitHeight = this.impl.offsetHeight;
  }
  $onModelChanged() {
    this.$updateImpl();
  }
});
