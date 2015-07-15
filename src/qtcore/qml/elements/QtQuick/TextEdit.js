  registerQmlType({
      module: 'QtQuick',
      name: 'TextEdit',
      versions: /.*/,
      constructor: function (meta) {
          QMLItem.call(this, meta);

          var self = this;

          // Properties
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

          // Undo / Redo stacks;
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
          var append = (function append(text) {
              this.text += text;
          }).bind(this);

          var copy = (function copy() {
              // TODO
              // copyToClipboard(this.selectedText);
          }).bind(this);

          var cut = (function cut() {
              this.text =
                  this.text(0, this.selectionStart) + this.text(this.selectionEnd, this.text.length);
              // TODO
              // moveToClipboard(this.selectedTex);
          }).bind(this);

          var deselect = (function deselect() {
              //this.selectionStart = -1;
              //this.selectionEnd = -1;
              //this.selectedText = null;
          }).bind(this);

          var getFormattedText = (function getFormattedText(start, end) {
              var text = this.text.slice(start, end);
              // TODO
              // process text
              return text;
          }).bind(this);

          var getText = (function getText(start, end) {
              return this.text.slice(start, end);
          }).bind(this);

          var insert = (function getText(position, text) {
              // TODO
          }).bind(this);

          var isRightToLeft = (function isRightToLeft(start, end) {
              // TODO
          }).bind(this);

          var linkAt = (function linkAt(x, y) {
              // TODO
          }).bind(this);

          var moveCursorSelection = (function moveCursorSelection(x, y) {
              // TODO
          }).bind(this);

          var paste = (function paste() {
              // TODO
          }).bind(this);

          var positionAt = (function positionAt(x, y) {
              // TODO
              // return cursor value
          }).bind(this);

          var positionToRectangle = (function positionToRectangle(position) {
              // TODO
              // return rectangle
          }).bind(this);

          var redo = (function redo() {
              // TODO
          }).bind(this);

          var remove = (function remove(start, end) {
              // TODO
              // return text from start to end
          }).bind(this);

          var select = (function select(start, end) {
              // TODO
          }).bind(this);

          var selectAll = (function selectAll() {
              //this.selectionStart = 0;
              //this.selectionEnd = this.text.length;
              //this.selectedText = this.text;
          }).bind(this);

          var selectWord = (function selectWord() {
              // TODO
              // return text from start to end
          }).bind(this);

          var undo = (function undo() {
              // TODO
          }).bind(this);

          this.dom.firstChild.oninput = updateValue;
          this.dom.firstChild.onpropertychanged = updateValue;

          var getLineCount = function (self) {
              return self.text.split(/\n/).length;
          }

          function objList(obj, title) {
              var out = [title];
              for (o in obj) {
                  var ov = obj[o];
                  if (ov)
                      out.push(o + ' : ' + ov);
              }
              return out;
          }

          function logCss() {
              var out0 = objList(self.dom.style);
              console.log(out0.join('\n'));

              var out1 = objList(self.dom.firstChild.style);
              console.log(out1.join('\n'));
          }

          this.Component.completed.connect(this, function () {
              this.selectByKeyboard = !this.readOnly;
              //logCss();
              updateValue();
          });

          function updateCss(self) {
              var supported = [
          'border',
          'borderRadius',
          'borderWidth',
          'borderColor',
          'backgroundColor', ];

              // transfer dom style to firstChild
              // and clear dom style
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

          this.colorChanged.connect(this, function (newVal) {
              this.dom.firstChild.style.color = newVal;
          });

          this.textChanged.connect(this, function (newVal) {
              this.dom.firstChild.value = newVal;
          });

          // The twofunctions below are taken from QMLText
          this.$drawItem = function (c) {
              c.save();
              c.font = fontCss(this.font);
              c.fillStyle = this.color;
              c.textAlign = "left";
              c.textBaseline = "top";
              c.fillText(this.text, this.left, this.top);
              c.restore();
          }

          // Creates font css description
          function fontCss(font) {
              var css = "";
              css += font.italic ? "italic " : "normal ";
              css += font.capitalization == "smallcaps" ? "small-caps " : "normal ";
              // Canvas seems to only support bold yes or no
              css += (font.weight == Font.Bold || font.weight == Font.DemiBold || font.weight == Font.Black || font.bold) ? "bold " : "normal ";
              css += font.pixelSize !== Undefined ? font.pixelSize + "px " : (font.pointSize || 10) + "pt ";
              css += this.lineHeight !== Undefined ? this.lineHeight + "px " : " ";
              css += (font.family || "sans-serif") + " ";
              return css;
          }
          // Creates font css description
          function fontCss(font) {
              var css = "";
              css += font.italic ? "italic " : "normal ";
              css += font.capitalization == "smallcaps" ? "small-caps " : "normal ";
              // Canvas seems to only support bold yes or no
              css += (font.weight == Font.Bold || font.weight == Font.DemiBold || font.weight == Font.Black || font.bold) ? "bold " : "normal ";
              css += font.pixelSize !== Undefined ? font.pixelSize + "px " : (font.pointSize || 10) + "pt ";
              css += this.lineHeight !== Undefined ? this.lineHeight + "px " : " ";
              css += (font.family || "sans-serif") + " ";
              return css;
          }
      }
  });
