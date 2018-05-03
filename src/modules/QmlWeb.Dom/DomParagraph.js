// eslint-disable-next-line no-undef
class QmlWeb_Dom_DomParagraph extends QmlWeb_Dom_DomElement {
  constructor(meta) {
    meta.tagName = "p";
    if (!meta.style) meta.style = {};
    meta.style.margin = 0;
    super(meta);
  }
}
