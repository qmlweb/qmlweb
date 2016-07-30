registerQmlType({
  module: "QtQuick",
  name: "TextEdit",
  versions: /.*/,
  baseClass: "Item",
  properties: {
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
    cursorRectangle: "rectangle",
    cursorVisible: { type: "bool", initialValue: true },
    effectiveHorizontalAlignment: "enum",
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
  },
  signals: {
    linkActivated: [{ type: "string", name: "link" }],
    linkHovered: [{ type: "string", name: "link" }]
  }
}, class {
  constructor(meta) {
    callSuper(this, meta);

    var self = this;

    const QMLFont = QmlWeb.getConstructor('QtQuick', '2.0', 'Font');
    this.font = new QMLFont(this);

    // Undo / Redo stacks;
    this.undoStack = [];
    this.undoStackPosition = -1;
    this.redoStack = [];
    this.redoStackPosition = -1;

    const textarea = this.impl = document.createElement('textarea');
    textarea.style.pointerEvents = "auto";
    textarea.style.width = "100%";
    textarea.style.height = "100%";
    textarea.style.boxSizing = 'border-box';
    textarea.style.borderWidth = '0';
    textarea.style.background = 'none';
    textarea.style.outline = 'none';
    textarea.style.resize = 'none';
    textarea.style.padding = '0'; // TODO: padding/*Padding props from Qt 5.6
    // In some browsers text-areas have a margin by default, which distorts
    // the positioning, so we need to manually set it to 0.
    textarea.style.margin = "0";
    textarea.disabled = false;
    this.dom.appendChild(textarea);

    this.Component.completed.connect(this, function() {
        this.implicitWidth = textarea.offsetWidth;
        this.implicitHeight = textarea.offsetHeight;
    });

    this.textChanged.connect(this, function(newVal) {
        textarea.value = newVal;
    });

    // Methods
    this.append = function append(text) {
        this.text += text;
    };

    this.copy = function copy() {
        // TODO
    };

    this.cut = function cut() {
        this.text =
            this.text(0, this.selectionStart) + this.text(this.selectionEnd, this.text.length);
        // TODO
    };

    this.deselect = function deselect() {
        //this.selectionStart = -1;
        //this.selectionEnd = -1;
        //this.selectedText = null;
    };

    this.getFormattedText = function getFormattedText(start, end) {
        this.text = this.text.slice(start, end);
        // TODO
        // process text
        return text;
    };

    this.getText = function getText(start, end) {
        return this.text.slice(start, end);
    };

    this.insert = function getText(position, text) {
        // TODO
    };

    this.isRightToLeft = function isRightToLeft(start, end) {
        // TODO
    };

    this.linkAt = function linkAt(x, y) {
        // TODO
    };

    this.moveCursorSelection = function moveCursorSelection(x, y) {
        // TODO
    };

    this.paste = function paste() {
        // TODO
    };

    this.positionAt = function positionAt(x, y) {
        // TODO
    };

    this.positionToRectangle = function positionToRectangle(position) {
        // TODO
    };

    this.redo = function redo() {
        // TODO
    };

    this.remove = function remove(start, end) {
        // TODO
    };

    this.select = function select(start, end) {
        // TODO
    };

    this.selectAll = function selectAll() {
        // TODO
    };

    this.selectWord = function selectWord() {
        // TODO
    };

    this.undo = function undo() {
        // TODO
    };

    var getLineCount = function(self) {
        return self.text.split(/\n/).length;
    }

    this.Component.completed.connect(this, function() {
        this.selectByKeyboard = !this.readOnly;
        updateValue();
    });

    // Transfer dom style to firstChild,
    // then clear corresponding dom style
    function updateCss(self) {
        var supported = [
            'border',
            'borderRadius',
            'borderWidth',
            'borderColor',
            'backgroundColor',
        ];

        var child_style = self.dom.firstChild.style;
        for (n = 0; n < supported.length; n++) {
            var o = supported[n];
            var v = self.css[o];
            if (v) {
                child_style[o] = v;
                self.css[o] = null;
            }
        }
    }

    function updateValue(e) {
        if (self.text != self.dom.firstChild.value) {
            self.text = self.dom.firstChild.value;
        }
        self.length = self.text.length;
        self.lineCount = getLineCount(self);
        updateCss(self);
    }

    textarea.oninput = updateValue;
    textarea.onpropertychanged = updateValue;

    this.colorChanged.connect(this, function(newVal) {
        textarea.style.color = newVal;
    });
  }
});
