// eslint-disable-next-line no-undef
class QmlWeb_Dom_DomElement extends QtQuick_Item {
  static properties = {
    attrs: { type: "var", initialValue: {} },
    style: { type: "var", initialValue: {} },
    html: { type: "string", initialValue: "" },
    text: { type: "string", initialValue: "" },
    tagName: { type: "string", initialValue: "div" }
  };

  constructor(meta) {
    meta.tagName = meta.object.tagName || meta.tagName;
    super(meta);

    for (const key in meta.object.attrs) {
      if (!meta.object.attrs.hasOwnProperty(key)) continue;
      this.dom[key] = meta.object.attrs[key];
    }
    for (const key in meta.object.style) {
      if (!meta.object.style.hasOwnProperty(key)) continue;
      this.dom.style[key] = meta.object.style[key];
    }

    this.htmlChanged.connect(() => {
      this.dom.innerHTML = this.html;
    });
    this.textChanged.connect(() => {
      this.dom.innerText = this.text;
    });
  }
}
