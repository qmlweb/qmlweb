function QMLTextEdit(meta) {
    callSuper(this, meta);

    var self = this;

    // Properties
    createProperty('bool', this, 'activeFocusOnPress');
    createProperty('url', this, 'baseUrl');
    createProperty('bool', this, 'canPaste');
    createProperty('bool', this, 'canRedo');
    createProperty('bool', this, 'canUndo');
    createProperty('color', this, 'color');
    createProperty('real', this, 'contentHeight');
    createProperty('real', this, 'contentWidth');
    createProperty('Component', this, 'cursorDelegate');
    createProperty('int', this, 'cursorPosition');
    createProperty('rectangle', this, 'cursorRectangle');
    createProperty('bool', this, 'cursorVisible');
    createProperty('enum', this, 'effectiveHorizontalAlignment');
    createProperty('enum', this, 'horizontalAlignment');
    createProperty('string', this, 'hoveredLink');
    createProperty('bool', this, 'inputMethodComposing');
    createProperty('enum', this, 'inputMethodHints');
    createProperty('int', this, 'length');
    createProperty('int', this, 'lineCount');
    createProperty('enum', this, 'mouseSelectionMode');
    createProperty('bool', this, 'persistentSelection');
    createProperty('bool', this, 'readOnly');
    createProperty('enum', this, 'renderType');
    createProperty('bool', this, 'selectByKeyboard');
    createProperty('bool', this, 'selectByMouse');
    createProperty('string', this, 'selectedText');
    createProperty('color', this, 'selectedTextColor');
    createProperty('color', this, 'selectionColor');
    createProperty('int', this, 'selectionEnd');
    createProperty('int', this, 'selectionStart');
    createProperty('string', this, 'text');
    createProperty('TextDocument', this, 'textDocument');
    createProperty('enum', this, 'textFormat');
    createProperty('real', this, 'textMargin');
    createProperty('enum', this, 'verticalAlignment');
    createProperty('enum', this, 'wrapMode');

    var QMLFont = new getConstructor('QtQuick', '2.0', 'Font');
    this.font = new QMLFont(this);

    this.activeFocusOnPress = true;
    this.baseUrl = undefined;
    this.canPaste = false;
    this.canRedo = false;
    this.canUndo = false;
    this.color = 'white';
    this.contentHeight = 0;
    this.contentWidth = 0;
    this.cursorDelegate = undefined;
    this.cursorPosition = 0;
    this.cursorRectangle = undefined;
    this.cursorVisible = true;
    this.effectiveHorizontalAlignment = undefined;
    this.horizontalAlignment = undefined;
    this.hoveredLink = undefined;
    this.inputMethodComposing = undefined;
    this.inputMethodHints = undefined;
    this.length = 0;
    this.lineCount = 0;
    this.mouseSelectionMode = undefined;
    this.persistentSelection = false;
    this.readOnly = false;
    this.renderType = undefined;
    this.selectByKeyboard = true;
    this.selectByMouse = false;
    this.selectedText = undefined;
    this.selectedTextColor = 'yellow';
    this.selectionColor = 'pink';
    this.selectionEnd = 0;
    this.selectionStart = 0;
    this.text = '';
    this.textDocument = undefined;
    this.textFormat = undefined;
    this.textMargin = 0;
    this.verticalAlignment = undefined;
    this.wrapMode = undefined;

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

    // Signals
    this.linkActivated = Signal([{
        type: 'string',
        name: 'link'
    }]);
    this.linkHovered = Signal([{
        type: 'string',
        name: 'link'
    }]);

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

registerQmlType({
  module:   'QtQuick',
  name:     'TextEdit',
  versions: /.*/,
  baseClass: 'Item',
  constructor: QMLTextEdit
});
