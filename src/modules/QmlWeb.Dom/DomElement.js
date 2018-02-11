// eslint-disable-next-line no-undef
class QmlWeb_Dom_DomElement extends QtQuick_Item {
  static properties = {
    tagName: { type: "string", initialValue: "div" }
  };

  constructor(meta) {
    meta.tagName = meta.object.tagName;
    super(meta);

    // TODO: support properties, styles, perhaps changing the tagName
  }
}
