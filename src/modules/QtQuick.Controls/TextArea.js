// eslint-disable-next-line no-undef
class QtQuick_Controls_TextArea extends QtQuick_TextEdit {
  constructor(meta) {
    super(meta);
    const textarea = this.impl;
    textarea.style.padding = "5px";
    textarea.style.borderWidth = "1px";
    textarea.style.backgroundColor = "#fff";
  }
}
