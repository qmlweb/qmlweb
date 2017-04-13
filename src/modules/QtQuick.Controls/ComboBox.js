QmlWeb.registerQmlType({
  module: "QtQuick.Controls",
  name: "ComboBox",
  versions: /.*/,
  baseClass: "QtQuick.Item",
  properties: {
    count: "int",
    currentIndex: "int",
    size: { type: "int", initialValue: 1 }, // non-standard property to qtquick, but useful in dom
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
    this.sizeChanged.connect(this, this.$onModelChanged);
    this.currentIndexChanged.connect(this, this.$onCurrentIndexChanged);

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
    
    this.impl.size = this.size;

    this.implicitWidth = this.impl.offsetWidth;
    this.implicitHeight = this.impl.offsetHeight;
  }
  Component$onCompleted() {
    this.$updateImpl();
  }
  $onModelChanged() {
    this.$updateImpl();
  }
  $onCurrentIndexChanged() {
    var i = this.currentIndex;
    if (this.dom.firstChild.selectedIndex != i) {
      this.dom.firstChild.selectedIndex = i;
      this.currentText = this.model[i];
      this.activated(i);
    }
  }
});
