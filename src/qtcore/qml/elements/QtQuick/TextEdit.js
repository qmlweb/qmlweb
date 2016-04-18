function QMLTextEdit(meta) {
    QMLItem.call(this, meta);

    var self = this;

    // Properties
    createProperty({ type: 'bool', object: this, name: 'activeFocusOnPress' });
    createProperty({ type: 'url', object: this, name: 'baseUrl' });
    createProperty({ type: 'bool', object: this, name: 'canPaste' });
    createProperty({ type: 'bool', object: this, name: 'canRedo' });
    createProperty({ type: 'bool', object: this, name: 'canUndo' });
    createProperty({ type: 'color', object: this, name: 'color' });
    createProperty({ type: 'real', object: this, name: 'contentHeight' });
    createProperty({ type: 'real', object: this, name: 'contentWidth' });
    createProperty({ type: 'Component', object: this, name: 'cursorDelegate' });
    createProperty({ type: 'int', object: this, name: 'cursorPosition' });
    createProperty({ type: 'rectangle', object: this, name: 'cursorRectangle' });
    createProperty({ type: 'bool', object: this, name: 'cursorVisible' });
    createProperty({ type: 'enum', object: this, name: 'effectiveHorizontalAlignment' });
    createProperty({ type: 'enum', object: this, name: 'horizontalAlignment' });
    createProperty({ type: 'string', object: this, name: 'hoveredLink' });
    createProperty({ type: 'bool', object: this, name: 'inputMethodComposing' });
    createProperty({ type: 'enum', object: this, name: 'inputMethodHints' });
    createProperty({ type: 'int', object: this, name: 'length' });
    createProperty({ type: 'int', object: this, name: 'lineCount' });
    createProperty({ type: 'enum', object: this, name: 'mouseSelectionMode' });
    createProperty({ type: 'bool', object: this, name: 'persistentSelection' });
    createProperty({ type: 'bool', object: this, name: 'readOnly' });
    createProperty({ type: 'enum', object: this, name: 'renderType' });
    createProperty({ type: 'bool', object: this, name: 'selectByKeyboard' });
    createProperty({ type: 'bool', object: this, name: 'selectByMouse' });
    createProperty({ type: 'string', object: this, name: 'selectedText' });
    createProperty({ type: 'color', object: this, name: 'selectedTextColor' });
    createProperty({ type: 'color', object: this, name: 'selectionColor' });
    createProperty({ type: 'int', object: this, name: 'selectionEnd' });
    createProperty({ type: 'int', object: this, name: 'selectionStart' });
    createProperty({ type: 'string', object: this, name: 'text' });
    createProperty({ type: 'TextDocument', object: this, name: 'textDocument' });
    createProperty({ type: 'enum', object: this, name: 'textFormat' });
    createProperty({ type: 'real', object: this, name: 'textMargin' });
    createProperty({ type: 'enum', object: this, name: 'verticalAlignment' });
    createProperty({ type: 'enum', object: this, name: 'wrapMode' });

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

    this.dom.innerHTML = "<textarea></textarea>"
    this.dom.firstChild.style.pointerEvents = "auto";
    this.dom.firstChild.style.width = "100%";
    this.dom.firstChild.style.height = "100%";
    // In some browsers text-areas have a margin by default, which distorts
    // the positioning, so we need to manually set it to 0.
    this.dom.firstChild.style.margin = "0";
    this.dom.firstChild.disabled = false;

    this.Component.completed.connect(this, function() {
        this.implicitWidth = this.dom.firstChild.offsetWidth;
        this.implicitHeight = this.dom.firstChild.offsetHeight;
    });

    this.textChanged.connect(this, function(newVal) {
        this.dom.firstChild.value = newVal;
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

    this.dom.firstChild.oninput = updateValue;
    this.dom.firstChild.onpropertychanged = updateValue;

    this.colorChanged.connect(this, function(newVal) {
        this.dom.firstChild.style.color = newVal;
    });
}

registerQmlType({
  module:   'QtQuick',
  name:     'TextEdit',
  versions: /.*/,
  baseClass: QMLItem,
  constructor: QMLTextEdit
});

registerQmlType({ // non-standard, to be removed!
  module:   'QtQuick.Controls',
  name:     'TextArea',
  versions: /.*/,
  baseClass: QMLItem,
  constructor: QMLTextEdit
});
