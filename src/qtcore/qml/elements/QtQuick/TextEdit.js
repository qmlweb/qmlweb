  registerQmlType({
      module: 'QtQuick',
      name: 'TextEdit',
      versions: /.*/,
      constructor: function(meta) {
          QMLItem.call(this, meta);

          var self = this;

          createSimpleProperty('bool', this, 'activeFocusOnPress');
          createSimpleProperty('url', this, 'baseUrl');
          createSimpleProperty('bool', this, 'canPaste');
          createSimpleProperty('bool', this, 'canRedo');
          createSimpleProperty('bool', this, 'canUndo');
          createSimpleProperty('color', this, 'color');
          createSimpleProperty('real', this, 'contentHeight');
          createSimpleProperty('real', this, 'contentWidth');
          createSimpleProperty('Component', this, 'cursorDelegate');
          createSimpleProperty('int', this, 'cursorPosition');
          createSimpleProperty('rectangle', this, 'cursorRectangle');
          createSimpleProperty('bool', this, 'cursorVisible');
          createSimpleProperty('enum', this, 'effectiveHorizontalAlignment');
          createSimpleProperty('enum', this, 'horizontalAlignment');
          createSimpleProperty('string', this, 'hoveredLink');
          createSimpleProperty('bool', this, 'inputMethodComposing');
          createSimpleProperty('enum', this, 'inputMethodHints');
          createSimpleProperty('int', this, 'length');
          createSimpleProperty('int', this, 'lineCount');
          createSimpleProperty('enum', this, 'mouseSelectionMode');
          createSimpleProperty('bool', this, 'persistentSelection');
          createSimpleProperty('bool', this, 'readOnly');
          createSimpleProperty('enum', this, 'renderType');
          createSimpleProperty('bool', this, 'selectByKeyboard');
          createSimpleProperty('bool', this, 'selectByMouse');
          createSimpleProperty('string', this, 'selectedText');
          createSimpleProperty('color', this, 'selectedTextColor');
          createSimpleProperty('color', this, 'selectionColor');
          createSimpleProperty('int', this, 'selectionEnd');
          createSimpleProperty('int', this, 'selectionStart');
          createSimpleProperty('string', this, 'text');
          createSimpleProperty('TextDocument', this, 'textDocument');
          createSimpleProperty('enum', this, 'textFormat');
          createSimpleProperty('real', this, 'textMargin');
          createSimpleProperty('enum', this, 'verticalAlignment');
          createSimpleProperty('enum', this, 'wrapMode');

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

          this.undoStack = [];
          this.undoStackPosition = -1;
          this.redoStack = [];
          this.redoStackPosition = -1;

          this.dom.innerHTML = '<textarea></textarea>'
          this.dom.firstChild.style.pointerEvents = 'auto';
          this.dom.firstChild.style.width = '100%';
          this.dom.firstChild.style.height = '100%';
          this.dom.firstChild.style.margin = '0';
          this.dom.firstChild.disabled = false;

          this.linkActivated = Signal([{
              type: 'string',
              name: 'link'
          }]);
          this.linkHovered = Signal([{
              type: 'string',
              name: 'link'
          }]);

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
              // TODO
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

          this.dom.firstChild.oninput = updateValue;
          this.dom.firstChild.onpropertychanged = updateValue;

          var getLineCount = function(self) {
              return self.text.split(/\n/).length;
          }

          this.Component.completed.connect(this, function() {
              this.selectByKeyboard = !this.readOnly;
              updateValue();
          });

          function updateValue(e) {
              if (self.text != self.dom.firstChild.value) {
                  self.text = self.dom.firstChild.value;
              }
              self.length = self.text.length;
              self.lineCount = getLineCount(self);
              updateCss(self);
          }

          this.colorChanged.connect(this, function(newVal) {
              this.dom.firstChild.style.color = newVal;
          });

          this.textChanged.connect(this, function(newVal) {
              this.dom.firstChild.value = newVal;
          });

          this.$drawItem = function(c) {
              c.save();
              c.font = fontCss(this.font);
              c.fillStyle = this.color;
              c.textAlign = "left";
              c.textBaseline = "top";
              c.fillText(this.text, this.left, this.top);
              c.restore();
          }
      }
  });
