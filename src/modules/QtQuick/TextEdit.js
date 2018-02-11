// eslint-disable-next-line no-undef
class QtQuick_TextEdit extends QtQuick_Item {
  static properties = {
    activeFocusOnPress: { type: "bool", initialValue: true },
    baseUrl: "url",
    canPaste: "bool",
    canRedo: "bool",
    canUndo: "bool",
    color: { type: "color", initialValue: "white" },
    contentHeight: "real",
    contentWidth: "real",
    cursorDelegate: "Component",
    cursorPosition: "int",
    cursorRectangle: "rect",
    cursorVisible: { type: "bool", initialValue: true },
    effectiveHorizontalAlignment: "enum",
    font: "font",
    horizontalAlignment: "enum",
    hoveredLink: "string",
    inputMethodComposing: "bool",
    inputMethodHints: "enum",
    length: "int",
    lineCount: "int",
    mouseSelectionMode: "enum",
    persistentSelection: "bool",
    readOnly: "bool",
    renderType: "enum",
    selectByKeyboard: { type: "bool", initialValue: true },
    selectByMouse: "bool",
    selectedText: "string",
    selectedTextColor: { type: "color", initialValue: "yellow" },
    selectionColor: { type: "color", initialValue: "pink" },
    selectionEnd: "int",
    selectionStart: "int",
    text: "string",
    textDocument: "TextDocument",
    textFormat: "enum",
    textMargin: "real",
    verticalAlignment: "enum",
    wrapMode: "enum"
  };
  static signals = {
    linkActivated: [{ type: "string", name: "link" }],
    linkHovered: [{ type: "string", name: "link" }]
  };

  constructor(meta) {
    super(meta);

    // Undo / Redo stacks;
    this.undoStack = [];
    this.undoStackPosition = -1;
    this.redoStack = [];
    this.redoStackPosition = -1;

    const textarea = this.impl = document.createElement("textarea");
    textarea.style.pointerEvents = "auto";
    textarea.style.width = "100%";
    textarea.style.height = "100%";
    textarea.style.boxSizing = "border-box";
    textarea.style.borderWidth = "0";
    textarea.style.background = "none";
    textarea.style.outline = "none";
    textarea.style.resize = "none";
    textarea.style.padding = "0"; // TODO: padding/*Padding props from Qt 5.6
    // In some browsers text-areas have a margin by default, which distorts
    // the positioning, so we need to manually set it to 0.
    textarea.style.margin = "0";
    textarea.disabled = false;
    this.dom.appendChild(textarea);

    this.Component.completed.connect(this, this.Component$onCompleted);
    this.textChanged.connect(this, this.$onTextChanged);
    this.colorChanged.connect(this, this.$onColorChanged);

    this.impl.addEventListener("input", () => this.$updateValue());
  }
  append(text) {
    this.text += text;
  }
  copy() {
    // TODO
  }
  cut() {
    this.text = this.text(0, this.selectionStart) +
                this.text(this.selectionEnd, this.text.length);
    // TODO
  }
  deselect() {
    //this.selectionStart = -1;
    //this.selectionEnd = -1;
    //this.selectedText = null;
    // TODO
  }
  getFormattedText(start, end) {
    const text = this.text.slice(start, end);
    // TODO
    // process text
    return text;
  }
  getText(start, end) {
    return this.text.slice(start, end);
  }
  insert(/*position, text*/) {
    // TODO
  }
  isRightToLeft(/*start, end*/) {
    // TODO
  }
  linkAt(/*x, y*/) {
    // TODO
  }
  moveCursorSelection(/*x, y*/) {
    // TODO
  }
  paste() {
    // TODO
  }
  positionAt(/*x, y*/) {
    // TODO
  }
  positionToRectangle(/*position*/) {
    // TODO
  }
  redo() {
    // TODO
  }
  remove(/*start, end*/) {
    // TODO
  }
  select(/*start, end*/) {
    // TODO
  }
  selectAll() {
    // TODO
  }
  selectWord() {
    // TODO
  }
  undo() {
    // TODO
  }
  Component$onCompleted() {
    this.selectByKeyboard = !this.readOnly;
    this.impl.readOnly = this.readOnly;
    this.$updateValue();
    this.implicitWidth = this.offsetWidth;
    this.implicitHeight = this.offsetHeight;
  }
  $onTextChanged(newVal) {
    this.impl.value = newVal;
  }
  $onColorChanged(newVal) {
    this.impl.style.color = newVal.$css;
  }
  $updateValue() {
    if (this.text !== this.impl.value) {
      this.text = this.impl.value;
    }
    this.length = this.text.length;
    this.lineCount = this.$getLineCount();
    this.$updateCss();
  }
  // Transfer dom style to firstChild,
  // then clear corresponding dom style
  $updateCss() {
    const supported = [
      "border",
      "borderRadius",
      "borderWidth",
      "borderColor",
      "backgroundColor",
    ];
    const style = this.impl.style;
    for (let n = 0; n < supported.length; n++) {
      const o = supported[n];
      const v = this.css[o];
      if (v) {
        style[o] = v;
        this.css[o] = null;
      }
    }
  }
  $getLineCount() {
    return this.text.split(/\n/).length;
  }
}
