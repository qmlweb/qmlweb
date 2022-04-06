const styleProperties = {};
for (const property in document.createElement("div").style) {
  styleProperties[property] = "string";
}

class QmlWeb_Dom_DomStyle extends QmlWeb.QObject {
  constructor(meta) {
    super(meta);

    this.updated = (new QmlWeb.Signal([], { obj: this })).signal;
    QmlWeb.createProperties(this, styleProperties);
    for (const propertyName in this.$properties) {
      const property = this.$properties[propertyName];
      property.changed.connect(this, newVal => {
        this.$parent.dom.style[propertyName] = newVal;
        this.updated();
      });
    }
  }
}

QmlWeb.DomStyle = QmlWeb_Dom_DomStyle;
