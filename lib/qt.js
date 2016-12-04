;(function(global) {
var _slicedToArray = function () { function sliceIterator(arr, i) { var _arr = []; var _n = true; var _d = false; var _e = undefined; try { for (var _i = arr[Symbol.iterator](), _s; !(_n = (_s = _i.next()).done); _n = true) { _arr.push(_s.value); if (i && _arr.length === i) break; } } catch (err) { _d = true; _e = err; } finally { try { if (!_n && _i["return"]) _i["return"](); } finally { if (_d) throw _e; } } return _arr; } return function (arr, i) { if (Array.isArray(arr)) { return arr; } else if (Symbol.iterator in Object(arr)) { return sliceIterator(arr, i); } else { throw new TypeError("Invalid attempt to destructure non-iterable instance"); } }; }();

var _typeof = typeof Symbol === "function" && typeof Symbol.iterator === "symbol" ? function (obj) { return typeof obj; } : function (obj) { return obj && typeof Symbol === "function" && obj.constructor === Symbol && obj !== Symbol.prototype ? "symbol" : typeof obj; };

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

function _toConsumableArray(arr) { if (Array.isArray(arr)) { for (var i = 0, arr2 = Array(arr.length); i < arr.length; i++) { arr2[i] = arr[i]; } return arr2; } else { return Array.from(arr); } }

function _possibleConstructorReturn(self, call) { if (!self) { throw new ReferenceError("this hasn't been initialised - super() hasn't been called"); } return call && (typeof call === "object" || typeof call === "function") ? call : self; }

function _inherits(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function, not " + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

var QmlWeb = {};

global.QmlWeb = QmlWeb;

var objectIds = 0;

var QObject = function () {
  function QObject(parent) {
    _classCallCheck(this, QObject);

    this.$parent = parent;
    if (parent && parent.$tidyupList) {
      parent.$tidyupList.push(this);
    }

    // List of things to tidy up when deleting this object.
    this.$tidyupList = [];
    this.$properties = {};
    this.$signals = [];

    this.objectId = objectIds++;
  }

  _createClass(QObject, [{
    key: "$delete",
    value: function $delete() {
      if (this.$Component) {
        this.$Component.destruction();
      }

      while (this.$tidyupList.length > 0) {
        var item = this.$tidyupList[0];
        if (item.$delete) {
          // It's a QObject
          item.$delete();
        } else {
          // It must be a signal
          item.disconnect(this);
        }
      }

      for (var i in this.$properties) {
        var prop = this.$properties[i];
        while (prop.$tidyupList.length > 0) {
          prop.$tidyupList[0].disconnect(prop);
        }
      }

      if (this.$parent && this.$parent.$tidyupList) {
        var index = this.$parent.$tidyupList.indexOf(this);
        this.$parent.$tidyupList.splice(index, 1);
      }

      // must do this:
      // 1) parent will be notified and erase object from it's children.
      // 2) DOM node will be removed.
      this.parent = undefined;

      // Disconnect any slots connected to any of our signals. Do this after
      // clearing the parent, as that relies on parentChanged being handled.
      for (var _i in this.$signals) {
        this.$signals[_i].disconnect();
      }
    }

    // must have a `destroy` method
    // http://doc.qt.io/qt-5/qtqml-javascript-dynamicobjectcreation.html

  }, {
    key: "destroy",
    value: function destroy() {
      this.$delete();
    }
  }]);

  return QObject;
}();

QmlWeb.QObject = QObject;

var JSItemModel = function () {
  function JSItemModel() {
    _classCallCheck(this, JSItemModel);

    this.roleNames = [];

    var Signal = QmlWeb.Signal;
    this.dataChanged = Signal.signal([{ type: "int", name: "startIndex" }, { type: "int", name: "endIndex" }]);
    this.rowsInserted = Signal.signal([{ type: "int", name: "startIndex" }, { type: "int", name: "endIndex" }]);
    this.rowsMoved = Signal.signal([{ type: "int", name: "sourceStartIndex" }, { type: "int", name: "sourceEndIndex" }, { type: "int", name: "destinationIndex" }]);
    this.rowsRemoved = Signal.signal([{ type: "int", name: "startIndex" }, { type: "int", name: "endIndex" }]);
    this.modelReset = Signal.signal();
  }

  _createClass(JSItemModel, [{
    key: "setRoleNames",
    value: function setRoleNames(names) {
      this.roleNames = names;
    }
  }]);

  return JSItemModel;
}();

QmlWeb.JSItemModel = JSItemModel;

// TODO complete implementation (with attributes `r`,`g` and `b`).

var QColor = function () {
  function QColor(val) {
    _classCallCheck(this, QColor);

    this.$value = "black";
    if (val instanceof QColor) {
      // Copy constructor
      this.$value = val.$value;
    } else if (typeof val === "string") {
      this.$value = val.toLowerCase();
    } else if (typeof val === "number") {
      // we assume it is int value and must be converted to css hex with padding
      var rgb = (Math.round(val) + 0x1000000).toString(16).substr(-6);
      this.$value = "#" + rgb;
    }
  }

  _createClass(QColor, [{
    key: "toString",
    value: function toString() {
      return this.$value;
    }
  }, {
    key: "$get",
    value: function $get() {
      // Returns the same instance for all equivalent colors.
      // NOTE: the returned value should not be changed using method calls, if
      // those would be added in the future, the returned value should be wrapped.
      if (!QColor.$colors[this.$value]) {
        if (QColor.$colorsCount >= QColor.comparableColorsLimit) {
          // Too many colors created, bail out to avoid memory hit
          return this;
        }
        QColor.$colors[this.$value] = this;
        QColor.$colorsCount++;
        if (QColor.$colorsCount === QColor.comparableColorsLimit) {
          console.warn("QmlWeb: the number of QColor instances reached the limit set in", "QmlWeb.QColor.comparableColorsLimit. Further created colors would", "not be comparable to avoid memory hit.");
        }
      }
      return QColor.$colors[this.$value];
    }
  }]);

  return QColor;
}();

QColor.$colors = {};
QColor.$colorsCount = 0;
QColor.comparableColorsLimit = 10000;
QmlWeb.QColor = QColor;

var QSizeF = function (_QmlWeb$QObject) {
  _inherits(QSizeF, _QmlWeb$QObject);

  function QSizeF(width, height) {
    _classCallCheck(this, QSizeF);

    var _this = _possibleConstructorReturn(this, (QSizeF.__proto__ || Object.getPrototypeOf(QSizeF)).call(this));

    var createProperty = QmlWeb.createProperty;
    createProperty("real", _this, "width", { initialValue: width });
    createProperty("real", _this, "height", { initialValue: height });
    return _this;
  }

  return QSizeF;
}(QmlWeb.QObject);

QmlWeb.QSizeF = QSizeF;

var Signal = function () {
  function Signal() {
    var _this2 = this;

    var params = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : [];
    var options = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : {};

    _classCallCheck(this, Signal);

    this.connectedSlots = [];
    this.obj = options.obj;
    this.options = options;

    this.signal = function () {
      return _this2.execute.apply(_this2, arguments);
    };
    this.signal.parameters = params;
    this.signal.connect = this.connect.bind(this);
    this.signal.disconnect = this.disconnect.bind(this);
    this.signal.isConnected = this.isConnected.bind(this);

    // TODO Fix Keys that don't have an obj for the signal
    if (this.obj && this.obj.$signals !== undefined) {
      this.obj.$signals.push(this.signal);
    }
  }

  _createClass(Signal, [{
    key: "execute",
    value: function execute() {
      QmlWeb.QMLProperty.pushEvalStack();

      for (var _len = arguments.length, args = Array(_len), _key = 0; _key < _len; _key++) {
        args[_key] = arguments[_key];
      }

      for (var i in this.connectedSlots) {
        var desc = this.connectedSlots[i];
        if (desc.type & Signal.QueuedConnection) {
          Signal.$addQueued(desc, args);
        } else {
          Signal.$execute(desc, args);
        }
      }
      QmlWeb.QMLProperty.popEvalStack();
    }
  }, {
    key: "connect",
    value: function connect() {
      var type = Signal.AutoConnection;

      for (var _len2 = arguments.length, args = Array(_len2), _key2 = 0; _key2 < _len2; _key2++) {
        args[_key2] = arguments[_key2];
      }

      if (typeof args[args.length - 1] === "number") {
        type = args.pop();
      }
      if (type & Signal.UniqueConnection) {
        if (this.isConnected.apply(this, args)) {
          return;
        }
      }
      if (args.length === 1) {
        this.connectedSlots.push({ thisObj: global, slot: args[0], type: type });
      } else if (typeof args[1] === "string" || args[1] instanceof String) {
        if (args[0].$tidyupList && args[0] !== this.obj) {
          args[0].$tidyupList.push(this.signal);
        }
        var slot = args[0][args[1]];
        this.connectedSlots.push({ thisObj: args[0], slot: slot, type: type });
      } else {
        if (args[0].$tidyupList && (!this.obj || args[0] !== this.obj && args[0] !== this.obj.$parent)) {
          args[0].$tidyupList.push(this.signal);
        }
        this.connectedSlots.push({ thisObj: args[0], slot: args[1], type: type });
      }

      // Notify object of connect
      if (this.options.obj && this.options.obj.$connectNotify) {
        this.options.obj.$connectNotify(this.options);
      }
    }
  }, {
    key: "disconnect",
    value: function disconnect() {
      for (var _len3 = arguments.length, args = Array(_len3), _key3 = 0; _key3 < _len3; _key3++) {
        args[_key3] = arguments[_key3];
      }

      // type meaning:
      //  1 = function, 2 = string
      //  3 = object with string method,  4 = object with function
      // No args means disconnect everything connected to this signal
      var callType = args.length === 1 ? args[0] instanceof Function ? 1 : 2 : typeof args[1] === "string" || args[1] instanceof String ? 3 : 4;
      for (var i = 0; i < this.connectedSlots.length; i++) {
        var _connectedSlots$i = this.connectedSlots[i],
            slot = _connectedSlots$i.slot,
            thisObj = _connectedSlots$i.thisObj;

        if (args.length === 0 || callType === 1 && slot === args[0] || callType === 2 && thisObj === args[0] || callType === 3 && thisObj === args[0] && slot === args[0][args[1]] || thisObj === args[0] && slot === args[1]) {
          if (thisObj) {
            var index = thisObj.$tidyupList.indexOf(this.signal);
            if (index >= 0) {
              thisObj.$tidyupList.splice(index, 1);
            }
          }
          this.connectedSlots.splice(i, 1);
          // We have removed an item from the list so the indexes shifted one
          // backwards
          i--;
        }
      }

      // Notify object of disconnect
      if (this.options.obj && this.options.obj.$disconnectNotify) {
        this.options.obj.$disconnectNotify(this.options);
      }
    }
  }, {
    key: "isConnected",
    value: function isConnected() {
      for (var _len4 = arguments.length, args = Array(_len4), _key4 = 0; _key4 < _len4; _key4++) {
        args[_key4] = arguments[_key4];
      }

      var callType = args.length === 1 ? 1 : typeof args[1] === "string" || args[1] instanceof String ? 2 : 3;
      for (var i in this.connectedSlots) {
        var _connectedSlots$i2 = this.connectedSlots[i],
            slot = _connectedSlots$i2.slot,
            thisObj = _connectedSlots$i2.thisObj;

        if (callType === 1 && slot === args[0] || callType === 2 && thisObj === args[0] && slot === args[0][args[1]] || thisObj === args[0] && slot === args[1]) {
          return true;
        }
      }
      return false;
    }
  }], [{
    key: "signal",
    value: function signal() {
      for (var _len5 = arguments.length, args = Array(_len5), _key5 = 0; _key5 < _len5; _key5++) {
        args[_key5] = arguments[_key5];
      }

      return new (Function.prototype.bind.apply(Signal, [null].concat(args)))().signal;
    }
  }, {
    key: "$execute",
    value: function $execute(desc, args) {
      try {
        desc.slot.apply(desc.thisObj, args);
      } catch (err) {
        console.error("Signal slot error:", err.message, err, Function.prototype.toString.call(desc.slot));
      }
    }
  }, {
    key: "$addQueued",
    value: function $addQueued(desc, args) {
      if (Signal.$queued.length === 0) {
        if (global.setImmediate) {
          global.setImmediate(Signal.$executeQueued);
        } else {
          global.setTimeout(Signal.$executeQueued, 0);
        }
      }
      Signal.$queued.push([desc, args]);
    }
  }, {
    key: "$executeQueued",
    value: function $executeQueued() {
      // New queued signals should be executed on next tick of the event loop
      var queued = Signal.$queued;
      Signal.$queued = [];

      QmlWeb.QMLProperty.pushEvalStack();
      for (var i in queued) {
        Signal.$execute.apply(Signal, _toConsumableArray(queued[i]));
      }
      QmlWeb.QMLProperty.popEvalStack();
    }
  }]);

  return Signal;
}();

Signal.$queued = [];

Signal.AutoConnection = 0;
Signal.DirectConnection = 1;
Signal.QueuedConnection = 2;
Signal.UniqueConnection = 128;

QmlWeb.Signal = Signal;

var Qt = {
  rgba: function rgba(r, g, b, a) {
    var intr = Math.round(r * 255);
    var intg = Math.round(g * 255);
    var intb = Math.round(b * 255);
    return "rgba(" + intr + "," + intg + "," + intb + "," + a + ")";
  },
  hsla: function hsla(h, s, l, a) {
    var inth = Math.round(h * 360);
    var ints = Math.round(s * 100);
    var intl = Math.round(l * 100);
    return "hsla(" + inth + "," + ints + "%," + intl + "%," + a + ")";
  },
  openUrlExternally: function openUrlExternally(url) {
    var page = window.open(url, "_blank");
    page.focus();
  },
  // Load file, parse and construct as Component (.qml)
  createComponent: function createComponent(name) {
    var engine = QmlWeb.engine;

    var file = engine.$resolvePath(name);

    // If "name" was a full URL, "file" will be equivalent to name and this
    // will try and load the Component from the full URL, otherwise, this
    // doubles as checking for the file in the current directory.
    var tree = engine.loadComponent(file);

    // If the Component is not found, and it is not a URL, look for "name" in
    // this context's importSearchPaths
    if (!tree) {
      var nameIsUrl = engine.$parseURI(name) !== undefined;
      if (!nameIsUrl) {
        var moreDirs = engine.importSearchPaths(QmlWeb.executionContext.importContextId);
        for (var i = 0; i < moreDirs.length; i++) {
          file = "" + moreDirs[i] + name;
          tree = engine.loadComponent(file);
          if (tree) break;
        }
      }
    }

    if (!tree) {
      return undefined;
    }

    var QMLComponent = QmlWeb.getConstructor("QtQml", "2.0", "Component");
    var component = new QMLComponent({
      object: tree,
      context: QmlWeb.executionContext
    });
    component.$basePath = engine.extractBasePath(file);
    component.$imports = tree.$imports;
    component.$file = file; // just for debugging

    engine.loadImports(tree.$imports, component.$basePath, component.importContextId);

    engine.components[name] = component;
    return component;
  },

  createQmlObject: function createQmlObject(src, parent, file) {
    var tree = QmlWeb.parseQML(src, file);

    // Create and initialize objects

    var QMLComponent = QmlWeb.getConstructor("QtQml", "2.0", "Component");
    var component = new QMLComponent({
      object: tree,
      parent: parent,
      context: QmlWeb.executionContext
    });

    var engine = QmlWeb.engine;
    engine.loadImports(tree.$imports, undefined, component.importContextId);

    var resolvedFile = file || Qt.resolvedUrl("createQmlObject_function");
    component.$basePath = engine.extractBasePath(resolvedFile);
    component.$imports = tree.$imports; // for later use
    // not just for debugging, but for basepath too, see above
    component.$file = resolvedFile;

    var obj = component.createObject(parent);

    var QMLOperationState = QmlWeb.QMLOperationState;
    if (engine.operationState !== QMLOperationState.Init && engine.operationState !== QMLOperationState.Idle) {
      // We don't call those on first creation, as they will be called
      // by the regular creation-procedures at the right time.
      engine.$initializePropertyBindings();

      engine.callCompletedSignals();
    }

    return obj;
  },

  // Returns url resolved relative to the URL of the caller.
  // http://doc.qt.io/qt-5/qml-qtqml-qt.html#resolvedUrl-method
  resolvedUrl: function resolvedUrl(url) {
    return QmlWeb.qmlUrl(url);
  },

  size: function size(width, height) {
    return new QmlWeb.QSizeF(width, height);
  },

  // Buttons masks
  LeftButton: 1,
  RightButton: 2,
  MiddleButton: 4,
  // Modifiers masks
  NoModifier: 0,
  ShiftModifier: 1,
  ControlModifier: 2,
  AltModifier: 4,
  MetaModifier: 8,
  KeypadModifier: 16, // Note: Not available in web
  // Layout directions
  LeftToRight: 0,
  RightToLeft: 1,
  // Orientations
  Vertical: 0,
  Horizontal: 1,
  // Keys
  Key_Escape: 27,
  Key_Tab: 9,
  Key_Backtab: 245,
  Key_Backspace: 8,
  Key_Return: 13,
  Key_Enter: 13,
  Key_Insert: 45,
  Key_Delete: 46,
  Key_Pause: 19,
  Key_Print: 42,
  Key_SysReq: 0,
  Key_Clear: 12,
  Key_Home: 36,
  Key_End: 35,
  Key_Left: 37,
  Key_Up: 38,
  Key_Right: 39,
  Key_Down: 40,
  Key_PageUp: 33,
  Key_PageDown: 34,
  Key_Shift: 16,
  Key_Control: 17,
  Key_Meta: 91,
  Key_Alt: 18,
  Key_AltGr: 0,
  Key_CapsLock: 20,
  Key_NumLock: 144,
  Key_ScrollLock: 145,
  Key_F1: 112, Key_F2: 113, Key_F3: 114, Key_F4: 115, Key_F5: 116, Key_F6: 117,
  Key_F7: 118, Key_F8: 119, Key_F9: 120, Key_F10: 121, Key_F11: 122,
  Key_F12: 123, Key_F13: 124, Key_F14: 125, Key_F15: 126, Key_F16: 127,
  Key_F17: 128, Key_F18: 129, Key_F19: 130, Key_F20: 131, Key_F21: 132,
  Key_F22: 133, Key_F23: 134, Key_F24: 135,
  Key_F25: 0, Key_F26: 0, Key_F27: 0, Key_F28: 0, Key_F29: 0, Key_F30: 0,
  Key_F31: 0, Key_F32: 0, Key_F33: 0, Key_F34: 0, Key_F35: 0,
  Key_Super_L: 0,
  Key_Super_R: 0,
  Key_Menu: 0,
  Key_Hyper_L: 0,
  Key_Hyper_R: 0,
  Key_Help: 6,
  Key_Direction_L: 0,
  Key_Direction_R: 0,
  Key_Space: 32,
  Key_Any: 32,
  Key_Exclam: 161,
  Key_QuoteDbl: 162,
  Key_NumberSign: 163,
  Key_Dollar: 164,
  Key_Percent: 165,
  Key_Ampersant: 166,
  Key_Apostrophe: 222,
  Key_ParenLeft: 168,
  Key_ParenRight: 169,
  Key_Asterisk: 170,
  Key_Plus: 171,
  Key_Comma: 188,
  Key_Minus: 173,
  Key_Period: 190,
  Key_Slash: 191,
  Key_0: 48, Key_1: 49, Key_2: 50, Key_3: 51, Key_4: 52,
  Key_5: 53, Key_6: 54, Key_7: 55, Key_8: 56, Key_9: 57,
  Key_Colon: 58,
  Key_Semicolon: 59,
  Key_Less: 60,
  Key_Equal: 61,
  Key_Greater: 62,
  Key_Question: 63,
  Key_At: 64,
  Key_A: 65, Key_B: 66, Key_C: 67, Key_D: 68, Key_E: 69, Key_F: 70, Key_G: 71,
  Key_H: 72, Key_I: 73, Key_J: 74, Key_K: 75, Key_L: 76, Key_M: 77, Key_N: 78,
  Key_O: 79, Key_P: 80, Key_Q: 81, Key_R: 82, Key_S: 83, Key_T: 84, Key_U: 85,
  Key_V: 86, Key_W: 87, Key_X: 88, Key_Y: 89, Key_Z: 90,
  Key_BracketLeft: 219,
  Key_Backslash: 220,
  Key_BracketRight: 221,
  Key_AsciiCircum: 160,
  Key_Underscore: 167,
  Key_QuoteLeft: 0,
  Key_BraceLeft: 174,
  Key_Bar: 172,
  Key_BraceRight: 175,
  Key_AsciiTilde: 176,
  Key_Back: 0,
  Key_Forward: 0,
  Key_Stop: 0,
  Key_VolumeDown: 182,
  Key_VolumeUp: 183,
  Key_VolumeMute: 181,
  Key_multiply: 106,
  Key_add: 107,
  Key_substract: 109,
  Key_divide: 111,
  Key_News: 0,
  Key_OfficeHome: 0,
  Key_Option: 0,
  Key_Paste: 0,
  Key_Phone: 0,
  Key_Calendar: 0,
  Key_Reply: 0,
  Key_Reload: 0,
  Key_RotateWindows: 0,
  Key_RotationPB: 0,
  Key_RotationKB: 0,
  Key_Save: 0,
  Key_Send: 0,
  Key_Spell: 0,
  Key_SplitScreen: 0,
  Key_Support: 0,
  Key_TaskPane: 0,
  Key_Terminal: 0,
  Key_Tools: 0,
  Key_Travel: 0,
  Key_Video: 0,
  Key_Word: 0,
  Key_Xfer: 0,
  Key_ZoomIn: 0,
  Key_ZoomOut: 0,
  Key_Away: 0,
  Key_Messenger: 0,
  Key_WebCam: 0,
  Key_MailForward: 0,
  Key_Pictures: 0,
  Key_Music: 0,
  Key_Battery: 0,
  Key_Bluetooth: 0,
  Key_WLAN: 0,
  Key_UWB: 0,
  Key_AudioForward: 0,
  Key_AudioRepeat: 0,
  Key_AudioRandomPlay: 0,
  Key_Subtitle: 0,
  Key_AudioCycleTrack: 0,
  Key_Time: 0,
  Key_Hibernate: 0,
  Key_View: 0,
  Key_TopMenu: 0,
  Key_PowerDown: 0,
  Key_Suspend: 0,
  Key_ContrastAdjust: 0,
  Key_MediaLast: 0,
  Key_unknown: -1,
  Key_Call: 0,
  Key_Camera: 0,
  Key_CameraFocus: 0,
  Key_Context1: 0,
  Key_Context2: 0,
  Key_Context3: 0,
  Key_Context4: 0,
  Key_Flip: 0,
  Key_Hangup: 0,
  Key_No: 0,
  Key_Select: 93,
  Key_Yes: 0,
  Key_ToggleCallHangup: 0,
  Key_VoiceDial: 0,
  Key_LastNumberRedial: 0,
  Key_Execute: 43,
  Key_Printer: 42,
  Key_Play: 250,
  Key_Sleep: 95,
  Key_Zoom: 251,
  Key_Cancel: 3,
  // Align
  AlignLeft: 0x0001,
  AlignRight: 0x0002,
  AlignHCenter: 0x0004,
  AlignJustify: 0x0008,
  AlignTop: 0x0020,
  AlignBottom: 0x0040,
  AlignVCenter: 0x0080,
  AlignCenter: 0x0084,
  AlignBaseline: 0x0100,
  AlignAbsolute: 0x0010,
  AlignLeading: 0x0001,
  AlignTrailing: 0x0002,
  AlignHorizontal_Mask: 0x001f,
  AlignVertical_Mask: 0x01e0,
  // Screen
  PrimaryOrientation: 0,
  PortraitOrientation: 1,
  LandscapeOrientation: 2,
  InvertedPortraitOrientation: 4,
  InvertedLandscapeOrientation: 8,
  // CursorShape
  ArrowCursor: 0,
  UpArrowCursor: 1,
  CrossCursor: 2,
  WaitCursor: 3,
  IBeamCursor: 4,
  SizeVerCursor: 5,
  SizeHorCursor: 6,
  SizeBDiagCursor: 7,
  SizeFDiagCursor: 8,
  SizeAllCursor: 9,
  BlankCursor: 10,
  SplitVCursor: 11,
  SplitHCursor: 12,
  PointingHandCursor: 13,
  ForbiddenCursor: 14,
  WhatsThisCursor: 15,
  BusyCursor: 16,
  OpenHandCursor: 17,
  ClosedHandCursor: 18,
  DragCopyCursor: 19,
  DragMoveCursor: 20,
  DragLinkCursor: 21,
  LastCursor: 21, //DragLinkCursor,
  BitmapCursor: 24,
  CustomCursor: 25,
  // ScrollBar Policy
  ScrollBarAsNeeded: 0,
  ScrollBarAlwaysOff: 1,
  ScrollBarAlwaysOn: 2
};

QmlWeb.Qt = Qt;

var QMLBinding = function () {
  /**
   * Create QML binding.
   * @param {Variant} val Sourcecode or function representing the binding
   * @param {Array} tree Parser tree of the binding
   * @return {Object} Object representing the binding
   */
  function QMLBinding(val, tree) {
    _classCallCheck(this, QMLBinding);

    // this.isFunction states whether the binding is a simple js statement or a
    // function containing a return statement. We decide this on whether it is a
    // code block or not. If it is, we require a return statement. If it is a
    // code block it could though also be a object definition, so we need to
    // check that as well (it is, if the content is labels).
    this.isFunction = tree && tree[0] === "block" && tree[1][0] && tree[1][0][0] !== "label";
    this.src = val;
    this.compiled = false;
  }

  _createClass(QMLBinding, [{
    key: "toJSON",
    value: function toJSON() {
      return {
        src: this.src,
        deps: JSON.stringify(this.deps),
        tree: JSON.stringify(this.tree)
      };
    }
  }, {
    key: "eval",
    value: function _eval(object, context, basePath) {
      // .call is needed for `this` support
      return this.impl.call(object, object, context, basePath);
    }

    /**
     * Compile binding. Afterwards you may call binding.eval to evaluate.
     */

  }, {
    key: "compile",
    value: function compile() {
      this.src = this.src.trim();
      this.impl = QMLBinding.bindSrc(this.src, this.isFunction);
      this.compiled = true;
    }
  }], [{
    key: "bindSrc",
    value: function bindSrc(src, isFunction) {
      return new Function("__executionObject", "__executionContext", "__basePath", "\n      QmlWeb.executionContext = __executionContext;\n      if (__basePath) {\n        QmlWeb.engine.$basePath = __basePath;\n      }\n      with(QmlWeb) with(__executionContext) with(__executionObject) {\n        " + (isFunction ? "" : "return") + " " + src + "\n      }\n    ");
    }
  }]);

  return QMLBinding;
}();

QmlWeb.QMLBinding = QMLBinding;

function QMLBoolean(val) {
  return !!val;
}
QMLBoolean.plainType = true;
QmlWeb.qmlBoolean = QMLBoolean;

// There can only be one running QMLEngine.
// This variable points to the currently running engine.
QmlWeb.engine = null;

var geometryProperties = ["width", "height", "fill", "x", "y", "left", "right", "top", "bottom"];

// QML engine. EXPORTED.

var QMLEngine = function () {
  function QMLEngine(element) {
    _classCallCheck(this, QMLEngine);

    //----------Public Members----------

    this.fps = 60;
    // Math.floor, causes bugs to timing?
    this.$interval = Math.floor(1000 / this.fps);
    this.running = false;
    this.rootElement = element;

    // Cached component trees (post-QmlWeb.convertToEngine)
    this.components = {};

    // Cached parsed JS files (post-QmlWeb.jsparse)
    this.js = {};

    // List of Component.completed signals
    this.completedSignals = [];

    // Current operation state of the engine (Idle, init, etc.)
    this.operationState = 1;

    // List of properties whose values are bindings. For internal use only.
    this.bindedProperties = [];

    // List of operations to perform later after init. For internal use only.
    this.pendingOperations = [];

    // Root object of the engine
    this.rootObject = null;

    // Base path of qml engine (used for resource loading)
    this.$basePath = "";

    // Module import paths overrides
    this.userAddedModulePaths = {};

    // Stores data for setImportPathList(), importPathList(), and addImportPath
    this.userAddedImportPaths = [];

    //----------Private Members---------

    // Ticker resource id and ticker callbacks
    this._tickers = [];
    this._lastTick = Date.now();

    // Callbacks for stopping or starting the engine
    this._whenStop = [];
    this._whenStart = [];

    // Keyboard management
    this.$initKeyboard();

    //----------Construct----------

    // TODO: Move to module initialization
    var QMLBaseObject = QmlWeb.getConstructor("QtQml", "2.0", "QtObject");
    var constructors = QmlWeb.constructors;
    for (var i in constructors) {
      if (constructors[i].getAttachedObject) {
        QmlWeb.setupGetter(QMLBaseObject.prototype, i, constructors[i].getAttachedObject);
      }
    }
  }

  //---------- Public Methods ----------

  // Start the engine


  _createClass(QMLEngine, [{
    key: "start",
    value: function start() {
      QmlWeb.engine = this;
      var QMLOperationState = QmlWeb.QMLOperationState;
      if (this.operationState !== QMLOperationState.Running) {
        this.operationState = QMLOperationState.Running;
        this._tickerId = setInterval(this._tick.bind(this), this.$interval);
        this._whenStart.forEach(function (callback) {
          return callback();
        });
      }
    }

    // Stop the engine

  }, {
    key: "stop",
    value: function stop() {
      var QMLOperationState = QmlWeb.QMLOperationState;
      if (this.operationState === QMLOperationState.Running) {
        clearInterval(this._tickerId);
        this.operationState = QMLOperationState.Idle;
        this._whenStop.forEach(function (callback) {
          return callback();
        });
      }
    }

    // eslint-disable-next-line max-len
    /** from http://docs.closure-library.googlecode.com/git/local_closure_goog_uri_uri.js.source.html
     *
     * Removes dot segments in given path component, as described in
     * RFC 3986, section 5.2.4.
     *
     * @param {string} path A non-empty path component.
     * @return {string} Path component with removed dot segments.
     */

  }, {
    key: "removeDotSegments",
    value: function removeDotSegments(path) {
      // path.startsWith("/") is not supported in some browsers
      var leadingSlash = path && path[0] === "/";
      var segments = path.split("/");
      var out = [];

      for (var pos = 0; pos < segments.length;) {
        var segment = segments[pos++];

        if (segment === ".") {
          if (leadingSlash && pos === segments.length) {
            out.push("");
          }
        } else if (segment === "..") {
          if (out.length > 1 || out.length === 1 && out[0] !== "") {
            out.pop();
          }
          if (leadingSlash && pos === segments.length) {
            out.push("");
          }
        } else {
          out.push(segment);
          leadingSlash = true;
        }
      }

      return out.join("/");
    }
  }, {
    key: "extractBasePath",
    value: function extractBasePath(file) {
      // work both in url ("/") and windows ("\", from file://d:\test\) notation
      var basePath = file.split(/[/\\]/);
      basePath[basePath.length - 1] = "";
      return basePath.join("/");
    }
  }, {
    key: "extractFileName",
    value: function extractFileName(file) {
      return file.split(/[/\\]/).pop();
    }

    // Load file, parse and construct (.qml or .qml.js)

  }, {
    key: "loadFile",
    value: function loadFile(file) {
      var parentComponent = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : null;

      // Create an anchor element to get the absolute path from the DOM
      if (!this.$basePathA) {
        this.$basePathA = document.createElement("a");
      }
      this.$basePathA.href = this.extractBasePath(file);
      this.$basePath = this.$basePathA.href;
      var fileName = this.extractFileName(file);
      var tree = this.loadComponent(this.$resolvePath(fileName));
      return this.loadQMLTree(tree, parentComponent, file);
    }

    // parse and construct qml
    // file is not required; only for debug purposes
    // This function is only used by the QmlWeb tests

  }, {
    key: "loadQML",
    value: function loadQML(src) {
      var parentComponent = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : null;
      var file = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : undefined;

      return this.loadQMLTree(QmlWeb.parseQML(src, file), parentComponent, file);
    }
  }, {
    key: "loadQMLTree",
    value: function loadQMLTree(tree) {
      var parentComponent = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : null;
      var file = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : undefined;

      QmlWeb.engine = this;

      // Create and initialize objects
      var QMLComponent = QmlWeb.getConstructor("QtQml", "2.0", "Component");
      var component = new QMLComponent({
        object: tree,
        parent: parentComponent
      });

      this.loadImports(tree.$imports, undefined, component.importContextId);
      component.$basePath = this.$basePath;
      component.$imports = tree.$imports; // for later use
      component.$file = file; // just for debugging

      this.rootObject = component.$createObject(parentComponent);
      component.finalizeImports(this.rootContext());
      this.$initializePropertyBindings();

      this.start();

      this.callCompletedSignals();

      return component;
    }
  }, {
    key: "rootContext",
    value: function rootContext() {
      return this.rootObject.$context;
    }

    // next 3 methods used in Qt.createComponent for qml files lookup
    // http://doc.qt.io/qt-5/qqmlengine.html#addImportPath

  }, {
    key: "addImportPath",
    value: function addImportPath(dirpath) {
      this.userAddedImportPaths.push(dirpath);
    }

    /* Add this dirpath to be checked for components. This is the result of
     * something like:
     *
     * import "SomeDir/AnotherDirectory"
     *
     * The importContextId ensures it is only accessible from the file in which
     * it was imported. */

  }, {
    key: "addComponentImportPath",
    value: function addComponentImportPath(importContextId, dirpath, qualifier) {
      if (!this.componentImportPaths) {
        this.componentImportPaths = {};
      }
      if (!this.componentImportPaths[importContextId]) {
        this.componentImportPaths[importContextId] = {};
      }

      var paths = this.componentImportPaths[importContextId];

      if (qualifier) {
        if (!paths.qualified) {
          paths.qualified = {};
        }
        paths.qualified[qualifier] = dirpath;
      } else {
        if (!paths.unqualified) {
          paths.unqualified = [];
        }
        paths.unqualified.push(dirpath);
      }
    }
  }, {
    key: "importSearchPaths",
    value: function importSearchPaths(importContextId) {
      if (!this.componentImportPaths) {
        return [];
      }
      var paths = this.componentImportPaths[importContextId];
      if (!paths) {
        return [];
      }
      return paths.unqualified || [];
    }
  }, {
    key: "qualifiedImportPath",
    value: function qualifiedImportPath(importContextId, qualifier) {
      if (!this.componentImportPaths) {
        return "";
      }
      var paths = this.componentImportPaths[importContextId];
      if (!paths || !paths.qualified) {
        return "";
      }
      return paths.qualified[qualifier] || "";
    }
  }, {
    key: "setImportPathList",
    value: function setImportPathList(arrayOfDirs) {
      this.userAddedImportPaths = arrayOfDirs;
    }
  }, {
    key: "importPathList",
    value: function importPathList() {
      return this.userAddedImportPaths;
    }

    // `addModulePath` defines conrete path for module lookup
    // e.g. addModulePath("QtQuick.Controls", "http://example.com/controls")
    // will force system to `import QtQuick.Controls` module from
    // `http://example.com/controls/qmldir`

  }, {
    key: "addModulePath",
    value: function addModulePath(moduleName, dirPath) {
      // Keep the mapping. It will be used in loadImports() function.
      // Remove trailing slash as it required for `readQmlDir`.
      this.userAddedModulePaths[moduleName] = dirPath.replace(/\/$/, "");
    }
  }, {
    key: "registerProperty",
    value: function registerProperty(obj, propName) {
      var dependantProperties = [];
      var value = obj[propName];

      var getter = function getter() {
        var QMLProperty = QmlWeb.QMLProperty;
        if (QMLProperty.evaluatingProperty && dependantProperties.indexOf(QMLProperty.evaluatingProperty) === -1) {
          dependantProperties.push(QMLProperty.evaluatingProperty);
        }
        return value;
      };

      var setter = function setter(newVal) {
        value = newVal;
        for (var i in dependantProperties) {
          dependantProperties[i].update();
        }
      };

      QmlWeb.setupGetterSetter(obj, propName, getter, setter);
    }
  }, {
    key: "loadImports",
    value: function loadImports(importsArray) {
      var currentFileDir = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : this.$basePath;
      var importContextId = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : -1;

      if (!this.qmldirsContents) {
        this.qmldirsContents = {}; // cache

        // putting initial keys in qmldirsContents - is a hack. We should find a
        // way to explain to qmlweb, is this built-in module or qmldir-style
        // module.
        for (var module in QmlWeb.modules) {
          if (module !== "Main") {
            this.qmldirsContents[module] = {};
          }
        }
      }

      if (!this.qmldirs) {
        this.qmldirs = {}; // resulting components lookup table
      }

      if (!importsArray || importsArray.length === 0) {
        return;
      }

      for (var i = 0; i < importsArray.length; i++) {
        this.loadImport(importsArray[i], currentFileDir, importContextId);
      }
    }
  }, {
    key: "loadImport",
    value: function loadImport(entry, currentFileDir, importContextId) {
      var name = entry[1];

      // is it url to remote resource
      var nameIsUrl = name.indexOf("//") === 0 || name.indexOf("://") >= 0;
      // is it a module name, e.g. QtQuick, QtQuick.Controls, etc
      var nameIsQualifiedModuleName = entry[4];
      // local [relative] dir
      var nameIsDir = !nameIsQualifiedModuleName && !nameIsUrl;

      if (nameIsDir) {
        name = this.$resolvePath(name, currentFileDir);
        if (name[name.length - 1] === "/") {
          // remove trailing slash as it required for `readQmlDir`
          name = name.substr(0, name.length - 1);
        }
      }

      var content = this.qmldirsContents[name];
      // check if we have already loaded that qmldir file
      if (!content) {
        if (nameIsQualifiedModuleName && this.userAddedModulePaths[name]) {
          // 1. we have qualified module and user had configured path for that
          // module with this.addModulePath
          content = QmlWeb.readQmlDir(this.userAddedModulePaths[name]);
        } else if (nameIsUrl || nameIsDir) {
          // 2. direct load
          // nameIsUrl => url do not need dirs
          // nameIsDir => already computed full path above
          content = QmlWeb.readQmlDir(name);
        } else {
          // 3. qt-style lookup for qualified module
          var probableDirs = [currentFileDir].concat(this.importPathList());
          var diredName = name.replace(/\./g, "/");

          for (var k = 0; k < probableDirs.length; k++) {
            var file = probableDirs[k] + diredName;
            content = QmlWeb.readQmlDir(file);
            if (content) {
              break;
            }
          }
        }
        this.qmldirsContents[name] = content;
      }

      /* If there is no qmldir, add these directories to the list of places to
        * search for components (within this import scope). "noqmldir" is
        * inserted into the qmldir cache to avoid future attempts at fetching
        * the qmldir file, but we always need to the call to
        * "addComponentImportPath" for these sorts of directories. */
      if (!content || content === "noqmldir") {
        if (nameIsDir) {
          if (entry[3]) {
            /* Use entry[1] directly, as we don't want to include the
              * basePath, otherwise it gets prepended twice in
              * createComponent. */
            this.addComponentImportPath(importContextId, entry[1] + "/", entry[3]);
          } else {
            this.addComponentImportPath(importContextId, name + "/");
          }
        }

        this.qmldirsContents[name] = "noqmldir";
        return;
      }

      // copy founded externals to global var
      // TODO actually we have to copy it to current component
      for (var attrname in content.externals) {
        this.qmldirs[attrname] = content.externals[attrname];
      }

      // keep already loaded qmldir files
      this.qmldirsContents[name] = content;
    }
  }, {
    key: "size",
    value: function size() {
      return {
        width: this.rootObject.getWidth(),
        height: this.rootObject.getHeight()
      };
    }
  }, {
    key: "focusedElement",
    value: function focusedElement() {
      return this.rootContext().activeFocus;
    }

    //---------- Private Methods ----------

  }, {
    key: "$initKeyboard",
    value: function $initKeyboard() {
      var _this3 = this;

      document.onkeypress = function (e) {
        var focusedElement = _this3.focusedElement();
        var event = QmlWeb.eventToKeyboard(e || window.event);
        var eventName = QmlWeb.keyboardSignals[event.key];

        while (focusedElement && !event.accepted) {
          var backup = focusedElement.$context.event;
          focusedElement.$context.event = event;
          focusedElement.Keys.pressed(event);
          if (eventName) {
            focusedElement.Keys[eventName](event);
          }
          focusedElement.$context.event = backup;
          if (event.accepted) {
            e.preventDefault();
          } else {
            focusedElement = focusedElement.$parent;
          }
        }
      };

      document.onkeyup = function (e) {
        var focusedElement = _this3.focusedElement();
        var event = QmlWeb.eventToKeyboard(e || window.event);

        while (focusedElement && !event.accepted) {
          var backup = focusedElement.$context.event;
          focusedElement.$context.event = event;
          focusedElement.Keys.released(event);
          focusedElement.$context.event = backup;
          if (event.accepted) {
            e.preventDefault();
          } else {
            focusedElement = focusedElement.$parent;
          }
        }
      };
    }
  }, {
    key: "_tick",
    value: function _tick() {
      var now = Date.now();
      var elapsed = now - this._lastTick;
      this._lastTick = now;
      this._tickers.forEach(function (ticker) {
        return ticker(now, elapsed);
      });
    }

    // Load resolved file, parse and construct as Component (.qml)

  }, {
    key: "loadComponent",
    value: function loadComponent(file) {
      if (file in this.components) {
        return this.components[file];
      }

      var uri = this.$parseURI(file);
      if (!uri) {
        return undefined;
      }

      var tree = void 0;
      if (uri.scheme === "qrc://") {
        tree = QmlWeb.qrc[uri.path];
        if (!tree) {
          return undefined;
        }
        // QmlWeb.qrc contains pre-parsed Component objects, but they still need
        // convertToEngine called on them.
        tree = QmlWeb.convertToEngine(tree);
      } else {
        var src = QmlWeb.getUrlContents(file, true);
        if (!src) {
          console.error("QMLEngine.loadComponent: Failed to load:", file);
          return undefined;
        }

        console.log("QMLEngine.loadComponent: Loading file:", file);
        tree = QmlWeb.parseQML(src, file);
      }

      if (!tree) {
        return undefined;
      }

      if (tree.$children.length !== 1) {
        console.error("QMLEngine.loadComponent: Failed to load:", file, ": A QML component must only contain one root element!");
        return undefined;
      }

      tree.$file = file;
      this.components[file] = tree;
      return tree;
    }

    // Load resolved file and parse as JavaScript

  }, {
    key: "loadJS",
    value: function loadJS(file) {
      if (file in this.js) {
        return this.js[file];
      }

      var uri = this.$parseURI(file);
      if (!uri) {
        return undefined;
      }

      if (uri.scheme === "qrc://") {
        return QmlWeb.qrc[uri.path];
      }

      QmlWeb.loadParser();
      return QmlWeb.jsparse(QmlWeb.getUrlContents(file));
    }
  }, {
    key: "$registerStart",
    value: function $registerStart(f) {
      this._whenStart.push(f);
    }
  }, {
    key: "$registerStop",
    value: function $registerStop(f) {
      this._whenStop.push(f);
    }
  }, {
    key: "$addTicker",
    value: function $addTicker(t) {
      this._tickers.push(t);
    }
  }, {
    key: "$removeTicker",
    value: function $removeTicker(t) {
      var index = this._tickers.indexOf(t);
      if (index !== -1) {
        this._tickers.splice(index, 1);
      }
    }
  }, {
    key: "$initializePropertyBindings",
    value: function $initializePropertyBindings() {
      // Initialize property bindings
      // we use `while`, because $initializePropertyBindings may be called
      // recursive (because of Loader and/or createQmlObject )
      while (this.bindedProperties.length > 0) {
        var property = this.bindedProperties.shift();

        if (!property.binding) {
          // Probably, the binding was overwritten by an explicit value. Ignore.
          continue;
        }

        if (property.needsUpdate) {
          property.update();
        } else if (geometryProperties.indexOf(property.name) >= 0) {
          // It is possible that bindings with these names was already evaluated
          // during eval of other bindings but in that case $updateHGeometry and
          // $updateVGeometry could be blocked during their eval.
          // So we call them explicitly, just in case.
          var obj = property.obj,
              changed = property.changed;

          if (obj.$updateHGeometry && changed.isConnected(obj, obj.$updateHGeometry)) {
            obj.$updateHGeometry(property.val, property.val, property.name);
          }
          if (obj.$updateVGeometry && changed.isConnected(obj, obj.$updateVGeometry)) {
            obj.$updateVGeometry(property.val, property.val, property.name);
          }
        }
      }

      this.$initializeAliasSignals();
    }

    // This parses the full URL into scheme, authority and path

  }, {
    key: "$parseURI",
    value: function $parseURI(uri) {
      var match = uri.match(/^([^/]*?:\/\/)(.*?)(\/.*)$/);
      if (match) {
        return {
          scheme: match[1],
          authority: match[2],
          path: match[3]
        };
      }
      return undefined;
    }

    // Return a path to load the file

  }, {
    key: "$resolvePath",
    value: function $resolvePath(file) {
      var basePath = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : this.$basePath;

      // probably, replace :// with :/ ?
      if (!file || file.indexOf("://") !== -1 || file.indexOf("data:") === 0 || file.indexOf("blob:") === 0) {
        return file;
      }

      var basePathURI = this.$parseURI(basePath);
      if (!basePathURI) {
        return file;
      }

      var path = basePathURI.path;
      if (file.indexOf("/") === 0) {
        path = file;
      } else {
        path = "" + path + file;
      }

      // Remove duplicate slashes and dot segments in the path
      path = this.removeDotSegments(path.replace(/([^:]\/)\/+/g, "$1"));

      return "" + basePathURI.scheme + basePathURI.authority + path;
    }

    // Return a DOM-valid path to load the image (fileURL is an already-resolved
    // URL)

  }, {
    key: "$resolveImageURL",
    value: function $resolveImageURL(fileURL) {
      var uri = this.$parseURI(fileURL);
      // If we are within the resource system, look up a "real" path that can be
      // used by the DOM. If not found, return the path itself without the
      // "qrc://" scheme.
      if (uri && uri.scheme === "qrc://") {
        return QmlWeb.qrc[uri.path] || uri.path;
      }

      // Something we can't parse, just pass it through
      return fileURL;
    }
  }, {
    key: "$initializeAliasSignals",
    value: function $initializeAliasSignals() {
      // Perform pending operations. Now we use it only to init alias's "changed"
      // handlers, that's why we have such strange function name.
      while (this.pendingOperations.length > 0) {
        var op = this.pendingOperations.shift();
        op[0](op[1], op[2], op[3]);
      }
      this.pendingOperations = [];
    }
  }, {
    key: "callCompletedSignals",
    value: function callCompletedSignals() {
      // the while loop is better than for..in loop, because completedSignals
      // array might change dynamically when some completed signal handlers will
      // create objects dynamically via createQmlObject or Loader
      while (this.completedSignals.length > 0) {
        var handler = this.completedSignals.shift();
        handler();
      }
    }
  }]);

  return QMLEngine;
}();

QmlWeb.QMLEngine = QMLEngine;

function QMLInteger(val) {
  return val | 0;
}
QMLInteger.plainType = true;
QmlWeb.qmlInteger = QMLInteger;

function QMLList(meta) {
  var list = [];
  if (meta.object instanceof Array) {
    for (var i in meta.object) {
      list.push(QmlWeb.construct({
        object: meta.object[i],
        parent: meta.parent,
        context: meta.context
      }));
    }
  } else if (meta.object instanceof QmlWeb.QMLMetaElement) {
    list.push(QmlWeb.construct({
      object: meta.object,
      parent: meta.parent,
      context: meta.context
    }));
  }

  return list;
}
QMLList.plainType = true;
QmlWeb.qmlList = QMLList;

function QMLNumber(val) {
  return +val;
}
QMLNumber.plainType = true;
QmlWeb.qmlNumber = QMLNumber;

var QMLOperationState = {
  Idle: 1,
  Init: 2,
  Running: 3
};

QmlWeb.QMLOperationState = QMLOperationState;

var QMLProperty = function () {
  function QMLProperty(type, obj, name) {
    _classCallCheck(this, QMLProperty);

    this.obj = obj;
    this.name = name;
    this.changed = QmlWeb.Signal.signal([], { obj: obj });
    this.binding = null;
    this.objectScope = null;
    this.componentScope = null;
    this.value = undefined;
    this.type = type;
    this.animation = null;
    this.needsUpdate = true;

    // This list contains all signals that hold references to this object.
    // It is needed when deleting, as we need to tidy up all references to this
    // object.
    this.$tidyupList = [];
  }

  // Called by update and set to actually set this.val, performing any type
  // conversion required.


  _createClass(QMLProperty, [{
    key: "$setVal",
    value: function $setVal(val, componentScope) {
      var constructors = QmlWeb.constructors;
      if (constructors[this.type] === QmlWeb.qmlList) {
        this.val = QmlWeb.qmlList({
          object: val,
          parent: this.obj,
          context: componentScope
        });
      } else if (val instanceof QmlWeb.QMLMetaElement) {
        var _QMLComponent = QmlWeb.getConstructor("QtQml", "2.0", "Component");
        if (constructors[val.$class] === _QMLComponent || constructors[this.type] === _QMLComponent) {
          this.val = new _QMLComponent({
            object: val,
            parent: this.obj,
            context: componentScope
          });
          /* $basePath must be set here so that Components that are assigned to
           * properties (e.g. Repeater delegates) can properly resolve child
           * Components that live in the same directory in
           * Component.createObject. */
          this.val.$basePath = componentScope.$basePath;
        } else {
          this.val = QmlWeb.construct({
            object: val,
            parent: this.obj,
            context: componentScope
          });
        }
      } else if (val instanceof Object || val === undefined || val === null) {
        this.val = val;
      } else if (constructors[this.type].plainType) {
        this.val = constructors[this.type](val);
      } else {
        this.val = new constructors[this.type](val);
      }
    }

    // Updater recalculates the value of a property if one of the dependencies
    // changed

  }, {
    key: "update",
    value: function update() {
      this.needsUpdate = false;

      if (!this.binding) {
        return;
      }

      var oldVal = this.val;

      try {
        QMLProperty.pushEvaluatingProperty(this);
        if (!this.binding.compiled) {
          this.binding.compile();
        }
        this.$setVal(this.binding.eval(this.objectScope, this.componentScope, this.componentScopeBasePath), this.componentScope);
      } catch (e) {
        console.log("QMLProperty.update binding error:", e, Function.prototype.toString.call(this.binding.eval));
      } finally {
        QMLProperty.popEvaluatingProperty();
      }

      if (this.animation) {
        this.animation.$actions = [{
          target: this.animation.target || this.obj,
          property: this.animation.property || this.name,
          from: this.animation.from || oldVal,
          to: this.animation.to || this.val
        }];
        this.animation.restart();
      }

      if (this.val !== oldVal) {
        this.changed(this.val, oldVal, this.name);
      }
    }

    // Define getter

  }, {
    key: "get",
    value: function get() {
      //if (this.needsUpdate && !QMLProperty.evaluatingPropertyPaused) {
      if (this.needsUpdate && QmlWeb.engine.operationState !== QmlWeb.QMLOperationState.Init) {
        this.update();
      }

      // If this call to the getter is due to a property that is dependant on this
      // one, we need it to take track of changes
      if (QMLProperty.evaluatingProperty) {
        //console.log(this,QMLProperty.evaluatingPropertyStack.slice(0),this.val);
        this.changed.connect(QMLProperty.evaluatingProperty, QMLProperty.prototype.update, QmlWeb.Signal.UniqueConnection);
      }

      if (this.val && this.val.$get) {
        return this.val.$get();
      }

      return this.val;
    }
    // Define setter

  }, {
    key: "set",
    value: function set(newVal, reason, objectScope, componentScope) {
      var oldVal = this.val;

      var val = newVal;
      if (val instanceof QmlWeb.QMLBinding) {
        if (!objectScope || !componentScope) {
          throw new Error("Internal error: binding assigned without scope");
        }
        this.binding = val;
        this.objectScope = objectScope;
        this.componentScope = componentScope;
        this.componentScopeBasePath = componentScope.$basePath;

        if (QmlWeb.engine.operationState !== QmlWeb.QMLOperationState.Init) {
          if (!val.compiled) {
            val.compile();
          }
          try {
            QMLProperty.pushEvaluatingProperty(this);
            this.needsUpdate = false;
            val = this.binding.eval(objectScope, componentScope, this.componentScopeBasePath);
          } finally {
            QMLProperty.popEvaluatingProperty();
          }
        } else {
          QmlWeb.engine.bindedProperties.push(this);
          return;
        }
      } else {
        if (reason !== QMLProperty.ReasonAnimation) {
          this.binding = null;
        }
        if (val instanceof Array) {
          val = val.slice(); // Copies the array
        }
      }

      if (reason === QMLProperty.ReasonInit && typeof val === "undefined") {
        if (QMLProperty.typeInitialValues.hasOwnProperty(this.type)) {
          val = QMLProperty.typeInitialValues[this.type];
        }
      }

      this.$setVal(val, componentScope);

      if (this.val !== oldVal) {
        if (this.animation && reason === QMLProperty.ReasonUser) {
          this.animation.running = false;
          this.animation.$actions = [{
            target: this.animation.target || this.obj,
            property: this.animation.property || this.name,
            from: this.animation.from || oldVal,
            to: this.animation.to || this.val
          }];
          this.animation.running = true;
        }
        if (this.obj.$syncPropertyToRemote instanceof Function && reason === QMLProperty.ReasonUser) {
          // is a remote object from e.g. a QWebChannel
          this.obj.$syncPropertyToRemote(this.name, val);
        } else {
          this.changed(this.val, oldVal, this.name);
        }
      }
    }
  }], [{
    key: "pushEvalStack",
    value: function pushEvalStack() {
      QMLProperty.evaluatingPropertyStackOfStacks.push(QMLProperty.evaluatingPropertyStack);
      QMLProperty.evaluatingPropertyStack = [];
      QMLProperty.evaluatingProperty = undefined;
      //  console.log("evaluatingProperty=>undefined due to push stck ");
    }
  }, {
    key: "popEvalStack",
    value: function popEvalStack() {
      QMLProperty.evaluatingPropertyStack = QMLProperty.evaluatingPropertyStackOfStacks.pop() || [];
      QMLProperty.evaluatingProperty = QMLProperty.evaluatingPropertyStack[QMLProperty.evaluatingPropertyStack.length - 1];
    }
  }, {
    key: "pushEvaluatingProperty",
    value: function pushEvaluatingProperty(prop) {
      // TODO say warnings if already on stack. This means binding loop.
      // BTW actually we do not loop because needsUpdate flag is reset before
      // entering update again.
      if (QMLProperty.evaluatingPropertyStack.indexOf(prop) >= 0) {
        console.error("Property binding loop detected for property", prop.name, [prop].slice(0));
      }
      QMLProperty.evaluatingProperty = prop;
      QMLProperty.evaluatingPropertyStack.push(prop); //keep stack of props
    }
  }, {
    key: "popEvaluatingProperty",
    value: function popEvaluatingProperty() {
      QMLProperty.evaluatingPropertyStack.pop();
      QMLProperty.evaluatingProperty = QMLProperty.evaluatingPropertyStack[QMLProperty.evaluatingPropertyStack.length - 1];
    }
  }]);

  return QMLProperty;
}();

// Property that is currently beeing evaluated. Used to get the information
// which property called the getter of a certain other property for
// evaluation and is thus dependant on it.


QMLProperty.evaluatingProperty = undefined;
QMLProperty.evaluatingPropertyPaused = false;
QMLProperty.evaluatingPropertyStack = [];
QMLProperty.evaluatingPropertyStackOfStacks = [];

QMLProperty.typeInitialValues = {
  int: 0,
  real: 0,
  double: 0,
  string: "",
  bool: false,
  list: [],
  enum: 0,
  url: ""
};

QMLProperty.ReasonUser = 0;
QMLProperty.ReasonInit = 1;
QMLProperty.ReasonAnimation = 2;

QmlWeb.QMLProperty = QMLProperty;

function QMLString(val) {
  return "" + val;
}
QMLString.plainType = true;
QmlWeb.qmlString = QMLString;

function QMLUrl(val) {
  return QmlWeb.engine.$resolvePath("" + val);
}
QMLUrl.plainType = true;
QmlWeb.qmlUrl = QMLUrl;

function QMLVariant(val) {
  return val;
}
QMLVariant.plainType = true;
QmlWeb.qmlVariant = QMLVariant;

window.addEventListener("load", function () {
  var metaTags = document.getElementsByTagName("body");
  for (var i = 0; i < metaTags.length; ++i) {
    var metaTag = metaTags[i];
    var source = metaTag.getAttribute("data-qml");
    if (source) {
      QmlWeb.qmlEngine = new QmlWeb.QMLEngine();
      QmlWeb.qmlEngine.loadFile(source);
      QmlWeb.qmlEngine.start();
      break;
    }
  }
});

var Easing = {
  Linear: 1,
  InQuad: 2, OutQuad: 3, InOutQuad: 4, OutInQuad: 5,
  InCubic: 6, OutCubic: 7, InOutCubic: 8, OutInCubic: 9,
  InQuart: 10, OutQuart: 11, InOutQuart: 12, OutInQuart: 13,
  InQuint: 14, OutQuint: 15, InOutQuint: 16, OutInQuint: 17,
  InSine: 18, OutSine: 19, InOutSine: 20, OutInSine: 21,
  InExpo: 22, OutExpo: 23, InOutExpo: 24, OutInExpo: 25,
  InCirc: 26, OutCirc: 27, InOutCirc: 28, OutInCirc: 29,
  InElastic: 30, OutElastic: 31, InOutElastic: 32, OutInElastic: 33,
  InBack: 34, OutBack: 35, InOutBack: 36, OutInBack: 37,
  InBounce: 38, OutBounce: 39, InOutBounce: 40, OutInBounce: 41
};

// eslint-disable-next-line complexity
QmlWeb.$ease = function (type, period, amplitude, overshoot, t) {
  switch (type) {
    // Linear
    case Easing.Linear:
      return t;

    // Quad
    case Easing.InQuad:
      return Math.pow(t, 2);
    case Easing.OutQuad:
      return -Math.pow(t - 1, 2) + 1;
    case Easing.InOutQuad:
      if (t < 0.5) {
        return 2 * Math.pow(t, 2);
      }
      return -2 * Math.pow(t - 1, 2) + 1;
    case Easing.OutInQuad:
      if (t < 0.5) {
        return -2 * Math.pow(t - 0.5, 2) + 0.5;
      }
      return 2 * Math.pow(t - 0.5, 2) + 0.5;

    // Cubic
    case Easing.InCubic:
      return Math.pow(t, 3);
    case Easing.OutCubic:
      return Math.pow(t - 1, 3) + 1;
    case Easing.InOutCubic:
      if (t < 0.5) {
        return 4 * Math.pow(t, 3);
      }
      return 4 * Math.pow(t - 1, 3) + 1;
    case Easing.OutInCubic:
      return 4 * Math.pow(t - 0.5, 3) + 0.5;

    // Quart
    case Easing.InQuart:
      return Math.pow(t, 4);
    case Easing.OutQuart:
      return -Math.pow(t - 1, 4) + 1;
    case Easing.InOutQuart:
      if (t < 0.5) {
        return 8 * Math.pow(t, 4);
      }
      return -8 * Math.pow(t - 1, 4) + 1;
    case Easing.OutInQuart:
      if (t < 0.5) {
        return -8 * Math.pow(t - 0.5, 4) + 0.5;
      }
      return 8 * Math.pow(t - 0.5, 4) + 0.5;

    // Quint
    case Easing.InQuint:
      return Math.pow(t, 5);
    case Easing.OutQuint:
      return Math.pow(t - 1, 5) + 1;
    case Easing.InOutQuint:
      if (t < 0.5) {
        return 16 * Math.pow(t, 5);
      }
      return 16 * Math.pow(t - 1, 5) + 1;
    case Easing.OutInQuint:
      if (t < 0.5) {
        return 16 * Math.pow(t - 0.5, 5) + 0.5;
      }
      return 16 * Math.pow(t - 0.5, 5) + 0.5;

    // Sine
    case Easing.InSine:
      return -Math.cos(0.5 * Math.PI * t) + 1;
    case Easing.OutSine:
      return Math.sin(0.5 * Math.PI * t);
    case Easing.InOutSine:
      return -0.5 * Math.cos(Math.PI * t) + 0.5;
    case Easing.OutInSine:
      if (t < 0.5) {
        return 0.5 * Math.sin(Math.PI * t);
      }
      return -0.5 * Math.sin(Math.PI * t) + 1;

    // Expo
    case Easing.InExpo:
      return 1 / 1023 * (Math.pow(2, 10 * t) - 1);
    case Easing.OutExpo:
      return -1024 / 1023 * (Math.pow(2, -10 * t) - 1);
    case Easing.InOutExpo:
      if (t < 0.5) {
        return 1 / 62 * (Math.pow(2, 10 * t) - 1);
      }
      return -512 / 31 * Math.pow(2, -10 * t) + 63 / 62;
    case Easing.OutInExpo:
      if (t < 0.5) {
        return -16 / 31 * (Math.pow(2, -10 * t) - 1);
      }
      return 1 / 1984 * Math.pow(2, 10 * t) + 15 / 31;

    // Circ
    case Easing.InCirc:
      return 1 - Math.sqrt(1 - t * t);
    case Easing.OutCirc:
      return Math.sqrt(1 - Math.pow(t - 1, 2));
    case Easing.InOutCirc:
      if (t < 0.5) {
        return 0.5 * (1 - Math.sqrt(1 - 4 * t * t));
      }
      return 0.5 * (Math.sqrt(1 - 4 * Math.pow(t - 1, 2)) + 1);
    case Easing.OutInCirc:
      if (t < 0.5) {
        return 0.5 * Math.sqrt(1 - Math.pow(2 * t - 1, 2));
      }
      return 0.5 * (2 - Math.sqrt(1 - Math.pow(2 * t - 1, 2)));

    // Elastic
    case Easing.InElastic:
      return -amplitude * Math.pow(2, 10 * t - 10) * Math.sin(2 * t * Math.PI / period - Math.asin(1 / amplitude));
    case Easing.OutElastic:
      return amplitude * Math.pow(2, -10 * t) * Math.sin(2 * t * Math.PI / period - Math.asin(1 / amplitude)) + 1;
    case Easing.InOutElastic:
      if (t < 0.5) {
        return -0.5 * amplitude * Math.pow(2, 20 * t - 10) * Math.sin(4 * t * Math.PI / period - Math.asin(1 / amplitude));
      }
      return -0.5 * amplitude * Math.pow(2, -20 * t + 10) * Math.sin(4 * t * Math.PI / period + Math.asin(1 / amplitude)) + 1;
    case Easing.OutInElastic:
      if (t < 0.5) {
        return 0.5 * amplitude * Math.pow(2, -20 * t) * Math.sin(4 * t * Math.PI / period - Math.asin(1 / amplitude)) + 0.5;
      }
      return -0.5 * amplitude * Math.pow(2, 20 * t - 20) * Math.sin(4 * t * Math.PI / period - Math.asin(1 / amplitude)) + 0.5;

    // Back
    case Easing.InBack:
      return (overshoot + 1) * Math.pow(t, 3) - overshoot * Math.pow(t, 2);
    case Easing.OutBack:
      return (overshoot + 1) * Math.pow(t - 1, 3) + overshoot * Math.pow(t - 1, 2) + 1;
    case Easing.InOutBack:
      if (t < 0.5) {
        return 4 * (overshoot + 1) * Math.pow(t, 3) - 2 * overshoot * Math.pow(t, 2);
      }
      return 0.5 * (overshoot + 1) * Math.pow(2 * t - 2, 3) + overshoot / 2 * Math.pow(2 * t - 2, 2) + 1;
    case Easing.OutInBack:
      if (t < 0.5) {
        return 0.5 * ((overshoot + 1) * Math.pow(2 * t - 1, 3) + overshoot * Math.pow(2 * t - 1, 2) + 1);
      }
      return 4 * (overshoot + 1) * Math.pow(t - 0.5, 3) - 2 * overshoot * Math.pow(t - 0.5, 2) + 0.5;
    // Bounce
    case Easing.InBounce:
      if (t < 1 / 11) {
        return -amplitude * 121 / 16 * (t * t - 1 / 11 * t);
      } else if (t < 3 / 11) {
        return -amplitude * 121 / 16 * (t * t - 4 / 11 * t + 3 / 121);
      } else if (t < 7 / 11) {
        return -amplitude * 121 / 16 * (t * t - 10 / 11 * t + 21 / 121);
      }
      return -(121 / 16) * (t * t - 2 * t + 1) + 1;
    case Easing.OutBounce:
      if (t < 4 / 11) {
        return 121 / 16 * t * t;
      } else if (t < 8 / 11) {
        return amplitude * (121 / 16) * (t * t - 12 / 11 * t + 32 / 121) + 1;
      } else if (t < 10 / 11) {
        return amplitude * (121 / 16) * (t * t - 18 / 11 * t + 80 / 121) + 1;
      }
      return amplitude * (121 / 16) * (t * t - 21 / 11 * t + 10 / 11) + 1;
    case Easing.InOutBounce:
      if (t < 1 / 22) {
        return -amplitude * 121 / 8 * (t * t - 1 / 22 * t);
      } else if (t < 3 / 22) {
        return -amplitude * 121 / 8 * (t * t - 2 / 11 * t + 3 / 484);
      } else if (t < 7 / 22) {
        return -amplitude * 121 / 8 * (t * t - 5 / 11 * t + 21 / 484);
      } else if (t < 11 / 22) {
        return -121 / 8 * (t * t - t + 0.25) + 0.5;
      } else if (t < 15 / 22) {
        return 121 / 8 * (t * t - t) + 137 / 32;
      } else if (t < 19 / 22) {
        return amplitude * 121 / 8 * (t * t - 17 / 11 * t + 285 / 484) + 1;
      } else if (t < 21 / 22) {
        return amplitude * 121 / 8 * (t * t - 20 / 11 * t + 399 / 484) + 1;
      }
      return amplitude * 121 / 8 * (t * t - 43 / 22 * t + 21 / 22) + 1;
    case Easing.OutInBounce:
      if (t < 4 / 22) {
        return 121 / 8 * t * t;
      } else if (t < 8 / 22) {
        return -amplitude * 121 / 8 * (t * t - 6 / 11 * t + 8 / 121) + 0.5;
      } else if (t < 10 / 22) {
        return -amplitude * 121 / 8 * (t * t - 9 / 11 * t + 20 / 121) + 0.5;
      } else if (t < 11 / 22) {
        return -amplitude * 121 / 8 * (t * t - 21 / 22 * t + 5 / 22) + 0.5;
      } else if (t < 12 / 22) {
        return amplitude * 121 / 8 * (t * t - 23 / 22 * t + 3 / 11) + 0.5;
      } else if (t < 14 / 22) {
        return amplitude * 121 / 8 * (t * t - 13 / 11 * t + 42 / 121) + 0.5;
      } else if (t < 18 / 22) {
        return amplitude * 121 / 8 * (t * t - 16 / 11 * t + 63 / 121) + 0.5;
      }
      return -121 / 8 * (t * t - 2 * t + 117 / 121) + 0.5;

    // Default
    default:
      console.error("Unsupported animation type: ", type);
      return t;
  }
};

QmlWeb.Easing = Easing;

/* eslint accessor-pairs: 0 */

function setupGetter(obj, propName, func) {
  Object.defineProperty(obj, propName, {
    get: func,
    configurable: true,
    enumerable: true
  });
}

function setupSetter(obj, propName, func) {
  Object.defineProperty(obj, propName, {
    set: func,
    configurable: true,
    enumerable: false
  });
}

function setupGetterSetter(obj, propName, getter, setter) {
  Object.defineProperty(obj, propName, {
    get: getter,
    set: setter,
    configurable: true,
    enumerable: false
  });
}

QmlWeb.setupGetter = setupGetter;
QmlWeb.setupSetter = setupSetter;
QmlWeb.setupGetterSetter = setupGetterSetter;

var QmlWebHelpers = function () {
  function QmlWebHelpers() {
    _classCallCheck(this, QmlWebHelpers);
  }

  _createClass(QmlWebHelpers, null, [{
    key: "arrayFindIndex",
    value: function arrayFindIndex(array, callback) {
      // Note: does not support thisArg, we don't need that
      if (!Array.prototype.findIndex) {
        for (var key in array) {
          if (callback(array[key], key, array)) {
            return key;
          }
        }
        return -1;
      }
      return Array.prototype.findIndex.call(array, callback);
    }
  }, {
    key: "mergeObjects",
    value: function mergeObjects() {
      var merged = {};

      for (var _len6 = arguments.length, args = Array(_len6), _key6 = 0; _key6 < _len6; _key6++) {
        args[_key6] = arguments[_key6];
      }

      for (var i in args) {
        var arg = args[i];
        if (!arg) {
          continue;
        }
        for (var key in arg) {
          merged[key] = arg[key];
        }
      }
      return merged;
    }
  }]);

  return QmlWebHelpers;
}();

QmlWeb.helpers = QmlWebHelpers;

/* @license

MIT License

Copyright (c) 2011 Lauri Paimen <lauri@paimen.info>
Copyright (c) 2015 Pavel Vasev <pavel.vasev@gmail.com> - initial and working
                                                         import implementation.
Copyright (c) 2016 QmlWeb contributors

Permission is hereby granted, free of charge, to any person obtaining a copy of
this software and associated documentation files (the "Software"), to deal in
the Software without restriction, including without limitation the rights to
use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies of
the Software, and to permit persons to whom the Software is furnished to do so,
subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS
FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR
COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER
IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN
CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.
*/

/**
 * Get URL contents.
 * @param url {String} Url to fetch.
 * @param skipExceptions {bool} when turned on, ignore exeptions and return
 *        false. This feature is used by readQmlDir.
 * @private
 * @return {mixed} String of contents or false in errors.
 */
function getUrlContents(url, skipExceptions) {
  if (typeof QmlWeb.urlContentCache[url] === "undefined") {
    var xhr = new XMLHttpRequest();
    xhr.open("GET", url, false);

    if (skipExceptions) {
      try {
        xhr.send(null);
      } catch (e) {
        return false;
      }
      // it is OK to not have logging here, because DeveloperTools already will
      // have red log record
    } else {
      xhr.send(null);
    }

    if (xhr.status !== 200 && xhr.status !== 0) {
      // 0 if accessing with file://
      console.log("Retrieving " + url + " failed: " + xhr.responseText, xhr);
      return false;
    }
    QmlWeb.urlContentCache[url] = xhr.responseText;
  }
  return QmlWeb.urlContentCache[url];
}
if (typeof QmlWeb.urlContentCache === "undefined") {
  QmlWeb.urlContentCache = {};
}

/**
 * Read qmldir spec file at directory.
 * @param url Url of the directory
 * @return {Object} Object, where .internals lists qmldir internal references
 *                          and .externals lists qmldir external references.
 */

/*  Note on how importing works.

parseQML gives us `tree.$imports` variable, which contains information from
`import` statements.

After each call to parseQML, we call engine.loadImports(tree.$imports).
It in turn invokes readQmlDir() calls for each import, with respect to current
component base path and engine.importPathList().

We keep all component names from all qmldir files in global variable
`engine.qmldir`.

In construct() function, we use `engine.qmldir` for component url lookup.

Reference import info: http://doc.qt.io/qt-5/qtqml-syntax-imports.html
Also please look at notes and TODO's in qtcore.js::loadImports() and
qtcore.js::construct() methods.
*/

function readQmlDir(url) {
  // in case 'url' is empty, do not attach "/"
  // Q1: when this happen?
  var qmldirFileUrl = url.length > 0 ? url + "/qmldir" : "qmldir";

  var parsedUrl = QmlWeb.engine.$parseURI(qmldirFileUrl);

  var qmldir = void 0;
  if (parsedUrl.scheme === "qrc://") {
    qmldir = QmlWeb.qrc[parsedUrl.path];
  } else {
    qmldir = getUrlContents(qmldirFileUrl, true) || undefined;
  }

  var internals = {};
  var externals = {};

  if (qmldir === undefined) {
    return false;
  }

  // we have to check for "://"
  // In that case, item path is meant to be absolute, and we have no need to
  // prefix it with base url
  function makeurl(path) {
    if (path.indexOf("://") > 0) {
      return path;
    }
    return url + "/" + path;
  }

  var lines = qmldir.split(/\r?\n/);
  for (var i = 0; i < lines.length; i++) {
    // trim
    var line = lines[i].replace(/^\s+|\s+$/g, "");
    if (!line.length || line[0] === "#") {
      // Empty line or comment
      continue;
    }
    var match = line.split(/\s+/);
    if (match.length === 2 || match.length === 3) {
      if (match[0] === "plugin") {
        console.log(url + ": qmldir plugins are not supported!");
      } else if (match[0] === "internal") {
        internals[match[1]] = { url: makeurl(match[2]) };
      } else if (match.length === 2) {
        externals[match[0]] = { url: makeurl(match[1]) };
      } else {
        externals[match[0]] = { url: makeurl(match[2]), version: match[1] };
      }
    } else {
      console.log(url + ": unmatched: " + line);
    }
  }
  return { internals: internals, externals: externals };
}

QmlWeb.getUrlContents = getUrlContents;
QmlWeb.readQmlDir = readQmlDir;

function importJavascriptInContext(jsData, $context) {
  /* Remove any ".pragma" statements, as they are not valid JavaScript */
  var source = jsData.source.replace(/\.pragma.*(?:\r\n|\r|\n)/, "\n");
  // TODO: pass more objects to the scope?
  new Function("jsData", "$context", "\n    with(QmlWeb) with ($context) {\n      " + source + "\n    }\n    " + jsData.exports.map(function (sym) {
    return "$context." + sym + " = " + sym + ";";
  }).join("") + "\n  ")(jsData, $context);
}

QmlWeb.importJavascriptInContext = importJavascriptInContext;

QmlWeb.keyCodeToQt = function (e) {
  var Qt = QmlWeb.Qt;
  e.keypad = e.keyCode >= 96 && e.keyCode <= 111;
  if (e.keyCode === Qt.Key_Tab && e.shiftKey) {
    return Qt.Key_Backtab;
  }
  if (e.keyCode >= 97 && e.keyCode <= 122) {
    return e.keyCode - (97 - Qt.Key_A);
  }
  return e.keyCode;
};

QmlWeb.eventToKeyboard = function (e) {
  return {
    accepted: false,
    count: 1,
    isAutoRepeat: false,
    key: QmlWeb.keyCodeToQt(e),
    modifiers: e.ctrlKey * QmlWeb.Qt.CtrlModifier | e.altKey * QmlWeb.Qt.AltModifier | e.shiftKey * QmlWeb.Qt.ShiftModifier | e.metaKey * QmlWeb.Qt.MetaModifier | e.keypad * QmlWeb.Qt.KeypadModifier,
    text: String.fromCharCode(e.charCode)
  };
};

QmlWeb.keyboardSignals = {};
["asterisk", "back", "backtab", "call", "cancel", "delete", "escape", "flip", 0, 1, 2, 3, 4, 5, 6, 7, 8, 9, "hangup", "menu", "no", "return", "select", "space", "tab", "volumeDown", "volumeUp", "yes", "up", "right", "down", "left"].forEach(function (key) {
  var name = key.toString();
  var qtName = "Key_" + name[0].toUpperCase() + name.slice(1);
  var prefix = typeof key === "number" ? "digit" : "";
  QmlWeb.keyboardSignals[QmlWeb.Qt[qtName]] = "" + prefix + name + "Pressed";
});

QmlWeb.executionContext = null;

var modules = {
  Main: {
    int: QmlWeb.qmlInteger,
    real: QmlWeb.qmlNumber,
    double: QmlWeb.qmlNumber,
    string: QmlWeb.qmlString,
    bool: QmlWeb.qmlBoolean,
    list: QmlWeb.qmlList,
    color: QmlWeb.QColor,
    enum: QmlWeb.qmlNumber,
    url: QmlWeb.qmlUrl,
    variant: QmlWeb.qmlVariant,
    var: QmlWeb.qmlVariant
  }
};

// All object constructors
QmlWeb.constructors = modules.Main;

var dependants = {};

var perImportContextConstructors = {};
var importContextIds = 0;

// Helper. Adds a type to the constructor list
function registerGlobalQmlType(name, type) {
  QmlWeb[type.name] = type;
  QmlWeb.constructors[name] = type;
  modules.Main[name] = type;
}

// Helper. Register a type to a module
function registerQmlType(options, constructor) {
  if (constructor !== undefined) {
    options.constructor = constructor;
  }

  if (typeof options.baseClass === "string") {
    var _ret = function () {
      // TODO: Does not support version specification (yet?)
      var baseModule = void 0;
      var baseName = void 0;
      var dot = options.baseClass.lastIndexOf(".");
      if (dot === -1) {
        baseModule = options.module;
        baseName = options.baseClass;
      } else {
        baseModule = options.baseClass.substring(0, dot);
        baseName = options.baseClass.substring(dot + 1);
      }
      var found = (modules[baseModule] || []).filter(function (descr) {
        return descr.name === baseName;
      });
      if (found.length > 0) {
        // Ok, we found our base class
        options.baseClass = found[0].constructor;
      } else {
        // Base class not found, delay the loading
        var baseId = [baseModule, baseName].join(".");
        if (!dependants.hasOwnProperty(baseId)) {
          dependants[baseId] = [];
        }
        dependants[baseId].push(options);
        return {
          v: void 0
        };
      }
    }();

    if ((typeof _ret === "undefined" ? "undefined" : _typeof(_ret)) === "object") return _ret.v;
  }

  var descriptor = typeof options === "function" ? {
    module: options.module,
    name: options.element,
    versions: options.versions,
    baseClass: options.baseClass,
    enums: options.enums,
    signals: options.signals,
    defaultProperty: options.defaultProperty,
    properties: options.properties,
    constructor: options
  } : options;

  descriptor.constructor.$qmlTypeInfo = {
    enums: descriptor.enums,
    signals: descriptor.signals,
    defaultProperty: descriptor.defaultProperty,
    properties: descriptor.properties
  };

  if (descriptor.global) {
    registerGlobalQmlType(descriptor.name, descriptor.constructor);
  }

  var moduleDescriptor = {
    name: descriptor.name,
    versions: descriptor.versions,
    constructor: descriptor.constructor
  };

  if (typeof modules[descriptor.module] === "undefined") {
    modules[descriptor.module] = [];
  }
  modules[descriptor.module].push(moduleDescriptor);

  if (typeof descriptor.baseClass !== "undefined") {
    inherit(descriptor.constructor, descriptor.baseClass);
  }

  var id = [descriptor.module, descriptor.name].join(".");
  if (dependants.hasOwnProperty(id)) {
    dependants[id].forEach(function (opt) {
      return registerQmlType(opt);
    });
    dependants[id].length = 0;
  }
}

function getConstructor(moduleName, version, name) {
  if (typeof modules[moduleName] !== "undefined") {
    for (var i = 0; i < modules[moduleName].length; ++i) {
      var type = modules[moduleName][i];
      if (type.name === name && type.versions.test(version)) {
        return type.constructor;
      }
    }
  }
  return null;
}

function getModuleConstructors(moduleName, version) {
  var constructors = {};
  if (typeof modules[moduleName] === "undefined") {
    console.warn("module \"" + moduleName + "\" not found");
    return constructors;
  }
  for (var i = 0; i < modules[moduleName].length; ++i) {
    var module = modules[moduleName][i];
    if (module.versions.test(version)) {
      constructors[module.name] = module.constructor;
    }
  }
  return constructors;
}

function loadImports(self, imports) {
  var mergeObjects = QmlWeb.helpers.mergeObjects;
  var constructors = mergeObjects(modules.Main);
  if (imports.filter(function (row) {
    return row[1] === "QtQml";
  }).length === 0 && imports.filter(function (row) {
    return row[1] === "QtQuick";
  }).length === 1) {
    imports.push(["qmlimport", "QtQml", 2, "", true]);
  }
  for (var i = 0; i < imports.length; ++i) {
    var _imports$i = _slicedToArray(imports[i], 4),
        moduleName = _imports$i[1],
        moduleVersion = _imports$i[2],
        moduleAlias = _imports$i[3];

    var moduleConstructors = getModuleConstructors(moduleName, moduleVersion);

    if (moduleAlias !== "") {
      constructors[moduleAlias] = mergeObjects(constructors[moduleAlias], moduleConstructors);
    } else {
      constructors = mergeObjects(constructors, moduleConstructors);
    }
  }
  self.importContextId = importContextIds++;
  perImportContextConstructors[self.importContextId] = constructors;
  QmlWeb.constructors = constructors; // TODO: why do we need this?
}

function inherit(constructor, baseClass) {
  var oldProto = constructor.prototype;
  constructor.prototype = Object.create(baseClass.prototype);
  Object.getOwnPropertyNames(oldProto).forEach(function (prop) {
    constructor.prototype[prop] = oldProto[prop];
  });
  constructor.prototype.constructor = baseClass;
}

function callSuper(self, meta) {
  var info = meta.super.$qmlTypeInfo || {};
  meta.super = meta.super.prototype.constructor;
  meta.super.call(self, meta);

  if (info.enums) {
    // TODO: not exported to the whole file scope yet
    Object.keys(info.enums).forEach(function (name) {
      self[name] = info.enums[name];

      if (!global[name]) {
        global[name] = self[name]; // HACK
      }
    });
  }
  if (info.properties) {
    Object.keys(info.properties).forEach(function (name) {
      var desc = info.properties[name];
      if (typeof desc === "string") {
        desc = { type: desc };
      }
      QmlWeb.createProperty(desc.type, self, name, desc);
    });
  }
  if (info.signals) {
    Object.keys(info.signals).forEach(function (name) {
      var params = info.signals[name];
      self[name] = QmlWeb.Signal.signal(params);
    });
  }
  if (info.defaultProperty) {
    self.$defaultProperty = info.defaultProperty;
  }
}

/**
 * QML Object constructor.
 * @param {Object} meta Meta information about the object and the creation
 *                      context
 * @return {Object} New qml object
 */
function construct(meta) {
  var item = void 0;

  var constructors = perImportContextConstructors[meta.context.importContextId];

  var classComponents = meta.object.$class.split(".");
  for (var ci = 0; ci < classComponents.length; ++ci) {
    var c = classComponents[ci];
    constructors = constructors[c];
    if (constructors === undefined) {
      break;
    }
  }

  if (constructors !== undefined) {
    var _constructor = constructors;
    meta.super = _constructor;
    item = new _constructor(meta);
    meta.super = undefined;
  } else {
    // Load component from file. Please look at import.js for main notes.
    // Actually, we have to use that order:
    // 1) try to load component from current basePath
    // 2) from importPathList
    // 3) from directories in imports statements and then
    // 4) from qmldir files
    // Currently we support only 1,2 and 4 and use order: 4,1,2
    // TODO: engine.qmldirs is global for all loaded components.
    //       That's not qml's original behaviour.
    var qdirInfo = QmlWeb.engine.qmldirs[meta.object.$class];
    // Are we have info on that component in some imported qmldir files?

    /* This will also be set in applyProperties, but needs to be set here
     * for Qt.createComponent to have the correct context. */
    QmlWeb.executionContext = meta.context;

    var filePath = void 0;
    if (qdirInfo) {
      filePath = qdirInfo.url;
    } else if (classComponents.length === 2) {
      var qualified = QmlWeb.engine.qualifiedImportPath(meta.context.importContextId, classComponents[0]);
      filePath = "" + qualified + classComponents[1] + ".qml";
    } else {
      filePath = classComponents[0] + ".qml";
    }

    var component = QmlWeb.Qt.createComponent(filePath);

    if (!component) {
      throw new Error("No constructor found for " + meta.object.$class);
    }

    item = component.$createObject(meta.parent);
    if (typeof item.dom !== "undefined") {
      item.dom.className += " " + classComponents[classComponents.length - 1];
      if (meta.object.id) {
        item.dom.className += "  " + meta.object.id;
      }
    }
    // Handle default properties
  }

  // id
  if (meta.object.id) {
    QmlWeb.setupGetterSetter(meta.context, meta.object.id, function () {
      return item;
    }, function () {});
  }

  // keep path in item for probale use it later in Qt.resolvedUrl
  item.$context.$basePath = QmlWeb.engine.$basePath; //gut

  // We want to use the item's scope, but this Component's imports
  item.$context.importContextId = meta.context.importContextId;

  // Apply properties (Bindings won't get evaluated, yet)
  QmlWeb.applyProperties(meta.object, item, item, item.$context);

  return item;
}

QmlWeb.modules = modules;
QmlWeb.registerGlobalQmlType = registerGlobalQmlType;
QmlWeb.registerQmlType = registerQmlType;
QmlWeb.getConstructor = getConstructor;
QmlWeb.loadImports = loadImports;
QmlWeb.callSuper = callSuper;
QmlWeb.construct = construct;

/**
 * Create property getters and setters for object.
 * @param {Object} obj Object for which gsetters will be set
 * @param {String} propName Property name
 * @param {Object} [options] Options that allow finetuning of the property
 */
function createProperty(type, obj, propName) {
  var options = arguments.length > 3 && arguments[3] !== undefined ? arguments[3] : {};

  var QMLProperty = QmlWeb.QMLProperty;
  var prop = new QMLProperty(type, obj, propName);
  obj[propName + "Changed"] = prop.changed;
  obj.$properties[propName] = prop;
  obj.$properties[propName].set(options.initialValue, QMLProperty.ReasonInit);

  var getter = function getter() {
    return obj.$properties[propName].get();
  };
  var setter = void 0;
  if (options.readOnly) {
    setter = function setter(newVal) {
      if (!obj.$canEditReadOnlyProperties) {
        throw new Error("property '" + propName + "' has read only access");
      }
      obj.$properties[propName].set(newVal, QMLProperty.ReasonUser);
    };
  } else {
    setter = function setter(newVal) {
      obj.$properties[propName].set(newVal, QMLProperty.ReasonUser);
    };
  }
  QmlWeb.setupGetterSetter(obj, propName, getter, setter);
  if (obj.$isComponentRoot) {
    QmlWeb.setupGetterSetter(obj.$context, propName, getter, setter);
  }
}

/**
 * Apply properties from metaObject to item.
 * @param {Object} metaObject Source of properties
 * @param {Object} item Target of property apply
 * @param {Object} objectScope Scope in which properties should be evaluated
 * @param {Object} componentScope Component scope in which properties should be
 *                 evaluated
 */
function applyProperties(metaObject, item, objectScopeIn, componentScope) {
  var QMLProperty = QmlWeb.QMLProperty;
  var objectScope = objectScopeIn || item;
  QmlWeb.executionContext = componentScope;

  if (metaObject.$children && metaObject.$children.length !== 0) {
    if (item.$defaultProperty) {
      item.$properties[item.$defaultProperty].set(metaObject.$children, QMLProperty.ReasonInit, objectScope, componentScope);
    } else {
      throw new Error("Cannot assign to unexistant default property");
    }
  }
  // We purposefully set the default property AFTER using it, in order to only
  // have it applied for instanciations of this component, but not for its
  // internal children
  if (metaObject.$defaultProperty) {
    item.$defaultProperty = metaObject.$defaultProperty;
  }

  for (var i in metaObject) {
    var value = metaObject[i];
    if (i === "id" || i === "$class") {
      // keep them
      item[i] = value;
      continue;
    }

    // skip global id's and internal values
    if (i === "id" || i[0] === "$") {
      // TODO: what? See above.
      continue;
    }

    // slots
    if (i.indexOf("on") === 0 && i.length > 2 && /[A-Z]/.test(i[2])) {
      var signalName = i[2].toLowerCase() + i.slice(3);
      if (connectSignal(item, signalName, value, objectScope, componentScope)) {
        continue;
      }
      if (item.$setCustomSlot) {
        item.$setCustomSlot(signalName, value, objectScope, componentScope);
        continue;
      }
    }

    if (value instanceof Object) {
      if (applyProperty(item, i, value, objectScope, componentScope)) {
        continue;
      }
    }

    if (item.$properties && i in item.$properties) {
      item.$properties[i].set(value, QMLProperty.ReasonInit, objectScope, componentScope);
    } else if (i in item) {
      item[i] = value;
    } else if (item.$setCustomData) {
      item.$setCustomData(i, value);
    } else {
      console.warn("Cannot assign to non-existent property \"" + i + "\". Ignoring assignment.");
    }
  }
}

function applyProperty(item, i, value, objectScope, componentScope) {
  var QMLProperty = QmlWeb.QMLProperty;

  if (value instanceof QmlWeb.QMLSignalDefinition) {
    item[i] = QmlWeb.Signal.signal(value.parameters);
    if (item.$isComponentRoot) {
      componentScope[i] = item[i];
    }
    return true;
  }

  if (value instanceof QmlWeb.QMLMethod) {
    value.compile();
    item[i] = value.eval(objectScope, componentScope, componentScope.$basePath);
    if (item.$isComponentRoot) {
      componentScope[i] = item[i];
    }
    return true;
  }

  if (value instanceof QmlWeb.QMLAliasDefinition) {
    // TODO
    // 1. Alias must be able to point to prop or id of local object,
    //    eg: property alias q: t
    // 2. Alias may have same name as id it points to: property alias
    //    someid: someid
    // 3. Alias proxy (or property proxy) to proxy prop access to selected
    //    incapsulated object. (think twice).
    createProperty("alias", item, i);
    item.$properties[i].componentScope = componentScope;
    item.$properties[i].componentScopeBasePath = componentScope.$basePath;
    item.$properties[i].val = value;
    item.$properties[i].get = function () {
      var obj = this.componentScope[this.val.objectName];
      var propertyName = this.val.propertyName;
      return propertyName ? obj.$properties[propertyName].get() : obj;
    };
    item.$properties[i].set = function (newVal, reason, _objectScope, _componentScope) {
      if (!this.val.propertyName) {
        throw new Error("Cannot set alias property pointing to an QML object.");
      }
      var obj = this.componentScope[this.val.objectName];
      var prop = obj.$properties[this.val.propertyName];
      prop.set(newVal, reason, _objectScope, _componentScope);
    };

    if (value.propertyName) {
      var con = function con(prop) {
        var obj = prop.componentScope[prop.val.objectName];
        if (!obj) {
          console.error("qtcore: target object ", prop.val.objectName, " not found for alias ", prop);
        } else {
          (function () {
            var targetProp = obj.$properties[prop.val.propertyName];
            if (!targetProp) {
              console.error("qtcore: target property [", prop.val.objectName, "].", prop.val.propertyName, " not found for alias ", prop.name);
            } else {
              (function () {
                // targetProp.changed.connect( prop.changed );
                // it is not sufficient to connect to `changed` of source property
                // we have to propagate own changed to it too
                // seems the best way to do this is to make them identical?..
                // prop.changed = targetProp.changed;
                // obj[`${i}Changed`] = prop.changed;
                // no. because those object might be destroyed later.
                var loopWatchdog = false;
                targetProp.changed.connect(item, function () {
                  for (var _len7 = arguments.length, args = Array(_len7), _key7 = 0; _key7 < _len7; _key7++) {
                    args[_key7] = arguments[_key7];
                  }

                  if (loopWatchdog) return;
                  loopWatchdog = true;
                  prop.changed.apply(item, args);
                  loopWatchdog = false;
                });
                prop.changed.connect(obj, function () {
                  for (var _len8 = arguments.length, args = Array(_len8), _key8 = 0; _key8 < _len8; _key8++) {
                    args[_key8] = arguments[_key8];
                  }

                  if (loopWatchdog) return;
                  loopWatchdog = true;
                  targetProp.changed.apply(obj, args);
                  loopWatchdog = false;
                });
              })();
            }
          })();
        }
      };
      QmlWeb.engine.pendingOperations.push([con, item.$properties[i]]);
    }
    return true;
  }

  if (value instanceof QmlWeb.QMLPropertyDefinition) {
    createProperty(value.type, item, i);
    item.$properties[i].set(value.value, QMLProperty.ReasonInit, objectScope, componentScope);
    return true;
  }

  if (item[i] && value instanceof QmlWeb.QMLMetaPropertyGroup) {
    // Apply properties one by one, otherwise apply at once
    applyProperties(value, item[i], objectScope, componentScope);
    return true;
  }

  return false;
}

function connectSignal(item, signalName, value, objectScope, componentScope) {
  if (!item[signalName]) {
    console.warn("No signal called " + signalName + " found!");
    return undefined;
  } else if (typeof item[signalName].connect !== "function") {
    console.warn(signalName + " is not a signal!");
    return undefined;
  }

  if (!value.compiled) {
    var params = [];
    for (var j in item[signalName].parameters) {
      params.push(item[signalName].parameters[j].name);
    }
    // Wrap value.src in IIFE in case it includes a "return"
    value.src = "(\n      function(" + params.join(", ") + ") {\n        QmlWeb.executionContext = __executionContext;\n        QmlWeb.engine.$oldBasePath = QmlWeb.engine.$basePath;\n        QmlWeb.engine.$basePath = \"" + componentScope.$basePath + "\";\n        try {\n          (function() {\n            " + value.src + "\n          })();\n        } finally {\n          QmlWeb.engine.$basePath = QmlWeb.engine.$oldBasePath;\n        }\n      }\n    )";
    value.isFunction = false;
    value.compile();
  }
  // Don't pass in __basePath argument, as QMLEngine.$basePath is set in the
  // value.src, as we need it set at the time the slot is called.
  var slot = value.eval(objectScope, componentScope);
  item[signalName].connect(item, slot);
  return slot;
}

QmlWeb.createProperty = createProperty;
QmlWeb.applyProperties = applyProperties;
QmlWeb.connectSignal = connectSignal;

/* @license

MIT License

Copyright (c) 2011 Lauri Paimen <lauri@paimen.info>
Copyright (c) 2013 Anton Kreuzkamp <akreuzkamp@web.de>
Copyright (c) 2016 QmlWeb contributors

Permission is hereby granted, free of charge, to any person obtaining a copy of
this software and associated documentation files (the "Software"), to deal in
the Software without restriction, including without limitation the rights to
use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies of
the Software, and to permit persons to whom the Software is furnished to do so,
subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS
FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR
COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER
IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN
CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.
*/

var QMLMethod = function (_QmlWeb$QMLBinding) {
  _inherits(QMLMethod, _QmlWeb$QMLBinding);

  function QMLMethod() {
    _classCallCheck(this, QMLMethod);

    return _possibleConstructorReturn(this, (QMLMethod.__proto__ || Object.getPrototypeOf(QMLMethod)).apply(this, arguments));
  }

  return QMLMethod;
}(QmlWeb.QMLBinding);

/**
 * Create an object representing a QML property definition.
 * @param {String} type The type of the property
 * @param {Array} value The default value of the property
 * @return {Object} Object representing the defintion
 */


var QMLPropertyDefinition = function QMLPropertyDefinition(type, value) {
  _classCallCheck(this, QMLPropertyDefinition);

  this.type = type;
  this.value = value;
};

var QMLAliasDefinition = function QMLAliasDefinition(objName, propName) {
  _classCallCheck(this, QMLAliasDefinition);

  this.objectName = objName;
  this.propertyName = propName;
};

/**
 * Create an object representing a QML signal definition.
 * @param {Array} params The parameters the signal ships
 * @return {Object} Object representing the defintion
 */


var QMLSignalDefinition = function QMLSignalDefinition(params) {
  _classCallCheck(this, QMLSignalDefinition);

  this.parameters = params;
};

/**
 * Create an object representing a group of QML properties (like anchors).
 * @return {Object} Object representing the group
 */


var QMLMetaPropertyGroup = function QMLMetaPropertyGroup() {
  _classCallCheck(this, QMLMetaPropertyGroup);
};

/**
 * Create an object representing a QML element.
 * @param {String} type Type of the element
 * @param {String} onProp Name of the property specified with the "on" keyword
 */


var QMLMetaElement = function QMLMetaElement(type, onProp) {
  _classCallCheck(this, QMLMetaElement);

  this.$class = type;
  this.$children = [];
  this.$on = onProp;
};

// Convert parser tree to the format understood by engine


function convertToEngine(tree) {
  return convertToEngine.walk(tree);
}

function stringifyDots(elem) {
  var sub = elem;
  var path = [];
  while (sub[0] === "dot") {
    path.push(sub[1]);
    sub = sub[2];
  }
  path.push(sub);
  return path.join(".");
}

function applyProp(item, name, val) {
  var curr = item; // output structure
  var sub = name; // input structure
  while (sub[0] === "dot") {
    if (!curr[sub[1]]) {
      curr[sub[1]] = new QMLMetaPropertyGroup();
    }
    curr = curr[sub[1]];
    sub = sub[2];
  }
  curr[sub] = val;
}

convertToEngine.walkers = {
  toplevel: function toplevel(imports, statement) {
    var item = { $class: "Component" };
    item.$imports = imports;
    item.$children = [convertToEngine.walk(statement)];
    return item;
  },
  qmlelem: function qmlelem(elem, onProp, statements) {
    var item = new QMLMetaElement(stringifyDots(elem), onProp);

    for (var i in statements) {
      var statement = statements[i];
      var name = statement[1];
      var val = convertToEngine.walk(statement);
      switch (statement[0]) {
        case "qmldefaultprop":
          item.$defaultProperty = name;
          item[name] = val;
          break;
        case "qmlprop":
        case "qmlpropdef":
        case "qmlaliasdef":
        case "qmlmethod":
        case "qmlsignaldef":
          applyProp(item, name, val);
          break;
        case "qmlelem":
          item.$children.push(val);
          break;
        case "qmlobjdef":
          throw new Error("qmlobjdef support was removed, update qmlweb-parser to ^0.3.0.");
        case "qmlobj":
          // Create object to item
          item[name] = item[name] || new QMLMetaPropertyGroup();
          for (var j in val) {
            item[name][j] = val[j];
          }
          break;
        default:
          console.log("Unknown statement", statement);
      }
    }
    // Make $children be either a single item or an array, if it's more than one
    if (item.$children.length === 1) {
      item.$children = item.$children[0];
    }

    return item;
  },
  qmlprop: function qmlprop(name, tree, src) {
    if (name === "id") {
      // id property
      return tree[1][1];
    }
    return convertToEngine.bindout(tree, src);
  },
  qmlobjdef: function qmlobjdef(name, property, tree, src) {
    return convertToEngine.bindout(tree, src);
  },
  qmlobj: function qmlobj(elem, statements) {
    var item = {};
    for (var i in statements) {
      var statement = statements[i];
      var name = statement[1];
      var val = convertToEngine.walk(statement);
      if (statement[0] === "qmlprop") {
        applyProp(item, name, val);
      }
    }
    return item;
  },
  qmlmethod: function qmlmethod(name, tree, src) {
    return new QMLMethod(src);
  },
  qmlpropdef: function qmlpropdef(name, type, tree, src) {
    return new QMLPropertyDefinition(type, tree ? convertToEngine.bindout(tree, src) : undefined);
  },
  qmlaliasdef: function qmlaliasdef(name, objName, propName) {
    return new QMLAliasDefinition(objName, propName);
  },
  qmlsignaldef: function qmlsignaldef(name, params) {
    return new QMLSignalDefinition(params);
  },
  qmldefaultprop: function qmldefaultprop(tree) {
    return convertToEngine.walk(tree);
  },
  name: function name(src) {
    if (src === "true" || src === "false") {
      return src === "true";
    } else if (typeof src === "boolean") {
      // TODO: is this needed? kept for compat with ==
      return src;
    }
    return new QmlWeb.QMLBinding(src, ["name", src]);
  },
  num: function num(src) {
    return +src;
  },
  string: function string(src) {
    return String(src);
  },
  array: function array(tree, src) {
    var a = [];
    var isList = false;
    var hasBinding = false;
    for (var i in tree) {
      var val = convertToEngine.bindout(tree[i]);
      a.push(val);

      if (val instanceof QMLMetaElement) {
        isList = true;
      } else if (val instanceof QmlWeb.QMLBinding) {
        hasBinding = true;
      }
    }

    if (hasBinding) {
      if (isList) {
        throw new TypeError("An array may either contain bindings or Element definitions.");
      }
      return new QmlWeb.QMLBinding(src, tree);
    }

    return a;
  }
};

convertToEngine.walk = function (tree) {
  var type = tree[0];
  var walker = convertToEngine.walkers[type];
  if (!walker) {
    console.log("No walker for " + type);
    return undefined;
  }
  return walker.apply(type, tree.slice(1));
};

// Try to bind out tree and return static variable instead of binding
convertToEngine.bindout = function (statement, binding) {
  // We want to process the content of the statement
  // (but still handle the case, we get the content directly)
  var tree = statement[0] === "stat" ? statement[1] : statement;

  var type = tree[0];
  var walker = convertToEngine.walkers[type];
  if (walker) {
    return walker.apply(type, tree.slice(1));
  }
  return new QmlWeb.QMLBinding(binding, tree);
};

// Help logger
convertToEngine.amIn = function (str, tree) {
  console.log(str);
  if (tree) console.log(JSON.stringify(tree, null, "  "));
};

function loadParser() {
  if (typeof QmlWeb.parse !== "undefined") {
    return;
  }

  console.log("Loading parser...");
  var tags = document.getElementsByTagName("script");
  for (var i in tags) {
    if (tags[i].src && tags[i].src.indexOf("/qt.") !== -1) {
      var src = tags[i].src.replace("/qt.", "/qmlweb.parser.");
      // TODO: rewrite to async loading
      var xhr = new XMLHttpRequest();
      xhr.open("GET", src, false);
      xhr.send(null);
      if (xhr.status !== 200 && xhr.status !== 0) {
        // xhr.status === 0 if accessing with file://
        throw new Error("Could not load QmlWeb parser!");
      }
      new Function(xhr.responseText)();
      QmlWeb.parse = QmlWeb.parse;
      QmlWeb.jsparse = QmlWeb.jsparse;
      return;
    }
  }
}

// Function to parse qml and output tree expected by engine
function parseQML(src, file) {
  loadParser();
  QmlWeb.parse.nowParsingFile = file;
  var parsetree = QmlWeb.parse(src, QmlWeb.parse.QmlDocument);
  return convertToEngine(parsetree);
}

QmlWeb.QMLMethod = QMLMethod;
QmlWeb.QMLPropertyDefinition = QMLPropertyDefinition;
QmlWeb.QMLAliasDefinition = QMLAliasDefinition;
QmlWeb.QMLSignalDefinition = QMLSignalDefinition;
QmlWeb.QMLMetaPropertyGroup = QMLMetaPropertyGroup;
QmlWeb.QMLMetaElement = QMLMetaElement;
QmlWeb.convertToEngine = convertToEngine;
QmlWeb.loadParser = loadParser;
QmlWeb.parseQML = parseQML;

/*

QmlWeb.qrc is analogous to the Qt Resource System. It is expected to map a path
within the resource system to the following pieces of data:

1) For a QML Component, it is the return value of QmlWeb.parse
2) For a JavaScript file, it is the return value of QmlWeb.jsparse
2) For an image, it is any URL that an <img> tag can accept (e.g. a standard
   URL to an image resource, or a "data:" URI). If there is no entry for a
   given qrc image path, it will fall back to passing the path right through to
   the DOM. This is mainly a convenience until support for images is added to
   gulp-qmlweb.

The "data-qml" tag on <body> can be set to a "qrc://" URL like
"qrc:///root.qml" to use a pre-parsed "/root.qml" from QmlWeb.qrc.

Since relative URLs are resolved relative to the URL of the containing
component, any relative URL set within a file in the resource system will also
resolve within the resource system. To access a Component, JavaScript or image
file that is stored outside of the resources system from within the resource
system, a full URL must be used (e.g. "http://www.example.com/images/foo.png").

Vice-versa, in order to access a Component, JavaScript or image file that is
stored within the resource system from outside of the resource system, a full
"qrc://" URL must be used (e.g. "qrc:///images/foo.png").

More details here: http://doc.qt.io/qt-5/qml-url.html

*/
QmlWeb.qrc = {};

QmlWeb.registerQmlType({
  module: "QmlWeb.Dom",
  name: "DomElement",
  versions: /.*/,
  baseClass: "QtQuick.Item",
  properties: {
    tagName: { type: "string", initialValue: "div" }
  }
}, function () {
  function _class(meta) {
    _classCallCheck(this, _class);

    QmlWeb.callSuper(this, meta);

    var tagName = meta.object.tagName || "div";
    this.dom = document.createElement(tagName);

    // TODO: support properties, styles, perhaps changing the tagName
  }

  return _class;
}());

QmlWeb.registerQmlType({
  module: "QmlWeb",
  name: "RestModel",
  versions: /.*/,
  baseClass: "QtQuick.Item",
  properties: {
    url: "string",
    isLoading: "bool",
    mimeType: { type: "string", initialValue: "application/json" },
    queryMimeType: {
      type: "string",
      initialValue: "application/x-www-urlencoded"
    }
  },
  signals: {
    fetched: [],
    saved: []
  }
}, function () {
  function _class2(meta) {
    _classCallCheck(this, _class2);

    QmlWeb.callSuper(this, meta);

    this.attributes = this.getAttributes();
    this.runningRequests = 0;
  }

  _createClass(_class2, [{
    key: "fetch",
    value: function fetch() {
      var _this5 = this;

      this.$ajax({
        method: "GET",
        mimeType: this.mimetype,
        success: function success(xhr) {
          _this5.$xhrReadResponse(xhr);
          _this5.fetched();
        }
      });
    }
  }, {
    key: "remove",
    value: function remove() {
      var _this6 = this;

      this.$ajax({
        method: "DELETE",
        success: function success() {
          _this6.destroy();
        }
      });
    }
  }, {
    key: "create",
    value: function create() {
      this.$sendToServer("POST");
    }
  }, {
    key: "save",
    value: function save() {
      this.$sendToServer("PUT");
    }
  }, {
    key: "$sendToServer",
    value: function $sendToServer(method) {
      var _this7 = this;

      this.$ajax({
        method: method,
        mimeType: this.queryMimeType,
        body: this.$generateBodyForPostQuery(),
        success: function success(xhr) {
          _this7.$xhrReadResponse(xhr);
          _this7.saved();
        }
      });
    }
  }, {
    key: "$generateBodyForPostQuery",
    value: function $generateBodyForPostQuery() {
      var object = {};
      for (var i = 0; i < this.attributes.length; ++i) {
        object[this.attributes[i]] = this.$properties[this.attributes[i]].get();
      }
      console.log(object);
      switch (this.queryMimeType) {
        case "application/json":
        case "text/json":
          return JSON.stringify(object);
        case "application/x-www-urlencoded":
          return this.$objectToUrlEncoded(object);
      }
      return undefined;
    }
  }, {
    key: "$objectToUrlEncoded",
    value: function $objectToUrlEncoded(object, prefix) {
      var parts = [];
      for (var key in object) {
        if (object.hasOwnProperty(key)) {
          var value = object[key];
          if (typeof prefix !== "undefined") {
            key = prefix + "[" + key + "]";
          }
          if ((typeof value === "undefined" ? "undefined" : _typeof(value)) === "object") {
            parts.push(this.$objectToUrlEncoded(value, key));
          } else {
            var ekey = this.$myEncodeURIComponent(key);
            var evalue = this.$myEncodeURIComponent(value);
            parts.push(ekey + "=" + evalue);
          }
        }
      }
      return parts.join("&");
    }
  }, {
    key: "$myEncodeURIComponent",
    value: function $myEncodeURIComponent(str) {
      return encodeURIComponent(str).replace(/[!'()*]/g, function (c) {
        return "%" + c.charCodeAt(0).toString(16);
      });
    }
  }, {
    key: "$ajax",
    value: function $ajax(options) {
      var _this8 = this;

      var xhr = new XMLHttpRequest();
      xhr.overrideMimeType(this.mimeType);
      xhr.onreadystatechange = function () {
        if (xhr.readyState === XMLHttpRequest.DONE) {
          if (xhr.status === 200) {
            options.success(xhr);
          } else {
            options.failure(xhr);
          }
          _this8.runningRequests -= 1;
          if (_this8.runningRequests <= 0) {
            _this8.isLoading = false;
          }
        }
      };
      xhr.open(options.method, this.url, true);
      if (typeof options.body !== "undefined") {
        xhr.setRequestHeader("Content-Type", this.queryMimeType);
        xhr.send(options.body);
      } else {
        xhr.send(null);
      }
      this.runningRequests += 1;
      this.isLoading = true;
    }
  }, {
    key: "$xhrReadResponse",
    value: function $xhrReadResponse(xhr) {
      var responseObject = void 0;
      if (this.mimeType === "application/json" || this.mimeType === "text/json") {
        responseObject = JSON.parse(xhr.responseText);
      }
      this.$updatePropertiesFromResponseObject(responseObject);
    }
  }, {
    key: "$updatePropertiesFromResponseObject",
    value: function $updatePropertiesFromResponseObject(responseObject) {
      var QMLProperty = QmlWeb.QMLProperty;
      for (var key in responseObject) {
        if (responseObject.hasOwnProperty(key) && this.$hasProperty(key)) {
          this.$properties[key].set(responseObject[key], QMLProperty.ReasonUser);
        }
      }
    }
  }, {
    key: "$hasProperty",
    value: function $hasProperty(name) {
      return typeof this.$properties[name] !== "undefined";
    }
  }]);

  return _class2;
}());

QmlWeb.registerQmlType({
  module: "Qt.labs.settings",
  name: "Settings",
  versions: /.*/,
  baseClass: "QtQuick.Item",
  properties: {
    category: "string"
  }
}, function () {
  function _class3(meta) {
    _classCallCheck(this, _class3);

    QmlWeb.callSuper(this, meta);

    if (typeof window.localStorage === "undefined") {
      return;
    }

    this.Component.completed.connect(this, this.Component$onCompleted);
  }

  _createClass(_class3, [{
    key: "Component$onCompleted",
    value: function Component$onCompleted() {
      this.$loadProperties();
      this.$initializeProperties();
    }
  }, {
    key: "$getKey",
    value: function $getKey(attrName) {
      return this.category + "/" + attrName;
    }
  }, {
    key: "$loadProperties",
    value: function $loadProperties() {
      var _this9 = this;

      this.$attributes.forEach(function (attrName) {
        if (!_this9.$properties[attrName]) return;

        var key = _this9.$getKey(attrName);
        _this9[attrName] = localStorage.getItem(key);
      });
    }
  }, {
    key: "$initializeProperties",
    value: function $initializeProperties() {
      var _this10 = this;

      this.$attributes.forEach(function (attrName) {
        if (!_this10.$properties[attrName]) return;

        var emitter = _this10;
        var signalName = attrName + "Changed";

        if (_this10.$properties[attrName].type === "alias") {
          emitter = _this10.$context[_this10.$properties[attrName].val.objectName];
          signalName = _this10.$properties[attrName].val.propertyName + "Changed";
        }

        emitter[signalName].connect(_this10, function () {
          localStorage.setItem(_this10.$getKey(attrName), _this10[attrName]);
        });
      });
    }
  }]);

  return _class3;
}());

QmlWeb.registerQmlType({
  module: "QtGraphicalEffects",
  name: "FastBlur",
  versions: /.*/,
  baseClass: "QtQuick.Item",
  properties: {
    radius: "real",
    source: { type: "var", initialValue: null }
  }
}, function () {
  function _class4(meta) {
    _classCallCheck(this, _class4);

    QmlWeb.callSuper(this, meta);

    this.$previousSource = null;
    this.$filterObject = undefined;

    this.radiusChanged.connect(this, this.$onRadiusChanged);
    this.sourceChanged.connect(this, this.$onSourceChanged);
  }

  _createClass(_class4, [{
    key: "$onRadiusChanged",
    value: function $onRadiusChanged() {
      this.$updateEffect(this.source);
    }
  }, {
    key: "$onSourceChanged",
    value: function $onSourceChanged() {
      this.$updateEffect(this.source);
    }
  }, {
    key: "$updateFilterObject",
    value: function $updateFilterObject() {
      this.$filterObject = {
        transformType: "filter",
        operation: "blur",
        parameters: this.radius + "px"
      };
    }
  }, {
    key: "$updateEffect",
    value: function $updateEffect(source) {
      console.log("updating effect");
      if (this.$previousSource) {
        var index = this.$previousSource.transform.indexOf(this.$filterObject);
        this.$previousSource.transform.splice(index, 1);
        this.$previousSource.$updateTransform();
      }
      if (source && source.transform) {
        this.$updateFilterObject();
        console.log("updating effect:", this.$filterObject, source);
        source.transform.push(this.$filterObject);
        source.$updateTransform();
        this.$previousSource = source;
      } else {
        this.$previousSource = null;
      }
    }
  }]);

  return _class4;
}());

QmlWeb.registerQmlType({
  module: "QtMobility",
  name: "GeoLocation",
  versions: /.*/,
  baseClass: "QtQuick.Item",
  properties: {
    accuracy: "double",
    altitude: "double",
    altitudeAccuracy: "double",
    heading: "double",
    latitude: "double",
    longitude: "double",
    speed: "double",
    timestamp: "date",
    label: "string"
  }
}, function () {
  function _class5(meta) {
    var _this11 = this;

    _classCallCheck(this, _class5);

    QmlWeb.callSuper(this, meta);

    if (!navigator.geolocation) {
      return;
    }

    navigator.geolocation.getCurrentPosition(function (pos) {
      return _this11.$updatePosition(pos);
    });
    navigator.geolocation.watchPosition(function (pos) {
      return _this11.$updatePosition(pos);
    });
  }

  _createClass(_class5, [{
    key: "$updatePosition",
    value: function $updatePosition(position) {
      this.accuracy = position.coords.accuracy;
      this.altitude = position.coords.altitude;
      this.altitudeAccuracy = position.coords.altitudeAccuracy;
      this.heading = position.coords.heading;
      this.latitude = position.coords.latitude;
      this.longitude = position.coords.longitude;
      this.speed = position.coords.speed;
      this.timestamp = position.timestamp;
    }
  }]);

  return _class5;
}());

QmlWeb.registerQmlType({
  module: "QtMultimedia",
  name: "Video",
  versions: /^5\./,
  baseClass: "QtQuick.Item",
  enums: {
    MediaPlayer: {
      NoError: 0, ResourceError: 1, FormatError: 2, NetworkError: 4,
      AccessDenied: 8, ServiceMissing: 16,

      StoppedState: 0, PlayingState: 1, PausedState: 2,

      NoMedia: 0, Loading: 1, Loaded: 2, Buffering: 4, Stalled: 8,
      EndOfMedia: 16, InvalidMedia: 32, UnknownStatus: 64
    },
    VideoOutput: { PreserveAspectFit: 0, PreserveAspectCrop: 1, Stretch: 2 }
  },
  properties: {
    source: "string",
    duration: "int",
    position: "int",
    autoPlay: "bool",
    muted: "bool",
    volume: "real",
    playbackRate: "real",
    playbackState: "enum", // MediaPlayer.StoppedState
    fillMode: "enum", // VideoOutput.PreserveAspectFit
    status: "enum", // MediaPlayer.NoMedia
    error: "enum" // MediaPlayer.NoError
  },
  signals: {
    paused: [],
    playing: [],
    stopped: []
  }
}, function () {
  function _class6(meta) {
    var _this12 = this;

    _classCallCheck(this, _class6);

    QmlWeb.callSuper(this, meta);

    this.$runningEventListener = 0;

    this.impl = document.createElement("video");
    this.impl.style.width = this.impl.style.height = "100%";
    this.impl.style.margin = "0";
    this.dom.appendChild(this.impl);

    this.volume = this.impl.volume;
    this.duration = this.impl.duration;

    this.impl.addEventListener("play", function () {
      _this12.playing();
      _this12.playbackState = _this12.MediaPlayer.PlayingState;
    });

    this.impl.addEventListener("pause", function () {
      _this12.paused();
      _this12.playbackState = _this12.MediaPlayer.PausedState;
    });

    this.impl.addEventListener("timeupdate", function () {
      _this12.$runningEventListener++;
      _this12.position = _this12.impl.currentTime * 1000;
      _this12.$runningEventListener--;
    });

    this.impl.addEventListener("ended", function () {
      _this12.stopped();
      _this12.playbackState = _this12.MediaPlayer.StoppedState;
    });

    this.impl.addEventListener("progress", function () {
      if (_this12.impl.buffered.length > 0) {
        _this12.progress = _this12.impl.buffered.end(0) / _this12.impl.duration;
        _this12.status = _this12.progress < 1 ? _this12.MediaPlayer.Buffering : _this12.MediaPlayer.Buffered;
      }
    });

    this.impl.addEventListener("stalled", function () {
      _this12.status = _this12.MediaPlayer.Stalled;
    });

    this.impl.addEventListener("canplaythrough", function () {
      _this12.status = _this12.MediaPlayer.Buffered;
    });

    this.impl.addEventListener("loadstart", function () {
      _this12.status = _this12.MediaPlayer.Loading;
    });

    this.impl.addEventListener("durationchanged", function () {
      _this12.duration = _this12.impl.duration;
    });

    this.impl.addEventListener("volumechanged", function () {
      _this12.$runningEventListener++;
      _this12.volume = _this12.impl.volume;
      _this12.$runningEventListener--;
    });

    this.impl.addEventListener("suspend", function () {
      _this12.error |= _this12.MediaPlayer.NetworkError;
    });

    this.impl.addEventListener("error", function () {
      _this12.error |= _this12.MediaPlayer.ResourceError;
    });

    this.impl.addEventListener("ratechange", function () {
      _this12.$runningEventListener++;
      _this12.playbackRate = _this12.impl.playbackRate;
      _this12.$runningEventListener--;
    });

    this.autoPlayChanged.connect(this, this.$onAutoPlayChanged);
    this.sourceChanged.connect(this, this.$onSourceChanged);
    this.positionChanged.connect(this, this.$onPositionChanged);
    this.volumeChanged.connect(this, this.$onVolumeChanged);
    this.playbackRateChanged.connect(this, this.$onPlaybackRateChanged);
    this.mutedChanged.connect(this, this.$onMutedChanged);
    this.fillModeChanged.connect(this, this.$onFillModeChanged);
  }

  _createClass(_class6, [{
    key: "$onAutoPlayChanged",
    value: function $onAutoPlayChanged(newVal) {
      this.impl.autoplay = newVal;
    }
  }, {
    key: "$onSourceChanged",
    value: function $onSourceChanged(source) {
      var parts = source.split(".");
      var extension = parts[parts.length - 1].toLowerCase();
      var mime = this.mimetypeFromExtension(extension);
      this.impl.src = source;
      if (!this.impl.canPlayType(mime)) {
        this.error |= this.MediaPlayer.FormatError;
      }
    }
  }, {
    key: "$onPositionChanged",
    value: function $onPositionChanged(currentTime) {
      if (this.$runningEventListener > 0) return;
      this.impl.currentTime = currentTime / 1000;
    }
  }, {
    key: "$onVolumeChanged",
    value: function $onVolumeChanged(volume) {
      if (this.$runningEventListener > 0) return;
      this.impl.volume = volume;
    }
  }, {
    key: "$onPlaybackRateChanged",
    value: function $onPlaybackRateChanged(playbackRate) {
      if (this.$runningEventListener > 0) return;
      this.impl.playbackRate = playbackRate;
    }
  }, {
    key: "$onMutedChanged",
    value: function $onMutedChanged(newValue) {
      if (newValue) {
        this.$volulmeBackup = this.impl.volume;
        this.volume = 0;
      } else {
        this.volume = this.$volumeBackup;
      }
    }
  }, {
    key: "$onFillModeChanged",
    value: function $onFillModeChanged(newValue) {
      switch (newValue) {
        case this.VideoOutput.Stretch:
          this.impl.style.objectFit = "fill";
          break;
        case this.VideoOutput.PreserveAspectFit:
          this.impl.style.objectFit = "";
          break;
        case this.VideoOutput.PreserveAspectCrop:
          this.impl.style.objectFit = "cover";
          break;
      }
    }
  }, {
    key: "pause",
    value: function pause() {
      this.impl.pause();
    }
  }, {
    key: "play",
    value: function play() {
      this.impl.play();
    }
  }, {
    key: "seek",
    value: function seek(offset) {
      this.impl.currentTime = offset * 1000;
    }
  }, {
    key: "stop",
    value: function stop() {}
  }, {
    key: "mimetypeFromExtension",
    value: function mimetypeFromExtension(extension) {
      var mimetypes = {
        ogg: "video/ogg",
        ogv: "video/ogg",
        ogm: "video/ogg",
        mp4: "video/mp4",
        webm: "video/webm"
      };
      return mimetypes[extension] || "";
    }
  }]);

  return _class6;
}());

QmlWeb.registerQmlType({
  module: "QtQml",
  name: "Binding",
  versions: /.*/,
  baseClass: "QtQml.QtObject",
  properties: {
    target: { type: "QtObject", initialValue: null },
    property: { type: "string", initialValue: "" },
    value: { type: "var", initialValue: undefined },
    when: { type: "bool", initialValue: true }
  }
}, function () {
  function _class7(meta) {
    _classCallCheck(this, _class7);

    QmlWeb.callSuper(this, meta);

    this.$property = undefined;

    this.valueChanged.connect(this, this.$onValueChanged);
    this.targetChanged.connect(this, this.$updateBinding);
    this.propertyChanged.connect(this, this.$updateBinding);
    this.whenChanged.connect(this, this.$updateBinding);
  }

  _createClass(_class7, [{
    key: "$updateBinding",
    value: function $updateBinding() {
      if (!this.when || !this.target || !this.target.hasOwnProperty(this.property) || this.value === undefined) {
        this.$property = undefined;
        return;
      }
      this.$property = this.target.$properties[this.property];
      this.$onValueChanged(this.value); // trigger value update
    }
  }, {
    key: "$onValueChanged",
    value: function $onValueChanged(value) {
      if (value !== undefined && this.$property) {
        this.$property.set(value);
      }
    }
  }]);

  return _class7;
}());

var QMLContext = function () {
  function QMLContext() {
    _classCallCheck(this, QMLContext);
  }

  _createClass(QMLContext, [{
    key: "nameForObject",
    value: function nameForObject(obj) {
      for (var name in this) {
        if (this[name] === obj) {
          return name;
        }
      }
      return undefined;
    }
  }]);

  return QMLContext;
}();

var QMLComponent = function () {
  function QMLComponent(meta) {
    var _this13 = this;

    _classCallCheck(this, QMLComponent);

    if (QmlWeb.constructors[meta.object.$class] === QMLComponent) {
      this.$metaObject = meta.object.$children[0];
    } else {
      this.$metaObject = meta.object;
    }
    this.$context = meta.context;

    this.$jsImports = [];

    if (meta.object.$imports instanceof Array) {
      (function () {
        var moduleImports = [];
        var loadImport = function loadImport(importDesc) {
          if (/\.js$/.test(importDesc[1])) {
            _this13.$jsImports.push(importDesc);
          } else {
            moduleImports.push(importDesc);
          }
        };

        for (var i = 0; i < meta.object.$imports.length; ++i) {
          loadImport(meta.object.$imports[i]);
        }
        QmlWeb.loadImports(_this13, moduleImports);
        if (_this13.$context) {
          _this13.finalizeImports(_this13.$context);
        }
      })();
    }

    /* If this Component does not have any imports, it is likely one that was
     * created within another Component file. It should inherit the
     * importContextId of the Component file it was created within. */
    if (this.importContextId === undefined) {
      this.importContextId = meta.context.importContextId;
    }
  }

  _createClass(QMLComponent, [{
    key: "finalizeImports",
    value: function finalizeImports($context) {
      var engine = QmlWeb.engine;
      for (var i = 0; i < this.$jsImports.length; ++i) {
        var importDesc = this.$jsImports[i];
        var js = engine.loadJS(engine.$resolvePath(importDesc[1]));

        if (!js) {
          console.log("Component.finalizeImports: failed to import JavaScript", importDesc[1]);
          continue;
        }

        if (importDesc[3] !== "") {
          $context[importDesc[3]] = {};
          QmlWeb.importJavascriptInContext(js, $context[importDesc[3]]);
        } else {
          QmlWeb.importJavascriptInContext(js, $context);
        }
      }
    }
  }, {
    key: "$createObject",
    value: function $createObject(parent) {
      var properties = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : {};
      var context = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : this.$context;

      var engine = QmlWeb.engine;
      var oldState = engine.operationState;
      engine.operationState = QmlWeb.QMLOperationState.Init;
      // change base path to current component base path
      var bp = engine.$basePath;
      engine.$basePath = this.$basePath ? this.$basePath : engine.$basePath;

      var newContext = context ? Object.create(context) : new QMLContext();

      if (this.importContextId !== undefined) {
        newContext.importContextId = this.importContextId;
      }

      var item = QmlWeb.construct({
        object: this.$metaObject,
        parent: parent,
        context: newContext,
        isComponentRoot: true
      });

      Object.keys(properties).forEach(function (propname) {
        item[propname] = properties.propname;
      });

      // change base path back
      // TODO looks a bit hacky
      engine.$basePath = bp;

      engine.operationState = oldState;
      return item;
    }
  }, {
    key: "createObject",
    value: function createObject(parent) {
      var properties = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : {};

      var item = this.$createObject(parent, properties);
      var QMLItem = QmlWeb.getConstructor("QtQuick", "2.0", "Item");

      if (item instanceof QMLItem) {
        item.$properties.parent.set(parent, QmlWeb.QMLProperty.ReasonInit);
      }

      return item;
    }
  }], [{
    key: "getAttachedObject",
    value: function getAttachedObject() {
      if (!this.$Component) {
        this.$Component = new QmlWeb.QObject(this);
        this.$Component.completed = QmlWeb.Signal.signal([]);
        QmlWeb.engine.completedSignals.push(this.$Component.completed);

        this.$Component.destruction = QmlWeb.Signal.signal([]);
      }
      return this.$Component;
    }
  }]);

  return QMLComponent;
}();

QmlWeb.registerQmlType({
  global: true,
  module: "QtQml",
  name: "Component",
  versions: /.*/,
  baseClass: "QtObject",
  constructor: QMLComponent
});

QmlWeb.registerQmlType({
  module: "QtQml",
  name: "Connections",
  versions: /.*/,
  baseClass: "QtObject",
  properties: {
    target: "QtObject",
    ignoreUnknownSignals: "bool"
  }
}, function () {
  function _class8(meta) {
    _classCallCheck(this, _class8);

    QmlWeb.callSuper(this, meta);
    this.target = this.$parent;
    this.$connections = {};

    this.$old_target = this.target;
    this.targetChanged.connect(this, this.$onTargetChanged);
    this.Component.completed.connect(this, this.Component$onCompleted);
  }

  _createClass(_class8, [{
    key: "$onTargetChanged",
    value: function $onTargetChanged() {
      this.$reconnectTarget();
    }
  }, {
    key: "Component$onCompleted",
    value: function Component$onCompleted() {
      this.$reconnectTarget();
    }
  }, {
    key: "$reconnectTarget",
    value: function $reconnectTarget() {
      var old_target = this.$old_target;
      for (var i in this.$connections) {
        var c = this.$connections[i];
        if (c._currentConnection && old_target && old_target[i] && typeof old_target[i].disconnect === "function") {
          old_target[i].disconnect(c._currentConnection);
        }
        if (this.target) {
          c._currentConnection = QmlWeb.connectSignal(this.target, i, c.value, c.objectScope, c.componentScope);
        }
      }
      this.$old_target = this.target;
    }
  }, {
    key: "$setCustomSlot",
    value: function $setCustomSlot(propName, value, objectScope, componentScope) {
      this.$connections[propName] = { value: value, objectScope: objectScope, componentScope: componentScope };
    }
  }]);

  return _class8;
}());

// Base object for all qml elements

QmlWeb.registerQmlType({
  module: "QtQml",
  name: "QtObject",
  versions: /.*/
}, function (_QmlWeb$QObject2) {
  _inherits(_class9, _QmlWeb$QObject2);

  function _class9(meta) {
    _classCallCheck(this, _class9);

    var _this14 = _possibleConstructorReturn(this, (_class9.__proto__ || Object.getPrototypeOf(_class9)).call(this, meta.parent));

    _this14.$isComponentRoot = meta.isComponentRoot;
    _this14.$context = meta.context;

    // Component get own properties
    _this14.$attributes = [];
    for (var key in meta.object) {
      if (!meta.object.hasOwnProperty(key) || !meta.object[key]) {
        continue;
      }
      var name = meta.object[key].__proto__.constructor.name;
      if (name === "QMLPropertyDefinition" || name === "QMLAliasDefinition") {
        _this14.$attributes.push(key);
      }
    }

    var Signal = QmlWeb.Signal;

    _this14.Keys = new QmlWeb.QObject(_this14);
    _this14.Keys.asteriskPresed = Signal.signal();
    _this14.Keys.backPressed = Signal.signal();
    _this14.Keys.backtabPressed = Signal.signal();
    _this14.Keys.callPressed = Signal.signal();
    _this14.Keys.cancelPressed = Signal.signal();
    _this14.Keys.deletePressed = Signal.signal();
    for (var i = 0; i < 10; ++i) {
      _this14.Keys["digit" + i + "Pressed"] = Signal.signal();
    }
    _this14.Keys.escapePressed = Signal.signal();
    _this14.Keys.flipPressed = Signal.signal();
    _this14.Keys.hangupPressed = Signal.signal();
    _this14.Keys.leftPressed = Signal.signal();
    _this14.Keys.menuPressed = Signal.signal();
    _this14.Keys.noPressed = Signal.signal();
    _this14.Keys.pressed = Signal.signal();
    _this14.Keys.released = Signal.signal();
    _this14.Keys.returnPressed = Signal.signal();
    _this14.Keys.rightPressed = Signal.signal();
    _this14.Keys.selectPressed = Signal.signal();
    _this14.Keys.spacePressed = Signal.signal();
    _this14.Keys.tabPressed = Signal.signal();
    _this14.Keys.upPressed = Signal.signal();
    _this14.Keys.volumeDownPressed = Signal.signal();
    _this14.Keys.volumeUpPressed = Signal.signal();
    _this14.Keys.yesPressed = Signal.signal();
    return _this14;
  }

  _createClass(_class9, [{
    key: "getAttributes",
    value: function getAttributes() {
      return this.$attributes;
    }
  }]);

  return _class9;
}(QmlWeb.QObject));

QmlWeb.registerQmlType({
  module: "QtQml",
  name: "Timer",
  versions: /.*/,
  baseClass: "QtObject",
  properties: {
    interval: { type: "int", initialValue: 1000 },
    parent: { type: "QtObject", readOnly: true },
    repeat: "bool",
    running: "bool",
    triggeredOnStart: "bool"
  },
  signals: {
    triggered: []
  }
}, function () {
  function _class10(meta) {
    var _this15 = this;

    _classCallCheck(this, _class10);

    QmlWeb.callSuper(this, meta);

    this.$properties.parent.set(this.$parent, QmlWeb.QMLProperty.ReasonInit);

    /* This ensures that if the user toggles the "running" property manually,
     * the timer will trigger. */
    this.runningChanged.connect(this, this.$onRunningChanged);

    QmlWeb.engine.$addTicker(function () {
      return _this15.$ticker.apply(_this15, arguments);
    });

    QmlWeb.engine.$registerStart(function () {
      if (_this15.running) {
        _this15.restart();
      }
    });

    QmlWeb.engine.$registerStop(function () {
      return _this15.stop();
    });
  }

  _createClass(_class10, [{
    key: "start",
    value: function start() {
      this.running = true;
    }
  }, {
    key: "stop",
    value: function stop() {
      this.running = false;
    }
  }, {
    key: "restart",
    value: function restart() {
      this.stop();
      this.start();
    }
  }, {
    key: "$ticker",
    value: function $ticker(now) {
      if (!this.running) return;
      if (now - this.$prevTrigger >= this.interval) {
        this.$prevTrigger = now;
        this.$trigger();
      }
    }
  }, {
    key: "$onRunningChanged",
    value: function $onRunningChanged() {
      if (this.running) {
        this.$prevTrigger = Date.now();
        if (this.triggeredOnStart) {
          this.$trigger();
        }
      }
    }
  }, {
    key: "$trigger",
    value: function $trigger() {
      if (!this.repeat) {
        // We set the value directly in order to be able to emit the
        // runningChanged signal after triggered, like Qt does it.
        this.$properties.running.val = false;
      }

      // Trigger this.
      this.triggered();

      if (!this.repeat) {
        // Emit changed signal manually after setting the value manually above.
        this.runningChanged();
      }
    }
  }]);

  return _class10;
}());

QmlWeb.registerQmlType({
  module: "QtQuick.Controls",
  name: "Button",
  versions: /.*/,
  baseClass: "QtQuick.Item",
  properties: {
    text: "string",
    enabled: { type: "bool", initialValue: true }
  },
  signals: {
    clicked: []
  }
}, function () {
  function _class11(meta) {
    var _this16 = this;

    _classCallCheck(this, _class11);

    QmlWeb.callSuper(this, meta);

    this.Component.completed.connect(this, this.Component$onCompleted);
    this.textChanged.connect(this, this.$onTextChanged);
    this.enabledChanged.connect(this, this.$onEnabledChanged);

    var button = this.impl = document.createElement("button");
    button.style.pointerEvents = "auto";
    this.dom.appendChild(button);

    button.onclick = function () {
      _this16.clicked();
    };
  }

  _createClass(_class11, [{
    key: "Component$onCompleted",
    value: function Component$onCompleted() {
      this.implicitWidth = this.impl.offsetWidth;
      this.implicitHeight = this.impl.offsetHeight;
    }
  }, {
    key: "$onTextChanged",
    value: function $onTextChanged(newVal) {
      this.impl.textContent = newVal;
      //TODO: Replace those statically sized borders
      this.implicitWidth = this.impl.offsetWidth;
      this.implicitHeight = this.impl.offsetHeight;
    }
  }, {
    key: "$onEnabledChanged",
    value: function $onEnabledChanged(newVal) {
      this.impl.disabled = !newVal;
    }
  }]);

  return _class11;
}());

QmlWeb.registerQmlType({
  module: "QtQuick.Controls",
  name: "CheckBox",
  versions: /.*/,
  baseClass: "QtQuick.Item",
  properties: {
    text: "string",
    checked: "bool",
    color: "color"
  }
}, function () {
  function _class12(meta) {
    var _this17 = this;

    _classCallCheck(this, _class12);

    QmlWeb.callSuper(this, meta);

    this.impl = document.createElement("label");
    this.impl.style.pointerEvents = "auto";

    var checkbox = document.createElement("input");
    checkbox.type = "checkbox";
    checkbox.style.verticalAlign = "text-bottom";
    checkbox.addEventListener("change", function () {
      _this17.checked = checkbox.checked;
    });
    this.impl.appendChild(checkbox);

    var span = document.createElement("span");
    this.impl.appendChild(span);

    this.dom.appendChild(this.impl);

    var QMLFont = QmlWeb.getConstructor("QtQuick", "2.0", "Font");
    this.font = new QMLFont(this);

    this.Component.completed.connect(this, this.Component$onCompleted);
    this.textChanged.connect(this, this.$onTextChanged);
    this.colorChanged.connect(this, this.$onColorChanged);
    this.checkedChanged.connect(this, this.$onCheckedChanged);
  }

  _createClass(_class12, [{
    key: "$onTextChanged",
    value: function $onTextChanged(newVal) {
      this.impl.children[1].innerHTML = newVal;
      this.implicitHeight = this.impl.offsetHeight;
      this.implicitWidth = this.impl.offsetWidth > 0 ? this.impl.offsetWidth + 4 : 0;
    }
  }, {
    key: "$onColorChanged",
    value: function $onColorChanged(newVal) {
      this.impl.children[1].style.color = new QmlWeb.QColor(newVal);
    }
  }, {
    key: "$onCheckedChanged",
    value: function $onCheckedChanged() {
      this.impl.children[0].checked = this.checked;
    }
  }, {
    key: "Component$onCompleted",
    value: function Component$onCompleted() {
      this.implicitHeight = this.impl.offsetHeight;
      this.implicitWidth = this.impl.offsetWidth > 0 ? this.impl.offsetWidth + 4 : 0;
    }
  }]);

  return _class12;
}());

QmlWeb.registerQmlType({
  module: "QtQuick.Controls",
  name: "ComboBox",
  versions: /.*/,
  baseClass: "QtQuick.Item",
  properties: {
    count: "int",
    currentIndex: "int",
    currentText: "string",
    menu: { type: "array", initialValue: [] },
    model: { type: "array", initialValue: [] },
    pressed: "bool"
  },
  signals: {
    accepted: [],
    activated: [{ type: "int", name: "index" }]
  }
}, function () {
  function _class13(meta) {
    var _this18 = this;

    _classCallCheck(this, _class13);

    QmlWeb.callSuper(this, meta);

    this.dom.style.pointerEvents = "auto";
    this.name = "QMLComboBox";

    this.Component.completed.connect(this, this.Component$onCompleted);
    this.modelChanged.connect(this, this.$onModelChanged);

    this.dom.onclick = function () {
      var index = _this18.dom.firstChild.selectedIndex;
      _this18.currentIndex = index;
      _this18.currentText = _this18.model[index];
      _this18.accepted();
      _this18.activated(index);
    };
  }

  _createClass(_class13, [{
    key: "find",
    value: function find(text) {
      return this.model.indexOf(text);
    }
  }, {
    key: "selectAll",
    value: function selectAll() {
      // TODO
    }
  }, {
    key: "textAt",
    value: function textAt(index) {
      return this.model[index];
    }
  }, {
    key: "$updateImpl",
    value: function $updateImpl() {
      this.currentIndex = 0;
      this.count = this.model.length;
      var entries = [];
      for (var i = 0; i < this.count; i++) {
        var elt = this.model[i];
        //if (elt instanceof Array) { // TODO - optgroups? update model !
        //    var count_i = elt.length;
        //    for (var j = 0; j < count_i; j++)
        //        html += "<option>" + elt[j] + "</option>";
        //}
        //else
        entries.push("<option>" + elt + "</option>");
      }
      // TODO: remove innerHTML, port to DOM
      this.dom.innerHTML = "<select>" + entries.join("") + "</select>";
      this.impl = this.dom.firstChild;
    }
  }, {
    key: "Component$onCompleted",
    value: function Component$onCompleted() {
      this.$updateImpl();
      this.implicitWidth = this.impl.offsetWidth;
      this.implicitHeight = this.impl.offsetHeight;
    }
  }, {
    key: "$onModelChanged",
    value: function $onModelChanged() {
      this.$updateImpl();
    }
  }]);

  return _class13;
}());

QmlWeb.registerQmlType({
  module: "QtQuick.Controls",
  name: "ScrollView",
  versions: /.*/,
  baseClass: "QtQuick.Item",
  properties: {
    contentItem: "Item",
    flickableItem: "Item", // TODO  0) implement it  1) make it read-only
    viewport: "Item", // TODO
    frameVisible: "bool",
    highlightOnFocus: "bool", // TODO test
    verticalScrollBarPolicy: "enum",
    horizontalScrollBarPolicy: "enum",
    style: "Component" // TODO
  },
  defaultProperty: "contentItem"
}, function () {
  function _class14(meta) {
    _classCallCheck(this, _class14);

    QmlWeb.callSuper(this, meta);

    this.css.pointerEvents = "auto";
    this.setupFocusOnDom(this.dom);

    this.contentItemChanged.connect(this, this.$onContentItemChanged);
    this.flickableItemChanged.connect(this, this.$onFlickableItemChanged);
    this.viewportChanged.connect(this, this.$onViewportChanged);
    this.frameVisibleChanged.connect(this, this.$onFrameVisibleChanged);
    this.highlightOnFocusChanged.connect(this, this.$onHighlightOnFocusChanged);
    this.horizontalScrollBarPolicyChanged.connect(this, this.$onHorizontalScrollBarPolicyChanged);
    this.verticalScrollBarPolicyChanged.connect(this, this.$onVerticalScrollBarPolicyChanged);
    this.styleChanged.connect(this, this.$onStyleChanged);
    this.childrenChanged.connect(this, this.$onChildrenChanged);
    this.focusChanged.connect(this, this.$onFocusChanged);

    this.width = this.implicitWidth = 240; // default QML ScrollView width
    this.height = this.implicitHeight = 150; // default QML ScrollView height
    this.width = this.implicitWidth;
    this.height = this.implicitHeight;

    var Qt = QmlWeb.Qt;
    this.contentItem = undefined;
    this.flickableItem = undefined;
    this.viewport = undefined;
    this.frameVisible = false;
    this.highlightOnFocus = false;
    this.verticalScrollBarPolicy = Qt.ScrollBarAsNeeded;
    this.horizontalScrollBarPolicy = Qt.ScrollBarAsNeeded;
    this.style = undefined;
  }

  _createClass(_class14, [{
    key: "$onContentItemChanged",
    value: function $onContentItemChanged(newItem) {
      if ((typeof newItem === "undefined" ? "undefined" : _typeof(newItem)) !== undefined) {
        newItem.parent = this;
      }
    }
  }, {
    key: "$onFlickableItemChanged",
    value: function $onFlickableItemChanged() {}
  }, {
    key: "$onHighlightOnFocusChanged",
    value: function $onHighlightOnFocusChanged() {}
  }, {
    key: "$onViewportChanged",
    value: function $onViewportChanged() {}
  }, {
    key: "$onFocusChanged",
    value: function $onFocusChanged(focus) {
      this.css.outline = this.highlight && focus ? "outline: lightblue solid 2px;" : "";
    }
  }, {
    key: "$onFrameVisibleChanged",
    value: function $onFrameVisibleChanged(visible) {
      this.css.border = visible ? "1px solid gray" : "hidden";
    }
  }, {
    key: "$onHorizontalScrollBarPolicyChanged",
    value: function $onHorizontalScrollBarPolicyChanged(newPolicy) {
      this.css.overflowX = this.$scrollBarPolicyToCssOverflow(newPolicy);
    }
  }, {
    key: "$onVerticalScrollBarPolicyChanged",
    value: function $onVerticalScrollBarPolicyChanged(newPolicy) {
      this.css.overflowY = this.$scrollBarPolicyToCssOverflow(newPolicy);
    }
  }, {
    key: "$onStyleChanged",
    value: function $onStyleChanged() {}
  }, {
    key: "$onChildrenChanged",
    value: function $onChildrenChanged() {
      if (typeof this.contentItem === "undefined" && this.children.length === 1) {
        this.contentItem = this.children[0];
      }
    }
  }, {
    key: "$scrollBarPolicyToCssOverflow",
    value: function $scrollBarPolicyToCssOverflow(policy) {
      var Qt = QmlWeb.Qt;
      switch (policy) {
        case Qt.ScrollBarAsNeeded:
          return "auto";
        case Qt.ScrollBarAlwaysOff:
          return "hidden";
        case Qt.ScrollBarAlwaysOn:
          return "scroll";
      }
      return "auto";
    }
  }]);

  return _class14;
}());

QmlWeb.registerQmlType({
  module: "QtQuick.Controls",
  name: "TextArea",
  versions: /.*/,
  baseClass: "QtQuick.TextEdit"
}, function () {
  function _class15(meta) {
    _classCallCheck(this, _class15);

    QmlWeb.callSuper(this, meta);
    var textarea = this.impl;
    textarea.style.padding = "5px";
    textarea.style.borderWidth = "1px";
    textarea.style.backgroundColor = "#fff";
  }

  return _class15;
}());

/**
 *
 * TextField is used to accept a line of text input.
 * Input constraints can be placed on a TextField item
 * (for example, through a validator or inputMask).
 * Setting echoMode to an appropriate value enables TextField
 * to be used for a password input field.
 *
 * Valid entries for echoMode and alignment are defined in TextInput.
 *
 */

QmlWeb.registerQmlType({
  module: "QtQuick.Controls",
  name: "TextField",
  versions: /.*/,
  baseClass: "QtQuick.Item",
  enums: {
    TextInput: { Normal: 0, Password: 1, NoEcho: 2, PasswordEchoOnEdit: 3 }
  },
  properties: {
    text: "string",
    maximumLength: { type: "int", initialValue: -1 },
    readOnly: "bool",
    validator: "var",
    echoMode: "enum" // TextInput.Normal
  },
  signals: {
    accepted: []
  }
}, function () {
  function _class16(meta) {
    var _this19 = this;

    _classCallCheck(this, _class16);

    QmlWeb.callSuper(this, meta);

    var QMLFont = QmlWeb.getConstructor("QtQuick", "2.0", "Font");
    this.font = new QMLFont(this);

    var input = this.impl = document.createElement("input");
    input.type = "text";
    input.disabled = true;
    input.style.pointerEvents = "auto";
    input.style.margin = "0";
    input.style.width = "100%";
    this.dom.appendChild(input);
    this.setupFocusOnDom(input);
    input.disabled = false;

    this.Component.completed.connect(this, this.Component$onCompleted);
    this.textChanged.connect(this, this.$onTextChanged);
    this.echoModeChanged.connect(this, this.$onEchoModeChanged);
    this.maximumLengthChanged.connect(this, this.$onMaximumLengthChanged);
    this.readOnlyChanged.connect(this, this.$onReadOnlyChanged);
    this.Keys.pressed.connect(this, this.Keys$onPressed);

    this.impl.addEventListener("input", function () {
      return _this19.$updateValue();
    });
  }

  _createClass(_class16, [{
    key: "Component$onCompleted",
    value: function Component$onCompleted() {
      this.implicitWidth = this.impl.offsetWidth;
      this.implicitHeight = this.impl.offsetHeight;
    }
  }, {
    key: "$onTextChanged",
    value: function $onTextChanged(newVal) {
      // See TextInput for comments
      if (this.impl.value !== newVal) {
        this.impl.value = newVal;
      }
    }
  }, {
    key: "$onEchoModeChanged",
    value: function $onEchoModeChanged(newVal) {
      var TextInput = this.TextInput;
      var input = this.impl;
      switch (newVal) {
        case TextInput.Normal:
          input.type = "text";
          break;
        case TextInput.Password:
          input.type = "password";
          break;
        case TextInput.NoEcho:
          // Not supported, use password, that's nearest
          input.type = "password";
          break;
        case TextInput.PasswordEchoOnEdit:
          // Not supported, use password, that's nearest
          input.type = "password";
          break;
      }
    }
  }, {
    key: "$onMaximumLengthChanged",
    value: function $onMaximumLengthChanged(newVal) {
      this.impl.maxLength = newVal < 0 ? null : newVal;
    }
  }, {
    key: "$onReadOnlyChanged",
    value: function $onReadOnlyChanged(newVal) {
      this.impl.disabled = newVal;
    }
  }, {
    key: "Keys$onPressed",
    value: function Keys$onPressed(e) {
      var Qt = QmlWeb.Qt;
      var submit = e.key === Qt.Key_Return || e.key === Qt.Key_Enter;
      if (submit && this.$testValidator()) {
        this.accepted();
        e.accepted = true;
      }
    }
  }, {
    key: "$testValidator",
    value: function $testValidator() {
      if (this.validator) {
        return this.validator.validate(this.text);
      }
      return true;
    }
  }, {
    key: "$updateValue",
    value: function $updateValue() {
      if (this.text !== this.impl.value) {
        this.$canEditReadOnlyProperties = true;
        this.text = this.impl.value;
        this.$canEditReadOnlyProperties = false;
      }
    }
  }]);

  return _class16;
}());

QmlWeb.registerQmlType({
  module: "QtQuick.Window",
  name: "Screen",
  versions: /.*/,
  baseClass: "QtQuick.Item",
  properties: {
    name: "string",
    orientation: "enum",
    orientationUpdateMask: "enum",
    primaryOrientation: "enum",
    pixelDensity: "real",
    devicePixelRatio: "real",
    desktopAvailableHeight: "int",
    desktopAvailableWidth: "int",
    height: "int",
    width: "int"
  }
}, function () {
  function _class17(meta) {
    _classCallCheck(this, _class17);

    QmlWeb.callSuper(this, meta);

    // TODO: rewrite as an attached object and forbid constructing
    this.Component.completed.connect(this, this.Component$onCompleted);
  }

  _createClass(_class17, [{
    key: "Component$onCompleted",
    value: function Component$onCompleted() {
      var Qt = QmlWeb.Qt;
      this.desktopAvailableHeight = window.outerHeight;
      this.desktopAvailableWidth = window.outerWidth;
      this.devicePixelRatio = window.devicePixelRatio;
      this.height = window.innerHeight;
      this.name = this.name;
      this.orientation = Qt.PrimaryOrientation;
      this.orientationUpdateMask = 0;
      this.pixelDensity = 100.0; // TODO
      this.primaryOrientation = Qt.PrimaryOrientation;
      this.width = window.innerWidth;
    }
  }]);

  return _class17;
}());

QmlWeb.registerQmlType({
  module: "QtQuick",
  name: "AnimatedImage",
  versions: /.*/,
  baseClass: "Image"
}, function () {
  function _class18(meta) {
    _classCallCheck(this, _class18);

    QmlWeb.callSuper(this, meta);
  }

  return _class18;
}());

QmlWeb.registerQmlType({
  module: "QtQuick",
  name: "Animation",
  versions: /.*/,
  baseClass: "QtQml.QtObject",
  enums: {
    Animation: { Infinite: -1 },
    Easing: QmlWeb.Easing
  },
  properties: {
    alwaysRunToEnd: "bool",
    loops: { type: "int", initialValue: 1 },
    paused: "bool",
    running: "bool"
  }
}, function () {
  function _class19(meta) {
    _classCallCheck(this, _class19);

    QmlWeb.callSuper(this, meta);
  }

  _createClass(_class19, [{
    key: "restart",
    value: function restart() {
      this.stop();
      this.start();
    }
  }, {
    key: "start",
    value: function start() {
      this.running = true;
    }
  }, {
    key: "stop",
    value: function stop() {
      this.running = false;
    }
  }, {
    key: "pause",
    value: function pause() {
      this.paused = true;
    }
  }, {
    key: "resume",
    value: function resume() {
      this.paused = false;
    }
  }, {
    key: "complete",
    value: function complete() {
      // To be overridden
      console.log("Unbound method for", this);
    }
  }]);

  return _class19;
}());

QmlWeb.registerQmlType({
  module: "QtQuick",
  name: "Behavior",
  versions: /.*/,
  baseClass: "QtQml.QtObject",
  properties: {
    animation: "Animation",
    enabled: { type: "bool", initialValue: true }
  },
  defaultProperty: "animation"
}, function () {
  function _class20(meta) {
    _classCallCheck(this, _class20);

    QmlWeb.callSuper(this, meta);
    this.$on = meta.object.$on;

    this.animationChanged.connect(this, this.$onAnimationChanged);
    this.enabledChanged.connect(this, this.$onEnabledChanged);
  }

  _createClass(_class20, [{
    key: "$onAnimationChanged",
    value: function $onAnimationChanged(newVal) {
      newVal.target = this.$parent;
      newVal.property = this.$on;
      this.$parent.$properties[this.$on].animation = newVal;
    }
  }, {
    key: "$onEnabledChanged",
    value: function $onEnabledChanged(newVal) {
      this.$parent.$properties[this.$on].animation = newVal ? this.animation : null;
    }
  }]);

  return _class20;
}());

QmlWeb.registerQmlType({
  module: "QtQuick",
  name: "BorderImage",
  versions: /.*/,
  baseClass: "Item",
  enums: {
    BorderImage: {
      Stretch: "stretch", Repeat: "repeat", Round: "round",
      Null: 1, Ready: 2, Loading: 3, Error: 4
    }
  },
  properties: {
    source: "url",
    smooth: { type: "bool", initialValue: true },
    // BorderImage.Stretch
    horizontalTileMode: { type: "enum", initialValue: "stretch" },
    // BorderImage.Stretch
    verticalTileMode: { type: "enum", initialValue: "stretch" },
    progress: "real",
    status: { type: "enum", initialValue: 1 } // BorderImage.Null
  }
}, function () {
  function _class21(meta) {
    var _this20 = this;

    _classCallCheck(this, _class21);

    QmlWeb.callSuper(this, meta);

    var createProperty = QmlWeb.createProperty;
    this.border = new QmlWeb.QObject(this);
    createProperty("int", this.border, "left");
    createProperty("int", this.border, "right");
    createProperty("int", this.border, "top");
    createProperty("int", this.border, "bottom");

    var bg = this.impl = document.createElement("div");
    bg.style.pointerEvents = "none";
    bg.style.height = "100%";
    bg.style.boxSizing = "border-box";
    this.dom.appendChild(bg);

    this.$img = new Image();
    this.$img.addEventListener("load", function () {
      _this20.progress = 1;
      _this20.status = _this20.BorderImage.Ready;
    });
    this.$img.addEventListener("error", function () {
      _this20.status = _this20.BorderImage.Error;
    });

    this.sourceChanged.connect(this, this.$onSourceChanged);
    this.border.leftChanged.connect(this, this.$updateBorder);
    this.border.rightChanged.connect(this, this.$updateBorder);
    this.border.topChanged.connect(this, this.$updateBorder);
    this.border.bottomChanged.connect(this, this.$updateBorder);
    this.horizontalTileModeChanged.connect(this, this.$updateBorder);
    this.verticalTileModeChanged.connect(this, this.$updateBorder);
    this.smoothChanged.connect(this, this.$onSmoothChanged);
  }

  _createClass(_class21, [{
    key: "$onSourceChanged",
    value: function $onSourceChanged(source) {
      this.progress = 0;
      this.status = this.BorderImage.Loading;
      var style = this.impl.style;
      var imageURL = QmlWeb.engine.$resolveImageURL(source);
      style.OBorderImageSource = "url(\"" + imageURL + "\")";
      style.borderImageSource = "url(\"" + imageURL + "\")";
      this.$img.src = imageURL;
      if (this.$img.complete) {
        this.progress = 1;
        this.status = this.BorderImage.Ready;
      }
    }
  }, {
    key: "$updateBorder",
    value: function $updateBorder() {
      var style = this.impl.style;
      var _border = this.border,
          right = _border.right,
          left = _border.left,
          top = _border.top,
          bottom = _border.bottom;

      var slice = top + " " + right + " " + bottom + " " + left + " fill";
      var width = top + "px " + right + "px " + bottom + "px " + left + "px";
      var repeat = this.horizontalTileMode + " " + this.verticalTileMode;
      style.OBorderImageSlice = slice;
      style.OBorderImageRepeat = repeat;
      style.OBorderImageWidth = width;
      style.borderImageSlice = slice;
      style.borderImageRepeat = repeat;
      style.borderImageWidth = width;
    }
  }, {
    key: "$onSmoothChanged",
    value: function $onSmoothChanged(val) {
      var style = this.impl.style;
      if (val) {
        style.imageRendering = "auto";
      } else {
        style.imageRendering = "-webkit-optimize-contrast";
        style.imageRendering = "-moz-crisp-edges";
        style.imageRendering = "crisp-edges";
        style.imageRendering = "pixelated";
      }
    }
  }]);

  return _class21;
}());

// TODO
// Currently only a skeleton implementation

QmlWeb.registerQmlType({
  module: "QtQuick",
  name: "Canvas",
  versions: /.*/,
  baseClass: "Item",
  properties: {
    available: { type: "bool", initialValue: true },
    canvasSize: { type: "var", initialValue: [0, 0] },
    canvasWindow: { type: "var", initialValue: [0, 0, 0, 0] },
    context: { type: "var", initialValue: {} },
    contextType: { type: "string", initialValue: "contextType" },
    renderStrategy: "enum",
    renderTarget: "enum",
    tileSize: { type: "var", initialValue: [0, 0] }
  },
  signals: {
    imageLoaded: [],
    paint: [{ type: "var", name: "region" }],
    painted: []
  }
}, function () {
  function _class22(meta) {
    _classCallCheck(this, _class22);

    QmlWeb.callSuper(this, meta);
  }

  _createClass(_class22, [{
    key: "cancelRequestAnimationFrame",
    value: function cancelRequestAnimationFrame() /*handle*/{
      return false;
    }
  }, {
    key: "getContext",
    value: function getContext() /*context_id, ...args*/{
      return {};
    }
  }, {
    key: "isImageError",
    value: function isImageError() /*image*/{
      return true;
    }
  }, {
    key: "isImageLoaded",
    value: function isImageLoaded() /*image*/{
      return false;
    }
  }, {
    key: "isImageLoading",
    value: function isImageLoading() /*image*/{
      return false;
    }
  }, {
    key: "loadImage",
    value: function loadImage(image) {
      //loadImageAsync(image);
      if (this.isImageLoaded(image)) {
        this.imageLoaded();
      }
    }
  }, {
    key: "markDirty",
    value: function markDirty(area) {
      // if dirty
      this.paint(area);
    }
  }, {
    key: "requestAnimationFrame",
    value: function requestAnimationFrame() /*callback*/{
      return 0;
    }
  }, {
    key: "requestPaint",
    value: function requestPaint() {}
  }, {
    key: "save",
    value: function save() /*file_name*/{
      return false;
    }
  }, {
    key: "toDataURL",
    value: function toDataURL() /*mime_type*/{
      return "";
    }
  }, {
    key: "unloadImage",
    value: function unloadImage() /*image*/{}
  }]);

  return _class22;
}());

QmlWeb.registerQmlType({
  module: "QtQuick",
  name: "Column",
  versions: /.*/,
  baseClass: "Positioner"
}, function () {
  function _class23(meta) {
    _classCallCheck(this, _class23);

    QmlWeb.callSuper(this, meta);
  }

  _createClass(_class23, [{
    key: "layoutChildren",
    value: function layoutChildren() {
      var curPos = 0;
      var maxWidth = 0;
      for (var i = 0; i < this.children.length; i++) {
        var child = this.children[i];
        if (!child.visible || !child.width || !child.height) {
          continue;
        }
        maxWidth = child.width > maxWidth ? child.width : maxWidth;
        child.y = curPos;
        curPos += child.height + this.spacing;
      }
      this.implicitWidth = maxWidth;
      this.implicitHeight = curPos - this.spacing;
      // We want no spacing at the bottom side
    }
  }]);

  return _class23;
}());

QmlWeb.registerQmlType({
  module: "QtQuick",
  name: "DoubleValidator",
  versions: /.*/,
  baseClass: "Item",
  enums: {
    DoubleValidator: { StandardNotation: 1, ScientificNotation: 2 }
  },
  properties: {
    bottom: { type: "real", initialValue: -Infinity },
    top: { type: "real", initialValue: Infinity },
    decimals: { type: "int", initialValue: 1000 },
    // DoubleValidator.ScientificNotation
    notation: { type: "enum", initialValue: 2 }
  }
}, function () {
  function _class24(meta) {
    _classCallCheck(this, _class24);

    QmlWeb.callSuper(this, meta);
    this.$standardRegExp = /^(-|\+)?\s*[0-9]+(\.[0-9]+)?$/;
    this.$scientificRegExp = /^(-|\+)?\s*[0-9]+(\.[0-9]+)?(E(-|\+)?[0-9]+)?$/;
  }

  _createClass(_class24, [{
    key: "getRegExpForNotation",
    value: function getRegExpForNotation(notation) {
      switch (notation) {
        case this.DoubleValidator.ScientificNotation:
          return this.$scientificRegExp;
        case this.DoubleValidator.StandardNotation:
          return this.$standardRegExp;
      }
      return null;
    }
  }, {
    key: "$getDecimalsForNumber",
    value: function $getDecimalsForNumber(number) {
      if (Math.round(number) === number) {
        return 0;
      }
      var str = "" + number;
      return (/\d*$/.exec(str)[0].length
      );
    }
  }, {
    key: "validate",
    value: function validate(string) {
      var regExp = this.getRegExpForNotation(this.notation);
      if (!regExp.test(string.trim())) {
        return false;
      }
      var value = parseFloat(string);
      return this.bottom <= value && this.top >= value && this.$getDecimalsForNumber(value) <= this.decimals;
    }
  }]);

  return _class24;
}());

QmlWeb.registerQmlType({
  module: "QtQuick",
  name: "Flow",
  versions: /.*/,
  baseClass: "Positioner",
  enums: {
    Flow: { LeftToRight: 0, TopToBottom: 1 }
  },
  properties: {
    flow: "enum", // Flow.LeftToRight
    layoutDirection: "enum" // Flow.LeftToRight
  }
}, function () {
  function _class25(meta) {
    _classCallCheck(this, _class25);

    QmlWeb.callSuper(this, meta);

    this.flowChanged.connect(this, this.layoutChildren);
    this.layoutDirectionChanged.connect(this, this.layoutChildren);
    this.widthChanged.connect(this, this.layoutChildren);
    this.heightChanged.connect(this, this.layoutChildren);
    this.layoutChildren();
  }

  _createClass(_class25, [{
    key: "layoutChildren",
    value: function layoutChildren() {
      if (this.flow === undefined) {
        // Flow has not been fully initialized yet
        return;
      }

      var curHPos = 0;
      var curVPos = 0;
      var rowSize = 0;
      for (var i = 0; i < this.children.length; i++) {
        var child = this.children[i];
        if (!child.visible || !child.width || !child.height) {
          continue;
        }

        if (this.flow === this.Flow.LeftToRight) {
          if (!this.$isUsingImplicitWidth && curHPos + child.width > this.width) {
            curHPos = 0;
            curVPos += rowSize + this.spacing;
            rowSize = 0;
          }
          rowSize = child.height > rowSize ? child.height : rowSize;
          child.x = this.layoutDirection === this.Flow.TopToBottom ? this.width - curHPos - child.width : curHPos;
          child.y = curVPos;
          curHPos += child.width + this.spacing;
        } else {
          // Flow.TopToBottom
          if (!this.$isUsingImplicitHeight && curVPos + child.height > this.height) {
            curVPos = 0;
            curHPos += rowSize + this.spacing;
            rowSize = 0;
          }
          rowSize = child.width > rowSize ? child.width : rowSize;
          child.x = this.layoutDirection === this.Flow.TopToBottom ? this.width - curHPos - child.width : curHPos;
          child.y = curVPos;
          curVPos += child.height + this.spacing;
        }
      }

      if (this.flow === this.Flow.LeftToRight) {
        this.implicitWidth = curHPos - this.spacing;
        this.implicitHeight = curVPos + rowSize;
      } else {
        // Flow.TopToBottom
        this.implicitWidth = curHPos + rowSize;
        this.implicitHeight = curVPos - this.spacing;
      }
    }
  }]);

  return _class25;
}());

QmlWeb.registerQmlType({
  module: "QtQuick",
  name: "Font",
  versions: /.*/,
  baseClass: "QtQml.QtObject"
}, function (_QmlWeb$QObject3) {
  _inherits(_class26, _QmlWeb$QObject3);

  function _class26(parent) {
    _classCallCheck(this, _class26);

    // TODO: callSuper support?
    var _this21 = _possibleConstructorReturn(this, (_class26.__proto__ || Object.getPrototypeOf(_class26)).call(this, parent));

    _this21.Font = global.Font; // TODO: make a sane enum

    var Font = _this21.Font;
    var createProperty = QmlWeb.createProperty;

    createProperty("bool", _this21, "bold");
    createProperty("enum", _this21, "capitalization", { initialValue: Font.MixedCase });
    createProperty("string", _this21, "family", { initialValue: "sans-serif" });
    createProperty("bool", _this21, "italic");
    createProperty("real", _this21, "letterSpacing");
    createProperty("int", _this21, "pixelSize", { initialValue: 13 });
    createProperty("real", _this21, "pointSize", { initialValue: 10 });
    createProperty("bool", _this21, "strikeout");
    createProperty("bool", _this21, "underline");
    createProperty("enum", _this21, "weight", { initialValue: Font.Normal });
    createProperty("real", _this21, "wordSpacing");

    _this21.$sizeLock = false;

    _this21.boldChanged.connect(_this21, _this21.$onBoldChanged);
    _this21.capitalizationChanged.connect(_this21, _this21.$onCapitalizationChanged);
    _this21.familyChanged.connect(_this21, _this21.$onFamilyChanged);
    _this21.italicChanged.connect(_this21, _this21.$onItalicChanged);
    _this21.letterSpacingChanged.connect(_this21, _this21.$onLetterSpacingChanged);
    _this21.pixelSizeChanged.connect(_this21, _this21.$onPixelSizeChanged);
    _this21.pointSizeChanged.connect(_this21, _this21.$onPointSizeChanged);
    _this21.strikeoutChanged.connect(_this21, _this21.$onStrikeoutChanged);
    _this21.underlineChanged.connect(_this21, _this21.$onUnderlineChanged);
    _this21.weightChanged.connect(_this21, _this21.$onWidthChanged);
    _this21.wordSpacingChanged.connect(_this21, _this21.$onWordSpacingChanged);
    return _this21;
  }

  _createClass(_class26, [{
    key: "$onBoldChanged",
    value: function $onBoldChanged(newVal) {
      var Font = this.Font;
      this.weight = newVal ? Font.Bold : Font.Normal;
    }
  }, {
    key: "$onCapitalizationChanged",
    value: function $onCapitalizationChanged(newVal) {
      var style = this.$parent.dom.firstChild.style;
      style.fontVariant = newVal === this.Font.SmallCaps ? "small-caps" : "none";
      style.textTransform = this.$capitalizationToTextTransform(newVal);
    }
  }, {
    key: "$onFamilyChanged",
    value: function $onFamilyChanged(newVal) {
      var style = this.$parent.dom.firstChild.style;
      style.fontFamily = newVal;
    }
  }, {
    key: "$onItalicChanged",
    value: function $onItalicChanged(newVal) {
      var style = this.$parent.dom.firstChild.style;
      style.fontStyle = newVal ? "italic" : "normal";
    }
  }, {
    key: "$onLetterSpacingChanged",
    value: function $onLetterSpacingChanged(newVal) {
      var style = this.$parent.dom.firstChild.style;
      style.letterSpacing = newVal !== undefined ? newVal + "px" : "";
    }
  }, {
    key: "$onPixelSizeChanged",
    value: function $onPixelSizeChanged(newVal) {
      if (!this.$sizeLock) {
        this.pointSize = newVal * 0.75;
      }
      var val = newVal + "px";
      this.$parent.dom.style.fontSize = val;
      this.$parent.dom.firstChild.style.fontSize = val;
    }
  }, {
    key: "$onPointSizeChanged",
    value: function $onPointSizeChanged(newVal) {
      this.$sizeLock = true;
      this.pixelSize = Math.round(newVal / 0.75);
      this.$sizeLock = false;
    }
  }, {
    key: "$onStrikeoutChanged",
    value: function $onStrikeoutChanged(newVal) {
      var style = this.$parent.dom.firstChild.style;
      style.textDecoration = newVal ? "line-through" : this.$parent.font.underline ? "underline" : "none";
    }
  }, {
    key: "$onUnderlineChanged",
    value: function $onUnderlineChanged(newVal) {
      var style = this.$parent.dom.firstChild.style;
      style.textDecoration = this.$parent.font.strikeout ? "line-through" : newVal ? "underline" : "none";
    }
  }, {
    key: "$onWidthChanged",
    value: function $onWidthChanged(newVal) {
      var style = this.$parent.dom.firstChild.style;
      style.fontWeight = this.$weightToCss(newVal);
    }
  }, {
    key: "$onWordSpacingChanged",
    value: function $onWordSpacingChanged(newVal) {
      var style = this.$parent.dom.firstChild.style;
      style.wordSpacing = newVal !== undefined ? newVal + "px" : "";
    }
  }, {
    key: "$weightToCss",
    value: function $weightToCss(weight) {
      var Font = this.Font;
      switch (weight) {
        case Font.Thin:
          return "100";
        case Font.ExtraLight:
          return "200";
        case Font.Light:
          return "300";
        case Font.Normal:
          return "400";
        case Font.Medium:
          return "500";
        case Font.DemiBold:
          return "600";
        case Font.Bold:
          return "700";
        case Font.ExtraBold:
          return "800";
        case Font.Black:
          return "900";
      }
      return "normal";
    }
  }, {
    key: "$capitalizationToTextTransform",
    value: function $capitalizationToTextTransform(capitalization) {
      var Font = this.Font;
      switch (capitalization) {
        case Font.AllUppercase:
          return "uppercase";
        case Font.AllLowercase:
          return "lowercase";
        case Font.Capitalize:
          return "capitalize";
      }
      return "none";
    }
  }]);

  return _class26;
}(QmlWeb.QObject));

global.Font = {
  // Capitalization
  MixedCase: 0,
  AllUppercase: 1,
  AllLowercase: 2,
  SmallCaps: 3,
  Capitalize: 4,
  // Weight
  Thin: 0,
  ExtraLight: 12,
  Light: 25,
  Normal: 50,
  Medium: 57,
  DemiBold: 63,
  Bold: 75,
  ExtraBold: 81,
  Black: 87
};

QmlWeb.registerQmlType({
  module: "QtQuick",
  name: "FontLoader",
  versions: /.*/,
  baseClass: "QtQml.QtObject",
  enums: {
    FontLoader: { Null: 0, Ready: 1, Loading: 2, Error: 3 }
  },
  properties: {
    name: "string",
    source: "url",
    status: "enum" // FontLoader.Null
  }
}, function () {
  function _class27(meta) {
    _classCallCheck(this, _class27);

    QmlWeb.callSuper(this, meta);

    this.$domStyle = document.createElement("style");
    this.$lastName = "";
    this.$inTouchName = false;

    /*
      Maximum timeout is the maximum time for a font to load. If font isn't
      loaded in this time, the status is set to Error.
      For both cases (with and without FontLoader.js) if the font takes more
      than the maximum timeout to load, dimensions recalculations for elements
      that are using this font will not be triggered or will have no effect.
       FontLoader.js uses only the last timeout. The state and name properties
      are set immediately when the font loads. If the font could not be loaded,
      the Error status will be set only when this timeout expires. If the font
      loading takes more than the timeout, the name property is set, but the
      status is set to Error.
       Fallback sets the font name immediately and touches it several times to
      trigger dimensions recalcuations. The status is set to Error and should
      not be used.
    */
    // 15 seconds maximum
    this.$timeouts = [20, 50, 100, 300, 500, 1000, 3000, 5000, 10000, 15000];

    this.sourceChanged.connect(this, this.$onSourceChanged);
    this.nameChanged.connect(this, this.$onNameChanged);
  }

  _createClass(_class27, [{
    key: "$loadFont",
    value: function $loadFont(fontName) {
      var _this22 = this;

      /* global FontLoader */
      if (this.$lastName === fontName || this.$inTouchName) {
        return;
      }
      this.$lastName = fontName;

      if (!fontName) {
        this.status = this.FontLoader.Null;
        return;
      }
      this.status = this.FontLoader.Loading;
      if (typeof FontLoader === "function") {
        var fontLoader = new FontLoader([fontName], {
          fontsLoaded: function fontsLoaded(error) {
            if (error !== null) {
              if (_this22.$lastName === fontName && error.notLoadedFontFamilies[0] === fontName) {
                // Set the name for the case of font loading after the timeout.
                _this22.name = fontName;
                _this22.status = _this22.FontLoader.Error;
              }
            }
          },
          fontLoaded: function fontLoaded(fontFamily) {
            if (_this22.$lastName === fontName && fontFamily === fontName) {
              _this22.name = fontName;
              _this22.status = _this22.FontLoader.Ready;
            }
          }
        }, this.$timeouts[this.$timeouts.length - 1]);
        // Else I get problems loading multiple fonts (FontLoader.js bug?)
        FontLoader.testDiv = null;
        fontLoader.loadFonts();
      } else {
        console.warn("FontLoader.js library is not loaded.\nYou should load FontLoader.js if you want to use QtQuick FontLoader elements.\nRefs: https://github.com/smnh/FontLoader.");
        // You should not rely on 'status' property without FontLoader.js.
        this.status = this.FontLoader.Error;
        this.name = fontName;
        this.$cycleTouchName(fontName, 0);
      }
    }
  }, {
    key: "$cycleTouchName",
    value: function $cycleTouchName(fontName, i) {
      var _this23 = this;

      if (this.$lastName !== fontName) {
        return;
      }
      if (i > 0) {
        var name = this.name;
        this.$inTouchName = true;
        // Calling this.nameChanged() is not enough, we have to actually change
        // the value to flush the bindings.
        this.name = "sans-serif";
        this.name = name;
        this.$inTouchName = false;
      }
      if (i < this.$timeouts.length) {
        setTimeout(function () {
          _this23.$cycleTouchName(fontName, i + 1);
        }, this.$timeouts[i] - (i > 0 ? this.$timeouts[i - 1] : 0));
      }
    }
  }, {
    key: "$onSourceChanged",
    value: function $onSourceChanged(font_src) {
      var rand = Math.round(Math.random() * 1e15);
      var fontName = "font_" + Date.now().toString(36) + "_" + rand.toString(36);
      this.$domStyle.innerHTML = "@font-face {\n      font-family: " + fontName + ";\n      src: url('" + font_src + "');\n    }";
      document.getElementsByTagName("head")[0].appendChild(this.$domStyle);
      this.$loadFont(fontName);
    }
  }, {
    key: "$onNameChanged",
    value: function $onNameChanged(fontName) {
      this.$loadFont(fontName);
    }
  }]);

  return _class27;
}());

QmlWeb.registerQmlType({
  module: "QtQuick",
  name: "Grid",
  versions: /.*/,
  baseClass: "Positioner",
  enums: {
    Grid: { LeftToRight: 0, TopToBottom: 1 }
  },
  properties: {
    columns: "int",
    rows: "int",
    flow: "enum",
    layoutDirection: "enum"
  }
}, function () {
  function _class28(meta) {
    _classCallCheck(this, _class28);

    QmlWeb.callSuper(this, meta);

    this.columnsChanged.connect(this, this.layoutChildren);
    this.rowsChanged.connect(this, this.layoutChildren);
    this.flowChanged.connect(this, this.layoutChildren);
    this.layoutDirectionChanged.connect(this, this.layoutChildren);
    this.layoutChildren();
  }

  _createClass(_class28, [{
    key: "layoutChildren",
    value: function layoutChildren() {
      // How many items are actually visible?
      var visibleItems = this.$getVisibleItems();

      // How many rows and columns do we need?

      var _$calculateSize = this.$calculateSize(visibleItems.length),
          _$calculateSize2 = _slicedToArray(_$calculateSize, 2),
          c = _$calculateSize2[0],
          r = _$calculateSize2[1];

      // How big are the colums/rows?


      var _$calculateGrid = this.$calculateGrid(visibleItems, c, r),
          _$calculateGrid2 = _slicedToArray(_$calculateGrid, 2),
          colWidth = _$calculateGrid2[0],
          rowHeight = _$calculateGrid2[1];

      // Do actual positioning
      // When layoutDirection is RightToLeft we need oposite order of coumns


      var step = this.layoutDirection === 1 ? -1 : 1;
      var startingPoint = this.layoutDirection === 1 ? c - 1 : 0;
      var endPoint = this.layoutDirection === 1 ? -1 : c;
      var curHPos = 0;
      var curVPos = 0;
      if (this.flow === 0) {
        for (var i = 0; i < r; i++) {
          for (var j = startingPoint; j !== endPoint; j += step) {
            var item = visibleItems[i * c + j];
            if (!item) {
              break;
            }
            item.x = curHPos;
            item.y = curVPos;

            curHPos += colWidth[j] + this.spacing;
          }
          curVPos += rowHeight[i] + this.spacing;
          curHPos = 0;
        }
      } else {
        for (var _i2 = startingPoint; _i2 !== endPoint; _i2 += step) {
          for (var _j = 0; _j < r; _j++) {
            var _item = visibleItems[_i2 * r + _j];
            if (!_item) {
              break;
            }
            _item.x = curHPos;
            _item.y = curVPos;

            curVPos += rowHeight[_j] + this.spacing;
          }
          curHPos += colWidth[_i2] + this.spacing;
          curVPos = 0;
        }
      }

      // Set implicit size
      var gridWidth = -this.spacing;
      var gridHeight = -this.spacing;
      for (var _i3 in colWidth) {
        gridWidth += colWidth[_i3] + this.spacing;
      }
      for (var _i4 in rowHeight) {
        gridHeight += rowHeight[_i4] + this.spacing;
      }
      this.implicitWidth = gridWidth;
      this.implicitHeight = gridHeight;
    }
  }, {
    key: "$getVisibleItems",
    value: function $getVisibleItems() {
      return this.children.filter(function (child) {
        return child.visible && child.width && child.height;
      });
    }
  }, {
    key: "$calculateSize",
    value: function $calculateSize(length) {
      var cols = void 0;
      var rows = void 0;
      if (!this.columns && !this.rows) {
        cols = 4;
        rows = Math.ceil(length / cols);
      } else if (!this.columns) {
        rows = this.rows;
        cols = Math.ceil(length / rows);
      } else {
        cols = this.columns;
        rows = Math.ceil(length / cols);
      }
      return [cols, rows];
    }
  }, {
    key: "$calculateGrid",
    value: function $calculateGrid(visibleItems, cols, rows) {
      var colWidth = [];
      var rowHeight = [];

      if (this.flow === 0) {
        for (var i = 0; i < rows; i++) {
          for (var j = 0; j < cols; j++) {
            var item = visibleItems[i * cols + j];
            if (!item) {
              break;
            }
            if (!colWidth[j] || item.width > colWidth[j]) {
              colWidth[j] = item.width;
            }
            if (!rowHeight[i] || item.height > rowHeight[i]) {
              rowHeight[i] = item.height;
            }
          }
        }
      } else {
        for (var _i5 = 0; _i5 < cols; _i5++) {
          for (var _j2 = 0; _j2 < rows; _j2++) {
            var _item2 = visibleItems[_i5 * rows + _j2];
            if (!_item2) {
              break;
            }
            if (!rowHeight[_j2] || _item2.height > rowHeight[_j2]) {
              rowHeight[_j2] = _item2.height;
            }
            if (!colWidth[_i5] || _item2.width > colWidth[_i5]) {
              colWidth[_i5] = _item2.width;
            }
          }
        }
      }

      return [colWidth, rowHeight];
    }
  }]);

  return _class28;
}());

QmlWeb.registerQmlType({
  module: "QtQuick",
  name: "Image",
  versions: /.*/,
  baseClass: "Item",
  enums: {
    Image: {
      Stretch: 1, PreserveAspectFit: 2, PreserveAspectCrop: 3,
      Tile: 4, TileVertically: 5, TileHorizontally: 6,

      Null: 1, Ready: 2, Loading: 3, Error: 4
    }
  },
  properties: {
    asynchronous: { type: "bool", initialValue: true },
    cache: { type: "bool", initialValue: true },
    smooth: { type: "bool", initialValue: true },
    fillMode: { type: "enum", initialValue: 1 }, // Image.Stretch
    mirror: "bool",
    progress: "real",
    source: "url",
    status: { type: "enum", initialValue: 1 } // Image.Null
  }
}, function () {
  function _class29(meta) {
    var _this24 = this;

    _classCallCheck(this, _class29);

    QmlWeb.callSuper(this, meta);

    var createProperty = QmlWeb.createProperty;

    this.sourceSize = new QmlWeb.QObject(this);
    createProperty("int", this.sourceSize, "width");
    createProperty("int", this.sourceSize, "height");

    var bg = this.impl = document.createElement("div");
    bg.style.pointerEvents = "none";
    bg.style.height = "100%";
    this.dom.appendChild(bg);

    this.$img = new Image();
    this.$img.addEventListener("load", function () {
      var w = _this24.$img.naturalWidth;
      var h = _this24.$img.naturalHeight;
      _this24.sourceSize.width = w;
      _this24.sourceSize.height = h;
      _this24.implicitWidth = w;
      _this24.implicitHeight = h;
      _this24.progress = 1;
      _this24.status = _this24.Image.Ready;
    });
    this.$img.addEventListener("error", function () {
      _this24.status = _this24.Image.Error;
    });

    this.sourceChanged.connect(this, this.$onSourceChanged);
    this.mirrorChanged.connect(this, this.$onMirrorChanged);
    this.fillModeChanged.connect(this, this.$onFillModeChanged);
    this.smoothChanged.connect(this, this.$onSmoothChanged);
  }

  _createClass(_class29, [{
    key: "$updateFillMode",
    value: function $updateFillMode() {
      var val = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : this.fillMode;

      var style = this.impl.style;
      switch (val) {
        default:
        case this.Image.Stretch:
          style.backgroundRepeat = "auto";
          style.backgroundSize = "100% 100%";
          style.backgroundPosition = "auto";
          break;
        case this.Image.Tile:
          style.backgroundRepeat = "auto";
          style.backgroundSize = "auto";
          style.backgroundPosition = "center";
          break;
        case this.Image.PreserveAspectFit:
          style.backgroundRepeat = "no-repeat";
          style.backgroundSize = "contain";
          style.backgroundPosition = "center";
          break;
        case this.Image.PreserveAspectCrop:
          style.backgroundRepeat = "no-repeat";
          style.backgroundSize = "cover";
          style.backgroundPosition = "center";
          break;
        case this.Image.TileVertically:
          style.backgroundRepeat = "repeat-y";
          style.backgroundSize = "100% auto";
          style.backgroundPosition = "auto";
          break;
        case this.Image.TileHorizontally:
          style.backgroundRepeat = "repeat-x";
          style.backgroundSize = "auto 100%";
          style.backgroundPosition = "auto";
          break;
      }
    }
  }, {
    key: "$onSourceChanged",
    value: function $onSourceChanged(source) {
      this.progress = 0;
      this.status = this.Image.Loading;
      var imageURL = QmlWeb.engine.$resolveImageURL(source);
      this.impl.style.backgroundImage = "url(\"" + imageURL + "\")";
      this.$img.src = imageURL;
      if (this.$img.complete) {
        this.progress = 1;
        this.status = this.Image.Ready;
      }
      this.$updateFillMode();
    }
  }, {
    key: "$onMirrorChanged",
    value: function $onMirrorChanged(val) {
      var transformRule = "scale(-1,1)";
      if (!val) {
        var index = this.transform.indexOf(transformRule);
        if (index >= 0) {
          this.transform.splice(index, 1);
        }
      } else {
        this.transform.push(transformRule);
      }
      this.$updateTransform();
    }
  }, {
    key: "$onFillModeChanged",
    value: function $onFillModeChanged(val) {
      this.$updateFillMode(val);
    }
  }, {
    key: "$onSmoothChanged",
    value: function $onSmoothChanged(val) {
      var style = this.impl.style;
      if (val) {
        style.imageRendering = "auto";
      } else {
        style.imageRendering = "-webkit-optimize-contrast";
        style.imageRendering = "-moz-crisp-edges";
        style.imageRendering = "crisp-edges";
        style.imageRendering = "pixelated";
      }
    }
  }]);

  return _class29;
}());

QmlWeb.registerQmlType({
  module: "QtQuick",
  name: "IntValidator",
  versions: /.*/,
  baseClass: "Item",
  properties: {
    bottom: { type: "int", initialValue: -2147483647 },
    top: { type: "int", initialValue: 2147483647 }
  }
}, function () {
  function _class30(meta) {
    _classCallCheck(this, _class30);

    QmlWeb.callSuper(this, meta);
  }

  _createClass(_class30, [{
    key: "validate",
    value: function validate(string) {
      var regExp = /^(-|\+)?\s*[0-9]+$/;
      var acceptable = regExp.test(string.trim());

      if (acceptable) {
        var value = parseInt(string, 10);
        acceptable = this.bottom <= value && this.top >= value;
      }
      return acceptable;
    }
  }]);

  return _class30;
}());

QmlWeb.registerQmlType({
  module: "QtQuick",
  name: "Item",
  versions: /.*/,
  baseClass: "QtQml.QtObject",
  properties: {
    $opacity: { type: "real", initialValue: 1 },
    parent: "Item",
    state: "string",
    states: "list",
    transitions: "list",
    data: "list",
    children: "list",
    resources: "list",
    transform: "list",
    x: "real",
    y: "real",
    z: "real",
    width: "real",
    height: "real",
    implicitWidth: "real",
    implicitHeight: "real",
    left: "real",
    right: "real",
    top: "real",
    bottom: "real",
    horizontalCenter: "real",
    verticalCenter: "real",
    rotation: "real",
    scale: { type: "real", initialValue: 1 },
    opacity: { type: "real", initialValue: 1 },
    visible: { type: "bool", initialValue: true },
    clip: "bool",
    focus: "bool"
  },
  defaultProperty: "data"
}, function () {
  function _class31(meta) {
    var _this25 = this;

    _classCallCheck(this, _class31);

    QmlWeb.callSuper(this, meta);

    if (this.$parent === null) {
      // This is the root element. Initialize it.
      this.dom = QmlWeb.engine.rootElement || document.body;
      this.dom.innerHTML = "";
      // Needed to make absolute positioning work
      this.dom.style.position = "relative";
      this.dom.style.top = "0";
      this.dom.style.left = "0";
      // No QML stuff should stand out the root element
      this.dom.style.overflow = "hidden";
    } else {
      if (!this.dom) {
        // Create a dom element for this item.
        this.dom = document.createElement("div");
      }
      this.dom.style.position = "absolute";
    }
    this.dom.style.pointerEvents = "none";
    // In case the class is qualified, only use the last part for the css class
    // name.
    var classComponent = meta.object.$class.split(".").pop();
    this.dom.className = "" + classComponent + (this.id ? " " + this.id : "");
    this.css = this.dom.style;
    this.impl = null; // Store the actually drawn element

    this.css.boxSizing = "border-box";

    var createProperty = QmlWeb.createProperty;

    if (this.$isComponentRoot) {
      createProperty("var", this, "activeFocus");
    }

    this.parentChanged.connect(this, this.$onParentChanged_);
    this.dataChanged.connect(this, this.$onDataChanged);
    this.stateChanged.connect(this, this.$onStateChanged);
    this.visibleChanged.connect(this, this.$onVisibleChanged_);
    this.clipChanged.connect(this, this.$onClipChanged);
    this.zChanged.connect(this, this.$onZChanged);
    this.xChanged.connect(this, this.$onXChanged);
    this.yChanged.connect(this, this.$onYChanged);
    this.widthChanged.connect(this, this.$onWidthChanged_);
    this.heightChanged.connect(this, this.$onHeightChanged_);
    this.focusChanged.connect(this, this.$onFocusChanged_);

    this.widthChanged.connect(this, this.$updateHGeometry);
    this.heightChanged.connect(this, this.$updateVGeometry);
    this.implicitWidthChanged.connect(this, this.$onImplicitWidthChanged);
    this.implicitHeightChanged.connect(this, this.$onImplicitHeightChanged);

    this.$isUsingImplicitWidth = true;
    this.$isUsingImplicitHeight = true;

    this.anchors = new QmlWeb.QObject(this);
    createProperty("var", this.anchors, "left");
    createProperty("var", this.anchors, "right");
    createProperty("var", this.anchors, "top");
    createProperty("var", this.anchors, "bottom");
    createProperty("var", this.anchors, "horizontalCenter");
    createProperty("var", this.anchors, "verticalCenter");
    createProperty("Item", this.anchors, "fill");
    createProperty("Item", this.anchors, "centerIn");
    createProperty("real", this.anchors, "margins");
    createProperty("real", this.anchors, "leftMargin");
    createProperty("real", this.anchors, "rightMargin");
    createProperty("real", this.anchors, "topMargin");
    createProperty("real", this.anchors, "bottomMargin");
    this.anchors.leftChanged.connect(this, this.$updateHGeometry);
    this.anchors.rightChanged.connect(this, this.$updateHGeometry);
    this.anchors.topChanged.connect(this, this.$updateVGeometry);
    this.anchors.bottomChanged.connect(this, this.$updateVGeometry);
    this.anchors.horizontalCenterChanged.connect(this, this.$updateHGeometry);
    this.anchors.verticalCenterChanged.connect(this, this.$updateVGeometry);
    this.anchors.fillChanged.connect(this, this.$updateHGeometry);
    this.anchors.fillChanged.connect(this, this.$updateVGeometry);
    this.anchors.centerInChanged.connect(this, this.$updateHGeometry);
    this.anchors.centerInChanged.connect(this, this.$updateVGeometry);
    this.anchors.leftMarginChanged.connect(this, this.$updateHGeometry);
    this.anchors.rightMarginChanged.connect(this, this.$updateHGeometry);
    this.anchors.topMarginChanged.connect(this, this.$updateVGeometry);
    this.anchors.bottomMarginChanged.connect(this, this.$updateVGeometry);
    this.anchors.marginsChanged.connect(this, this.$updateHGeometry);
    this.anchors.marginsChanged.connect(this, this.$updateVGeometry);

    // childrenRect property
    this.childrenRect = new QmlWeb.QObject(this);
    createProperty("real", this.childrenRect, "x"); // TODO ro
    createProperty("real", this.childrenRect, "y"); // TODO ro
    createProperty("real", this.childrenRect, "width"); // TODO ro
    createProperty("real", this.childrenRect, "height"); // TODO ro

    this.rotationChanged.connect(this, this.$updateTransform);
    this.scaleChanged.connect(this, this.$updateTransform);
    this.transformChanged.connect(this, this.$updateTransform);

    this.Component.completed.connect(this, this.Component$onCompleted_);
    this.opacityChanged.connect(this, this.$calculateOpacity);
    if (this.$parent) {
      this.$parent.$opacityChanged.connect(this, this.$calculateOpacity);
    }

    this.spacing = 0;
    this.$revertActions = [];
    this.css.left = this.x + "px";
    this.css.top = this.y + "px";

    // Init size of root element
    if (this.$parent === null) {
      if (!QmlWeb.engine.rootElement) {
        // Case 1: Qml scene is placed in body tag

        // event handling by addEventListener is probably better than setting
        // window.onresize
        var updateQmlGeometry = function updateQmlGeometry() {
          _this25.implicitHeight = window.innerHeight;
          _this25.implicitWidth = window.innerWidth;
        };
        window.addEventListener("resize", updateQmlGeometry);
        updateQmlGeometry();
      } else {
        // Case 2: Qml scene is placed in some element tag

        // we have to call `this.implicitHeight =` and `this.implicitWidth =`
        // each time the rootElement changes it's geometry
        // to reposition child elements of qml scene

        // it is good to have this as named method of dom element, so we can
        // call it from outside too, whenever element changes it's geometry
        // (not only on window resize)
        this.dom.updateQmlGeometry = function () {
          _this25.implicitHeight = _this25.dom.offsetHeight;
          _this25.implicitWidth = _this25.dom.offsetWidth;
        };
        window.addEventListener("resize", this.dom.updateQmlGeometry);
        this.dom.updateQmlGeometry();
      }
    }
  }

  _createClass(_class31, [{
    key: "$onParentChanged_",
    value: function $onParentChanged_(newParent, oldParent, propName) {
      if (oldParent) {
        oldParent.children.splice(oldParent.children.indexOf(this), 1);
        oldParent.childrenChanged();
        oldParent.dom.removeChild(this.dom);
      }
      if (newParent && newParent.children.indexOf(this) === -1) {
        newParent.children.push(this);
        newParent.childrenChanged();
      }
      if (newParent) {
        newParent.dom.appendChild(this.dom);
      }
      this.$updateHGeometry(newParent, oldParent, propName);
      this.$updateVGeometry(newParent, oldParent, propName);
    }
  }, {
    key: "$onDataChanged",
    value: function $onDataChanged(newData) {
      var QMLItem = QmlWeb.getConstructor("QtQuick", "2.0", "Item");
      for (var i in newData) {
        var child = newData[i];
        if (child instanceof QMLItem) {
          child.parent = this; // This will also add it to children.
        } else {
          this.resources.push(child);
        }
      }
    }
  }, {
    key: "$onStateChanged",
    value: function $onStateChanged(newVal, oldVal) {
      // let oldState; // TODO: do we need oldState?
      var newState = void 0;
      for (var i = 0; i < this.states.length; i++) {
        if (this.states[i].name === newVal) {
          newState = this.states[i];
        }
        /*
        else if (this.states[i].name === oldVal) {
          oldState = this.states[i];
        }
        */
      }

      var actions = this.$revertActions.slice();

      // Get current values for revert actions
      for (var _i6 in actions) {
        var action = actions[_i6];
        action.from = action.target[action.property];
      }
      if (newState) {
        var changes = newState.$getAllChanges();

        // Get all actions we need to do and create actions to revert them
        for (var _i7 = 0; _i7 < changes.length; _i7++) {
          this.$applyChange(actions, changes[_i7]);
        }
      }

      // Set all property changes and fetch the actual values afterwards
      // The latter is needed for transitions. We need to set all properties
      // before we fetch the values because properties can be interdependent.
      for (var _i8 in actions) {
        var _action = actions[_i8];
        _action.target.$properties[_action.property].set(_action.value, QmlWeb.QMLProperty.ReasonUser, _action.target, newState ? newState.$context : _action.target.$context);
      }
      for (var _i9 in actions) {
        var _action2 = actions[_i9];
        _action2.to = _action2.target[_action2.property];
        if (_action2.explicit) {
          // Remove binding
          _action2.target[_action2.property] = _action2.target[_action2.property];
          _action2.value = _action2.target[_action2.property];
        }
      }

      // Find the best transition to use
      var transition = void 0;
      var rating = 0;
      for (var _i10 = 0; _i10 < this.transitions.length; _i10++) {
        // We need to stop running transitions, so let's do
        // it while iterating through the transitions anyway
        this.transitions[_i10].$stop();
        var curTransition = this.transitions[_i10];
        var curRating = 0;
        if (curTransition.from === oldVal || curTransition.reversible && curTransition.from === newVal) {
          curRating += 2;
        } else if (curTransition.from === "*") {
          curRating++;
        } else {
          continue;
        }
        if (curTransition.to === newVal || curTransition.reversible && curTransition.to === oldVal) {
          curRating += 2;
        } else if (curTransition.to === "*") {
          curRating++;
        } else {
          continue;
        }
        if (curRating > rating) {
          rating = curRating;
          transition = curTransition;
        }
      }
      if (transition) {
        transition.$start(actions);
      }
    }
  }, {
    key: "$applyChange",
    value: function $applyChange(actions, change) {
      var _this26 = this;

      var arrayFindIndex = QmlWeb.helpers.arrayFindIndex;

      var _loop = function _loop(j) {
        var item = change.$actions[j];

        var action = {
          target: change.target,
          property: item.property,
          origValue: change.target.$properties[item.property].binding || change.target.$properties[item.property].val,
          value: item.value,
          from: change.target[item.property],
          to: undefined,
          explicit: change.explicit
        };

        var actionIndex = arrayFindIndex(actions, function (element) {
          return element.target === action.target && element.property === action.property;
        });
        if (actionIndex !== -1) {
          actions[actionIndex] = action;
        } else {
          actions.push(action);
        }

        // Look for existing revert action, else create it
        var revertIndex = arrayFindIndex(_this26.$revertActions, function (element) {
          return element.target === change.target && element.property === item.property;
        });
        if (revertIndex !== -1 && !change.restoreEntryValues) {
          // We don't want to revert, so remove it
          _this26.$revertActions.splice(revertIndex, 1);
        } else if (revertIndex === -1 && change.restoreEntryValues) {
          _this26.$revertActions.push({
            target: change.target,
            property: item.property,
            value: change.target.$properties[item.property].binding || change.target.$properties[item.property].val,
            from: undefined,
            to: change.target[item.property]
          });
        }
      };

      for (var j = 0; j < change.$actions.length; j++) {
        _loop(j);
      }
    }
  }, {
    key: "$onVisibleChanged_",
    value: function $onVisibleChanged_(newVal) {
      this.css.visibility = newVal ? "inherit" : "hidden";
    }
  }, {
    key: "$onClipChanged",
    value: function $onClipChanged(newVal) {
      this.css.overflow = newVal ? "hidden" : "visible";
    }
  }, {
    key: "$onZChanged",
    value: function $onZChanged() {
      this.$updateTransform();
    }
  }, {
    key: "$onXChanged",
    value: function $onXChanged(newVal) {
      this.css.left = newVal + "px";
      this.$updateHGeometry();
    }
  }, {
    key: "$onYChanged",
    value: function $onYChanged(newVal) {
      this.css.top = newVal + "px";
      this.$updateVGeometry();
    }
  }, {
    key: "$onWidthChanged_",
    value: function $onWidthChanged_(newVal) {
      this.css.width = newVal ? newVal + "px" : "auto";
    }
  }, {
    key: "$onHeightChanged_",
    value: function $onHeightChanged_(newVal) {
      this.css.height = newVal ? newVal + "px" : "auto";
    }
  }, {
    key: "$onFocusChanged",
    value: function $onFocusChanged(newVal) {
      if (newVal) {
        if (this.dom.firstChild) {
          this.dom.firstChild.focus();
        }
        document.qmlFocus = this;
        this.$context.activeFocus = this;
      } else if (document.qmlFocus === this) {
        document.getElementsByTagName("BODY")[0].focus();
        document.qmlFocus = QmlWeb.engine.rootContext().base;
        this.$context.activeFocus = null;
      }
    }
  }, {
    key: "setupFocusOnDom",
    value: function setupFocusOnDom(element) {
      var _this27 = this;

      var updateFocus = function updateFocus() {
        var hasFocus = document.activeElement === _this27.dom || document.activeElement === _this27.dom.firstChild;
        if (_this27.focus !== hasFocus) {
          _this27.focus = hasFocus;
        }
      };
      element.addEventListener("focus", updateFocus);
      element.addEventListener("blur", updateFocus);
    }
  }, {
    key: "$updateTransform",
    value: function $updateTransform() {
      var QMLTranslate = QmlWeb.getConstructor("QtQuick", "2.0", "Translate");
      var QMLRotation = QmlWeb.getConstructor("QtQuick", "2.0", "Rotation");
      var QMLScale = QmlWeb.getConstructor("QtQuick", "2.0", "Scale");
      var transform = "rotate(" + this.rotation + "deg) scale(" + this.scale + ")";
      var filter = "";
      var transformStyle = "preserve-3d";

      for (var i = 0; i < this.transform.length; i++) {
        var t = this.transform[i];
        if (t instanceof QMLRotation) {
          var ax = t.axis;
          transform += " rotate3d(" + ax.x + ", " + ax.y + ", " + ax.z + ", " + ax.angle + "deg)";
        } else if (t instanceof QMLScale) {
          transform += " scale(" + t.xScale + ", " + t.yScale + ")";
        } else if (t instanceof QMLTranslate) {
          transform += " translate(" + t.x + "px, " + t.y + "px)";
        } else if (typeof t.transformType !== "undefined") {
          if (t.transformType === "filter") {
            filter += t.operation + "(" + t.parameters + ") ";
          }
        } else if (typeof t === "string") {
          transform += t;
        }
      }
      if (typeof this.z === "number") {
        transform += " translate3d(0, 0, " + this.z + "px)";
      }
      this.dom.style.transform = transform;
      this.dom.style.transformStyle = transformStyle;
      this.dom.style.webkitTransform = transform; // Chrome, Safari and Opera
      this.dom.style.webkitTransformStyle = transformStyle;
      this.dom.style.msTransform = transform; // IE
      this.dom.style.filter = filter;
      this.dom.style.webkitFilter = filter; // Chrome, Safari and Opera
    }
  }, {
    key: "Component$onCompleted_",
    value: function Component$onCompleted_() {
      this.$calculateOpacity();
    }
  }, {
    key: "$calculateOpacity",
    value: function $calculateOpacity() {
      // TODO: reset all opacity on layer.enabled changed
      /*
      if (false) { // TODO: check layer.enabled
        this.css.opacity = this.opacity;
      }
      */
      var parentOpacity = this.$parent && this.$parent.$opacity || 1;
      this.$opacity = this.opacity * parentOpacity;
      if (this.impl) {
        this.impl.style.opacity = this.$opacity;
      }
    }
  }, {
    key: "$onImplicitWidthChanged",
    value: function $onImplicitWidthChanged() {
      if (this.$isUsingImplicitWidth) {
        this.width = this.implicitWidth;
        this.$isUsingImplicitWidth = true;
      }
    }
  }, {
    key: "$onImplicitHeightChanged",
    value: function $onImplicitHeightChanged() {
      if (this.$isUsingImplicitHeight) {
        this.height = this.implicitHeight;
        this.$isUsingImplicitHeight = true;
      }
    }
  }, {
    key: "$updateHGeometry",
    value: function $updateHGeometry(newVal, oldVal, propName) {
      var anchors = this.anchors || this;
      if (this.$updatingHGeometry) {
        return;
      }
      this.$updatingHGeometry = true;

      var flags = QmlWeb.Signal.UniqueConnection;
      var lM = anchors.leftMargin || anchors.margins;
      var rM = anchors.rightMargin || anchors.margins;
      var w = this.width;
      var left = this.parent ? this.parent.left : 0;

      // Width
      if (propName === "width") {
        this.$isUsingImplicitWidth = false;
      }

      // Position TODO: Layouts

      var u = {}; // our update object

      if (anchors.fill !== undefined) {
        var fill = anchors.fill;
        var props = fill.$properties;
        props.left.changed.connect(this, this.$updateHGeometry, flags);
        props.right.changed.connect(this, this.$updateHGeometry, flags);
        props.width.changed.connect(this, this.$updateHGeometry, flags);

        this.$isUsingImplicitWidth = false;
        u.width = fill.width - lM - rM;
        u.x = fill.left - left + lM;
        u.left = fill.left + lM;
        u.right = fill.right - rM;
        u.horizontalCenter = (u.left + u.right) / 2;
      } else if (anchors.centerIn !== undefined) {
        var horizontalCenter = anchors.centerIn.$properties.horizontalCenter;
        horizontalCenter.changed.connect(this, this.$updateHGeometry, flags);

        u.horizontalCenter = anchors.centerIn.horizontalCenter;
        u.x = u.horizontalCenter - w / 2 - left;
        u.left = u.horizontalCenter - w / 2;
        u.right = u.horizontalCenter + w / 2;
      } else if (anchors.left !== undefined) {
        u.left = anchors.left + lM;
        if (anchors.right !== undefined) {
          u.right = anchors.right - rM;
          this.$isUsingImplicitWidth = false;
          u.width = u.right - u.left;
          u.x = u.left - left;
          u.horizontalCenter = (u.right + u.left) / 2;
        } else if (anchors.horizontalCenter !== undefined) {
          u.horizontalCenter = anchors.horizontalCenter;
          this.$isUsingImplicitWidth = false;
          u.width = (u.horizontalCenter - u.left) * 2;
          u.x = u.left - left;
          u.right = 2 * u.horizontalCenter - u.left;
        } else {
          u.x = u.left - left;
          u.right = u.left + w;
          u.horizontalCenter = u.left + w / 2;
        }
      } else if (anchors.right !== undefined) {
        u.right = anchors.right - rM;
        if (anchors.horizontalCenter !== undefined) {
          u.horizontalCenter = anchors.horizontalCenter;
          this.$isUsingImplicitWidth = false;
          u.width = (u.right - u.horizontalCenter) * 2;
          u.x = 2 * u.horizontalCenter - u.right - left;
          u.left = 2 * u.horizontalCenter - u.right;
        } else {
          u.x = u.right - w - left;
          u.left = u.right - w;
          u.horizontalCenter = u.right - w / 2;
        }
      } else if (anchors.horizontalCenter !== undefined) {
        u.horizontalCenter = anchors.horizontalCenter;
        u.x = u.horizontalCenter - w / 2 - left;
        u.left = u.horizontalCenter - w / 2;
        u.right = u.horizontalCenter + w / 2;
      } else {
        if (this.parent) {
          var leftProp = this.parent.$properties.left;
          leftProp.changed.connect(this, this.$updateHGeometry, flags);
        }

        u.left = this.x + left;
        u.right = u.left + w;
        u.horizontalCenter = u.left + w / 2;
      }

      for (var key in u) {
        this[key] = u[key];
      }

      this.$updatingHGeometry = false;

      if (this.parent) this.$updateChildrenRect(this.parent);
    }
  }, {
    key: "$updateVGeometry",
    value: function $updateVGeometry(newVal, oldVal, propName) {
      var anchors = this.anchors || this;
      if (this.$updatingVGeometry) {
        return;
      }
      this.$updatingVGeometry = true;

      var flags = QmlWeb.Signal.UniqueConnection;
      var tM = anchors.topMargin || anchors.margins;
      var bM = anchors.bottomMargin || anchors.margins;
      var h = this.height;
      var top = this.parent ? this.parent.top : 0;

      // HeighttopProp
      if (propName === "height") {
        this.$isUsingImplicitHeight = false;
      }

      // Position TODO: Layouts

      var u = {}; // our update object

      if (anchors.fill !== undefined) {
        var fill = anchors.fill;
        var props = fill.$properties;
        props.top.changed.connect(this, this.$updateVGeometry, flags);
        props.bottom.changed.connect(this, this.$updateVGeometry, flags);
        props.height.changed.connect(this, this.$updateVGeometry, flags);

        this.$isUsingImplicitHeight = false;
        u.height = fill.height - tM - bM;
        u.y = fill.top - top + tM;
        u.top = fill.top + tM;
        u.bottom = fill.bottom - bM;
        u.verticalCenter = (u.top + u.bottom) / 2;
      } else if (anchors.centerIn !== undefined) {
        var verticalCenter = anchors.centerIn.$properties.verticalCenter;
        verticalCenter.changed.connect(this, this.$updateVGeometry, flags);

        u.verticalCenter = anchors.centerIn.verticalCenter;
        u.y = u.verticalCenter - h / 2 - top;
        u.top = u.verticalCenter - h / 2;
        u.bottom = u.verticalCenter + h / 2;
      } else if (anchors.top !== undefined) {
        u.top = anchors.top + tM;
        if (anchors.bottom !== undefined) {
          u.bottom = anchors.bottom - bM;
          this.$isUsingImplicitHeight = false;
          u.height = u.bottom - u.top;
          u.y = u.top - top;
          u.verticalCenter = (u.bottom + u.top) / 2;
        } else if ((u.verticalCenter = anchors.verticalCenter) !== undefined) {
          this.$isUsingImplicitHeight = false;
          u.height = (u.verticalCenter - u.top) * 2;
          u.y = u.top - top;
          u.bottom = 2 * u.verticalCenter - u.top;
        } else {
          u.y = u.top - top;
          u.bottom = u.top + h;
          u.verticalCenter = u.top + h / 2;
        }
      } else if (anchors.bottom !== undefined) {
        u.bottom = anchors.bottom - bM;
        if ((u.verticalCenter = anchors.verticalCenter) !== undefined) {
          this.$isUsingImplicitHeight = false;
          u.height = (u.bottom - u.verticalCenter) * 2;
          u.y = 2 * u.verticalCenter - u.bottom - top;
          u.top = 2 * u.verticalCenter - u.bottom;
        } else {
          u.y = u.bottom - h - top;
          u.top = u.bottom - h;
          u.verticalCenter = u.bottom - h / 2;
        }
      } else if (anchors.verticalCenter !== undefined) {
        u.verticalCenter = anchors.verticalCenter;
        u.y = u.verticalCenter - h / 2 - top;
        u.top = u.verticalCenter - h / 2;
        u.bottom = u.verticalCenter + h / 2;
      } else {
        if (this.parent) {
          var topProp = this.parent.$properties.top;
          topProp.changed.connect(this, this.$updateVGeometry, flags);
        }

        u.top = this.y + top;
        u.bottom = u.top + h;
        u.verticalCenter = u.top + h / 2;
      }

      for (var key in u) {
        this[key] = u[key];
      }

      this.$updatingVGeometry = false;

      if (this.parent) this.$updateChildrenRect(this.parent);
    }
  }, {
    key: "$updateChildrenRect",
    value: function $updateChildrenRect(component) {
      if (!component || !component.children || component.children.length === 0) {
        return;
      }
      var children = component.children;

      var maxWidth = 0;
      var maxHeight = 0;
      var minX = children.length > 0 ? children[0].x : 0;
      var minY = children.length > 0 ? children[0].y : 0;

      for (var i = 0; i < children.length; i++) {
        var child = children[i];
        maxWidth = Math.max(maxWidth, child.x + child.width);
        maxHeight = Math.max(maxHeight, child.y + child.heighth);
        minX = Math.min(minX, child.x);
        minY = Math.min(minX, child.y);
      }

      component.childrenRect.x = minX;
      component.childrenRect.y = minY;
      component.childrenRect.width = maxWidth;
      component.childrenRect.height = maxHeight;
    }
  }]);

  return _class31;
}());

QmlWeb.registerQmlType({
  module: "QtQuick",
  name: "ListElement",
  versions: /.*/,
  baseClass: "QtQml.QtObject"
}, function () {
  function _class32(meta) {
    _classCallCheck(this, _class32);

    QmlWeb.callSuper(this, meta);

    var createProperty = QmlWeb.createProperty;
    for (var i in meta.object) {
      if (i[0] !== "$") {
        createProperty("variant", this, i);
      }
    }
    QmlWeb.applyProperties(meta.object, this, this, this.$context);
  }

  return _class32;
}());

QmlWeb.registerQmlType({
  module: "QtQuick",
  name: "ListModel",
  versions: /.*/,
  baseClass: "QtQml.QtObject",
  properties: {
    count: "int",
    $items: "list"
  },
  defaultProperty: "$items"
}, function () {
  function _class33(meta) {
    var _this28 = this;

    _classCallCheck(this, _class33);

    QmlWeb.callSuper(this, meta);

    this.$firstItem = true;
    this.$itemsChanged.connect(this, this.$on$itemsChanged);
    this.$model = new QmlWeb.JSItemModel();
    this.$model.data = function (index, role) {
      return _this28.$items[index][role];
    };
    this.$model.rowCount = function () {
      return _this28.$items.length;
    };
  }

  _createClass(_class33, [{
    key: "$on$itemsChanged",
    value: function $on$itemsChanged(newVal) {
      this.count = this.$items.length;
      if (this.$firstItem && newVal.length > 0) {
        var QMLListElement = QmlWeb.getConstructor("QtQuick", "2.0", "ListElement");
        this.$firstItem = false;
        var roleNames = [];
        var dict = newVal[0];
        if (dict instanceof QMLListElement) {
          dict = dict.$properties;
        }
        for (var i in dict) {
          if (i !== "index") {
            roleNames.push(i);
          }
        }
        this.$model.setRoleNames(roleNames);
      }
    }
  }, {
    key: "append",
    value: function append(dict) {
      var index = this.$items.length;
      var c = 0;

      if (dict instanceof Array) {
        for (var key in dict) {
          this.$items.push(dict[key]);
          c++;
        }
      } else {
        this.$items.push(dict);
        c = 1;
      }

      this.$itemsChanged(this.$items);
      this.$model.rowsInserted(index, index + c);
    }
  }, {
    key: "clear",
    value: function clear() {
      this.$items.length = 0;
      this.count = 0;
      this.$model.modelReset();
    }
  }, {
    key: "get",
    value: function get(index) {
      return this.$items[index];
    }
  }, {
    key: "insert",
    value: function insert(index, dict) {
      this.$items.splice(index, 0, dict);
      this.$itemsChanged(this.$items);
      this.$model.rowsInserted(index, index + 1);
    }
  }, {
    key: "move",
    value: function move(from, to, n) {
      var vals = this.$items.splice(from, n);
      for (var i = 0; i < vals.length; i++) {
        this.$items.splice(to + i, 0, vals[i]);
      }
      this.$model.rowsMoved(from, from + n, to);
    }
  }, {
    key: "remove",
    value: function remove(index) {
      this.$items.splice(index, 1);
      this.$model.rowsRemoved(index, index + 1);
      this.count = this.$items.length;
    }
  }, {
    key: "set",
    value: function set(index, dict) {
      this.$items[index] = dict;
      this.$model.dataChanged(index, index);
    }
  }, {
    key: "setProperty",
    value: function setProperty(index, property, value) {
      this.$items[index][property] = value;
      this.$model.dataChanged(index, index);
    }
  }]);

  return _class33;
}());

QmlWeb.registerQmlType({
  module: "QtQuick",
  name: "ListView",
  versions: /.*/,
  baseClass: "Repeater",
  properties: {
    orientation: "enum",
    spacing: "real"
  }
}, function () {
  function _class34(meta) {
    _classCallCheck(this, _class34);

    QmlWeb.callSuper(this, meta);
    this.modelChanged.connect(this, this.$styleChanged);
    this.delegateChanged.connect(this, this.$styleChanged);
    this.orientationChanged.connect(this, this.$styleChanged);
    this.spacingChanged.connect(this, this.$styleChanged);
    this._childrenInserted.connect(this, this.$applyStyleOnItem);
  }

  _createClass(_class34, [{
    key: "container",
    value: function container() {
      return this;
    }
  }, {
    key: "$applyStyleOnItem",
    value: function $applyStyleOnItem($item) {
      var Qt = QmlWeb.Qt;
      $item.dom.style.position = "initial";
      if (this.orientation === Qt.Horizontal) {
        $item.dom.style.display = "inline-block";
        if ($item !== this.$items[0]) {
          $item.dom.style["margin-left"] = this.spacing + "px";
        }
      } else {
        $item.dom.style.display = "block";
        if ($item !== this.$items[0]) {
          $item.dom.style["margin-top"] = this.spacing + "px";
        }
      }
    }
  }, {
    key: "$styleChanged",
    value: function $styleChanged() {
      for (var i = 0; i < this.$items.length; ++i) {
        this.$applyStyleOnItem(this.$items[i]);
      }
    }
  }]);

  return _class34;
}());

QmlWeb.registerQmlType({
  module: "QtQuick",
  name: "Loader",
  versions: /.*/,
  baseClass: "Item",
  properties: {
    active: { type: "bool", initialValue: true },
    asynchronous: "bool",
    item: "var",
    progress: "real",
    source: "url",
    sourceComponent: "Component",
    status: { type: "enum", initialValue: 1 }
  },
  signals: {
    loaded: []
  }
}, function () {
  function _class35(meta) {
    _classCallCheck(this, _class35);

    QmlWeb.callSuper(this, meta);

    this.$sourceUrl = "";

    this.activeChanged.connect(this, this.$onActiveChanged);
    this.sourceChanged.connect(this, this.$onSourceChanged);
    this.sourceComponentChanged.connect(this, this.$onSourceComponentChanged);
    this.widthChanged.connect(this, this.$updateGeometry);
    this.heightChanged.connect(this, this.$updateGeometry);
  }

  _createClass(_class35, [{
    key: "$onActiveChanged",
    value: function $onActiveChanged() {
      if (!this.active) {
        this.$unload();
        return;
      }
      if (this.source) {
        this.$onSourceChanged(this.source);
      } else if (this.sourceComponent) {
        this.$onSourceComponentChanged(this.sourceComponent);
      }
    }
  }, {
    key: "$onSourceChanged",
    value: function $onSourceChanged(fileName) {
      // TODO
      // if (fileName == this.$sourceUrl && this.item !== undefined) return;
      if (!this.active) return;
      this.$unload();

      if (!fileName) {
        this.sourceComponent = null;
        this.$sourceUrl = fileName;
        return;
      }

      var tree = QmlWeb.engine.loadComponent(fileName);
      var QMLComponent = QmlWeb.getConstructor("QtQml", "2.0", "Component");
      var meta = { object: tree, context: this, parent: this };
      var qmlComponent = new QMLComponent(meta);
      qmlComponent.$basePath = QmlWeb.engine.extractBasePath(tree.$file);
      qmlComponent.$imports = tree.$imports;
      qmlComponent.$file = tree.$file;
      QmlWeb.engine.loadImports(tree.$imports, qmlComponent.$basePath, qmlComponent.importContextId);
      var loadedComponent = this.$createComponentObject(qmlComponent, this);
      this.sourceComponent = loadedComponent;
      this.$sourceUrl = fileName;
    }
  }, {
    key: "$onSourceComponentChanged",
    value: function $onSourceComponentChanged(newItem) {
      if (!this.active) return;
      this.$unload();

      if (!newItem) {
        this.item = null;
        return;
      }

      var QMLComponent = QmlWeb.getConstructor("QtQml", "2.0", "Component");
      var qmlComponent = newItem;
      if (newItem instanceof QMLComponent) {
        qmlComponent = newItem.$createObject(this, {}, this);
      }
      qmlComponent.parent = this;
      this.item = qmlComponent;
      this.$updateGeometry();
      if (this.item) {
        this.loaded();
      }
    }
  }, {
    key: "setSource",
    value: function setSource(url, options) {
      this.$sourceUrl = url;
      this.props = options;
      this.source = url;
    }
  }, {
    key: "$unload",
    value: function $unload() {
      if (!this.item) return;
      this.item.$delete();
      this.item.parent = undefined;
      this.item = undefined;
    }
  }, {
    key: "$callOnCompleted",
    value: function $callOnCompleted(child) {
      child.Component.completed();
      var QMLBaseObject = QmlWeb.getConstructor("QtQml", "2.0", "QtObject");
      for (var i = 0; i < child.$tidyupList.length; i++) {
        if (child.$tidyupList[i] instanceof QMLBaseObject) {
          this.$callOnCompleted(child.$tidyupList[i]);
        }
      }
    }
  }, {
    key: "$createComponentObject",
    value: function $createComponentObject(qmlComponent, parent) {
      var newComponent = qmlComponent.createObject(parent);
      qmlComponent.finalizeImports();
      if (QmlWeb.engine.operationState !== QmlWeb.QMLOperationState.Init) {
        // We don't call those on first creation, as they will be called
        // by the regular creation-procedures at the right time.
        QmlWeb.engine.$initializePropertyBindings();
        this.$callOnCompleted(newComponent);
      }
      return newComponent;
    }
  }, {
    key: "$updateGeometry",
    value: function $updateGeometry() {
      // Loader size doesn't exist
      if (!this.width) {
        this.width = this.item ? this.item.width : 0;
      } else if (this.item) {
        // Loader size exists
        this.item.width = this.width;
      }

      if (!this.height) {
        this.height = this.item ? this.item.height : 0;
      } else if (this.item) {
        // Loader size exists
        this.item.height = this.height;
      }
    }
  }]);

  return _class35;
}());

QmlWeb.registerQmlType({
  module: "QtQuick",
  name: "MouseArea",
  versions: /.*/,
  baseClass: "Item",
  properties: {
    acceptedButtons: { type: "variant", initialValue: 1 }, // Qt.LeftButton
    enabled: { type: "bool", initialValue: true },
    hoverEnabled: "bool",
    mouseX: "real",
    mouseY: "real",
    pressed: "bool",
    containsMouse: "bool",
    pressedButtons: { type: "variant", initialValue: 0 },
    cursorShape: "enum" // Qt.ArrowCursor
  },
  signals: {
    clicked: [{ type: "variant", name: "mouse" }],
    entered: [],
    exited: [],
    positionChanged: [{ type: "variant", name: "mouse" }]
  }
}, function () {
  function _class36(meta) {
    var _this29 = this;

    _classCallCheck(this, _class36);

    QmlWeb.callSuper(this, meta);

    this.dom.style.pointerEvents = "all";

    // IE does not handle mouse clicks to transparent divs, so we have
    // to set a background color and make it invisible using opacity
    // as that doesn't affect the mouse handling.
    this.dom.style.backgroundColor = "white";
    this.dom.style.opacity = 0;

    this.cursorShapeChanged.connect(this, this.$onCursorShapeChanged);

    this.dom.addEventListener("click", function (e) {
      return _this29.$handleClick(e);
    });
    this.dom.addEventListener("contextmenu", function (e) {
      return _this29.$handleClick(e);
    });
    var handleMouseUp = function handleMouseUp() {
      _this29.pressed = false;
      _this29.pressedButtons = 0;
      document.removeEventListener("mouseup", handleMouseUp);
    };
    this.dom.addEventListener("mousedown", function (e) {
      if (!_this29.enabled) return;
      var mouse = _this29.$eventToMouse(e);
      _this29.mouseX = mouse.x;
      _this29.mouseY = mouse.y;
      _this29.pressed = true;
      _this29.pressedButtons = mouse.button;
      document.addEventListener("mouseup", handleMouseUp);
    });
    this.dom.addEventListener("mouseover", function () {
      _this29.containsMouse = true;
      _this29.entered();
    });
    this.dom.addEventListener("mouseout", function () {
      _this29.containsMouse = false;
      _this29.exited();
    });
    this.dom.addEventListener("mousemove", function (e) {
      if (!_this29.enabled || !_this29.hoverEnabled && !_this29.pressed) return;
      var mouse = _this29.$eventToMouse(e);
      _this29.mouseX = mouse.x;
      _this29.mouseY = mouse.y;
      _this29.positionChanged(mouse);
    });
  }

  _createClass(_class36, [{
    key: "$onCursorShapeChanged",
    value: function $onCursorShapeChanged() {
      this.dom.style.cursor = this.$cursorShapeToCSS();
    }
  }, {
    key: "$handleClick",
    value: function $handleClick(e) {
      var mouse = this.$eventToMouse(e);
      if (this.enabled && this.acceptedButtons & mouse.button) {
        this.clicked(mouse);
      }
      // This decides whether to show the browser's context menu on right click or
      // not
      return !(this.acceptedButtons & QmlWeb.Qt.RightButton);
    }
  }, {
    key: "$eventToMouse",
    value: function $eventToMouse(e) {
      var Qt = QmlWeb.Qt;
      return {
        accepted: true,
        button: e.button === 0 ? Qt.LeftButton : e.button === 1 ? Qt.MiddleButton : e.button === 2 ? Qt.RightButton : 0,
        modifiers: e.ctrlKey * Qt.CtrlModifier | e.altKey * Qt.AltModifier | e.shiftKey * Qt.ShiftModifier | e.metaKey * Qt.MetaModifier,
        x: e.offsetX || e.layerX,
        y: e.offsetY || e.layerY
      };
    }

    // eslint-disable-next-line complexity

  }, {
    key: "$cursorShapeToCSS",
    value: function $cursorShapeToCSS() {
      var Qt = QmlWeb.Qt;
      switch (this.cursorShape) {
        case Qt.ArrowCursor:
          return "default";
        case Qt.UpArrowCursor:
          return "n-resize";
        case Qt.CrossCursor:
          return "crosshair";
        case Qt.WaitCursor:
          return "wait";
        case Qt.IBeamCursor:
          return "text";
        case Qt.SizeVerCursor:
          return "ew-resize";
        case Qt.SizeHorCursor:
          return "ns-resize";
        case Qt.SizeBDiagCursor:
          return "nesw-resize";
        case Qt.SizeFDiagCursor:
          return "nwse-resize";
        case Qt.SizeAllCursor:
          return "all-scroll";
        case Qt.BlankCursor:
          return "none";
        case Qt.SplitVCursor:
          return "row-resize";
        case Qt.SplitHCursor:
          return "col-resize";
        case Qt.PointingHandCursor:
          return "pointer";
        case Qt.ForbiddenCursor:
          return "not-allowed";
        case Qt.WhatsThisCursor:
          return "help";
        case Qt.BusyCursor:
          return "progress";
        case Qt.OpenHandCursor:
          return "grab";
        case Qt.ClosedHandCursor:
          return "grabbing";
        case Qt.DragCopyCursor:
          return "copy";
        case Qt.DragMoveCursor:
          return "move";
        case Qt.DragLinkCursor:
          return "alias";
        //case Qt.BitmapCursor: return "auto";
        //case Qt.CustomCursor: return "auto";
      }
      return "auto";
    }
  }]);

  return _class36;
}());

QmlWeb.registerQmlType({
  module: "QtQuick",
  name: "NumberAnimation",
  versions: /.*/,
  baseClass: "PropertyAnimation"
}, function () {
  function _class37(meta) {
    var _this30 = this;

    _classCallCheck(this, _class37);

    QmlWeb.callSuper(this, meta);

    this.$at = 0;
    this.$loop = 0;

    QmlWeb.engine.$addTicker(function () {
      return _this30.$ticker.apply(_this30, arguments);
    });
    this.runningChanged.connect(this, this.$onRunningChanged);
  }

  _createClass(_class37, [{
    key: "$startLoop",
    value: function $startLoop() {
      for (var i in this.$actions) {
        var _action3 = this.$actions[i];
        _action3.from = _action3.from !== undefined ? _action3.from : _action3.target[_action3.property];
      }
      this.$at = 0;
    }
  }, {
    key: "$ticker",
    value: function $ticker(now, elapsed) {
      if (!this.running && this.$loop !== -1 || this.paused) {
        // $loop === -1 is a marker to just finish this run
        return;
      }
      if (this.$at === 0 && this.$loop === 0 && !this.$actions.length) {
        this.$redoActions();
      }
      this.$at += elapsed / this.duration;
      if (this.$at >= 1) {
        this.complete();
        return;
      }
      for (var i in this.$actions) {
        var _action4 = this.$actions[i];
        var value = _action4.from + (_action4.to - _action4.from) * this.easing.$valueForProgress(this.$at);
        var property = _action4.target.$properties[_action4.property];
        property.set(value, QmlWeb.QMLProperty.ReasonAnimation);
      }
    }
  }, {
    key: "$onRunningChanged",
    value: function $onRunningChanged(newVal) {
      if (newVal) {
        this.$startLoop();
        this.paused = false;
      } else if (this.alwaysRunToEnd && this.$at < 1) {
        this.$loop = -1; // -1 is used as a marker to stop
      } else {
        this.$loop = 0;
        this.$actions = [];
      }
    }
  }, {
    key: "complete",
    value: function complete() {
      for (var i in this.$actions) {
        var _action5 = this.$actions[i];
        var property = _action5.target.$properties[_action5.property];
        property.set(_action5.to, QmlWeb.QMLProperty.ReasonAnimation);
      }
      this.$loop++;
      if (this.$loop === this.loops) {
        this.running = false;
      } else if (!this.running) {
        this.$actions = [];
      } else {
        this.$startLoop(this);
      }
    }
  }]);

  return _class37;
}());

QmlWeb.registerQmlType({
  module: "QtQuick",
  name: "ParallelAnimation",
  versions: /.*/,
  baseClass: "Animation",
  enums: {
    Animation: { Infinite: Math.Infinite }
  },
  properties: {
    animations: "list"
  },
  defaultProperty: "animations"
}, function () {
  function _class38(meta) {
    var _this31 = this;

    _classCallCheck(this, _class38);

    QmlWeb.callSuper(this, meta);

    this.$runningAnimations = 0;

    this.animationsChanged.connect(this, this.$onAnimationsChanged);

    QmlWeb.engine.$registerStart(function () {
      if (!_this31.running) return;
      self.running = false; // toggled back by start();
      self.start();
    });
    QmlWeb.engine.$registerStop(function () {
      return _this31.stop();
    });
  }

  _createClass(_class38, [{
    key: "$onAnimationsChanged",
    value: function $onAnimationsChanged() {
      var flags = QmlWeb.Signal.UniqueConnection;
      for (var i = 0; i < this.animations.length; i++) {
        var animation = this.animations[i];
        animation.runningChanged.connect(this, this.$animationFinished, flags);
      }
    }
  }, {
    key: "$animationFinished",
    value: function $animationFinished(newVal) {
      this.$runningAnimations += newVal ? 1 : -1;
      if (this.$runningAnimations === 0) {
        this.running = false;
      }
    }
  }, {
    key: "start",
    value: function start() {
      if (this.running) return;
      this.running = true;
      for (var i = 0; i < this.animations.length; i++) {
        this.animations[i].start();
      }
    }
  }, {
    key: "stop",
    value: function stop() {
      if (!this.running) return;
      for (var i = 0; i < this.animations.length; i++) {
        this.animations[i].stop();
      }
      this.running = false;
    }
  }, {
    key: "complete",
    value: function complete() {
      this.stop();
    }
  }]);

  return _class38;
}());

QmlWeb.registerQmlType({
  module: "QtQuick",
  name: "Positioner",
  versions: /.*/,
  baseClass: "Item",
  properties: {
    spacing: "int"
  }
}, function () {
  function _class39(meta) {
    _classCallCheck(this, _class39);

    QmlWeb.callSuper(this, meta);

    this.childrenChanged.connect(this, this.$onChildrenChanged);
    this.spacingChanged.connect(this, this.layoutChildren);
    this.childrenChanged.connect(this, this.layoutChildren);
    this.layoutChildren();
  }

  _createClass(_class39, [{
    key: "$onChildrenChanged",
    value: function $onChildrenChanged() {
      var flags = QmlWeb.Signal.UniqueConnection;
      for (var i = 0; i < this.children.length; i++) {
        var child = this.children[i];
        child.widthChanged.connect(this, this.layoutChildren, flags);
        child.heightChanged.connect(this, this.layoutChildren, flags);
        child.visibleChanged.connect(this, this.layoutChildren, flags);
      }
    }
  }]);

  return _class39;
}());

QmlWeb.registerQmlType({
  module: "QtQuick",
  name: "PropertyAnimation",
  versions: /.*/,
  baseClass: "Animation",
  properties: {
    duration: { type: "int", initialValue: 250 },
    from: "real",
    to: "real",
    properties: "string",
    property: "string",
    target: "QtObject",
    targets: "list"
  }
}, function () {
  function _class40(meta) {
    _classCallCheck(this, _class40);

    QmlWeb.callSuper(this, meta);

    var createProperty = QmlWeb.createProperty;
    this.easing = new QmlWeb.QObject(this);
    createProperty("enum", this.easing, "type", { initialValue: this.Easing.Linear });
    createProperty("real", this.easing, "amplitude", { initialValue: 1 });
    createProperty("real", this.easing, "overshoot", { initialValue: 1.70158 });
    createProperty("real", this.easing, "period", { initialValue: 0.3 });

    this.easing.$valueForProgress = function (t) {
      return QmlWeb.$ease(this.type, this.period, this.amplitude, this.overshoot, t);
    };

    this.$props = [];
    this.$targets = [];
    this.$actions = [];

    this.targetChanged.connect(this, this.$redoTargets);
    this.targetsChanged.connect(this, this.$redoTargets);
    this.propertyChanged.connect(this, this.$redoProperties);
    this.propertiesChanged.connect(this, this.$redoProperties);

    if (meta.object.$on !== undefined) {
      this.property = meta.object.$on;
      this.target = this.$parent;
    }
  }

  _createClass(_class40, [{
    key: "$redoActions",
    value: function $redoActions() {
      this.$actions = [];
      for (var i = 0; i < this.$targets.length; i++) {
        for (var j in this.$props) {
          this.$actions.push({
            target: this.$targets[i],
            property: this.$props[j],
            from: this.from,
            to: this.to
          });
        }
      }
    }
  }, {
    key: "$redoProperties",
    value: function $redoProperties() {
      this.$props = this.properties.split(",");

      // Remove whitespaces
      for (var i = 0; i < this.$props.length; i++) {
        var matches = this.$props[i].match(/\w+/);
        if (matches) {
          this.$props[i] = matches[0];
        } else {
          this.$props.splice(i, 1);
          i--;
        }
      }
      // Merge properties and property
      if (this.property && this.$props.indexOf(this.property) === -1) {
        this.$props.push(this.property);
      }
    }
  }, {
    key: "$redoTargets",
    value: function $redoTargets() {
      this.$targets = this.targets.slice();
      if (this.target && this.$targets.indexOf(this.target) === -1) {
        this.$targets.push(this.target);
      }
    }
  }]);

  return _class40;
}());

QmlWeb.registerQmlType({
  module: "QtQuick",
  name: "PropertyChanges",
  versions: /.*/,
  baseClass: "QtQml.QtObject",
  properties: {
    target: "QtObject",
    explicit: "bool",
    restoreEntryValues: { type: "bool", initialValue: true }
  }
}, function () {
  function _class41(meta) {
    _classCallCheck(this, _class41);

    QmlWeb.callSuper(this, meta);

    this.$actions = [];
  }

  _createClass(_class41, [{
    key: "$setCustomData",
    value: function $setCustomData(property, value) {
      this.$actions.push({ property: property, value: value });
    }
  }]);

  return _class41;
}());

QmlWeb.registerQmlType({
  module: "QtQuick",
  name: "Rectangle",
  versions: /.*/,
  baseClass: "Item",
  properties: {
    color: { type: "color", initialValue: "white" },
    radius: "real"
  }
}, function () {
  function _class42(meta) {
    _classCallCheck(this, _class42);

    QmlWeb.callSuper(this, meta);

    var createProperty = QmlWeb.createProperty;
    this.border = new QmlWeb.QObject(this);
    createProperty("color", this.border, "color", { initialValue: "black" });
    createProperty("int", this.border, "width", { initialValue: 1 });
    this.$borderActive = false;

    var bg = this.impl = document.createElement("div");
    bg.style.pointerEvents = "none";
    bg.style.position = "absolute";
    bg.style.left = bg.style.right = bg.style.top = bg.style.bottom = "0px";
    bg.style.borderWidth = "0px";
    bg.style.borderStyle = "solid";
    bg.style.borderColor = "black";
    bg.style.backgroundColor = "white";
    this.dom.appendChild(bg);

    this.colorChanged.connect(this, this.$onColorChanged);
    this.radiusChanged.connect(this, this.$onRadiusChanged);
    this.border.colorChanged.connect(this, this.border$onColorChanged);
    this.border.widthChanged.connect(this, this.border$onWidthChanged);
    this.widthChanged.connect(this, this.$updateBorder);
    this.heightChanged.connect(this, this.$updateBorder);
  }

  _createClass(_class42, [{
    key: "$onColorChanged",
    value: function $onColorChanged(newVal) {
      this.impl.style.backgroundColor = new QmlWeb.QColor(newVal);
    }
  }, {
    key: "border$onColorChanged",
    value: function border$onColorChanged(newVal) {
      this.$borderActive = true;
      this.impl.style.borderColor = new QmlWeb.QColor(newVal);
      this.$updateBorder();
    }
  }, {
    key: "border$onWidthChanged",
    value: function border$onWidthChanged() {
      this.$borderActive = true;
      this.$updateBorder();
    }
  }, {
    key: "$onRadiusChanged",
    value: function $onRadiusChanged(newVal) {
      this.impl.style.borderRadius = newVal + "px";
    }
  }, {
    key: "$updateBorder",
    value: function $updateBorder() {
      var border = this.$borderActive ? Math.max(0, this.border.width) : 0;
      var style = this.impl.style;
      if (border * 2 > this.width || border * 2 > this.height) {
        // Border is covering the whole background
        style.borderWidth = "0px";
        style.borderTopWidth = this.height + "px";
      } else {
        style.borderWidth = border + "px";
      }
    }
  }]);

  return _class42;
}());

QmlWeb.registerQmlType({
  module: "QtQuick",
  name: "RegExpValidator",
  versions: /.*/,
  baseClass: "Item",
  properties: {
    regExp: "var"
  }
}, function () {
  function _class43(meta) {
    _classCallCheck(this, _class43);

    QmlWeb.callSuper(this, meta);
  }

  _createClass(_class43, [{
    key: "validate",
    value: function validate(string) {
      if (!this.regExp) return true;
      return this.regExp.test(string);
    }
  }]);

  return _class43;
}());

QmlWeb.registerQmlType({
  module: "QtQuick",
  name: "Repeater",
  versions: /.*/,
  baseClass: "Item",
  properties: {
    delegate: "Component",
    model: { type: "variant", initialValue: 0 },
    count: "int"
  },
  signals: {
    _childrenInserted: []
  },
  defaultProperty: "delegate"
}, function () {
  function _class44(meta) {
    _classCallCheck(this, _class44);

    QmlWeb.callSuper(this, meta);

    this.parent = meta.parent;
    // TODO: some (all ?) of the components including Repeater needs to know own
    // parent at creation time. Please consider this major change.

    this.$completed = false;
    this.$items = []; // List of created items

    this.modelChanged.connect(this, this.$onModelChanged);
    this.delegateChanged.connect(this, this.$onDelegateChanged);
    this.parentChanged.connect(this, this.$onParentChanged);
  }

  _createClass(_class44, [{
    key: "container",
    value: function container() {
      return this.parent;
    }
  }, {
    key: "itemAt",
    value: function itemAt(index) {
      return this.$items[index];
    }
  }, {
    key: "$onModelChanged",
    value: function $onModelChanged() {
      this.$applyModel();
    }
  }, {
    key: "$onDelegateChanged",
    value: function $onDelegateChanged() {
      this.$applyModel();
    }
  }, {
    key: "$onParentChanged",
    value: function $onParentChanged() {
      this.$applyModel();
    }
  }, {
    key: "$getModel",
    value: function $getModel() {
      var QMLListModel = QmlWeb.getConstructor("QtQuick", "2.0", "ListModel");
      return this.model instanceof QMLListModel ? this.model.$model : this.model;
    }
  }, {
    key: "$applyModel",
    value: function $applyModel() {
      if (!this.delegate || !this.parent) {
        return;
      }
      var model = this.$getModel();
      if (model instanceof QmlWeb.JSItemModel) {
        var flags = QmlWeb.Signal.UniqueConnection;
        model.dataChanged.connect(this, this.$_onModelDataChanged, flags);
        model.rowsInserted.connect(this, this.$_onRowsInserted, flags);
        model.rowsMoved.connect(this, this.$_onRowsMoved, flags);
        model.rowsRemoved.connect(this, this.$_onRowsRemoved, flags);
        model.modelReset.connect(this, this.$_onModelReset, flags);

        this.$removeChildren(0, this.$items.length);
        this.$insertChildren(0, model.rowCount());
      } else if (typeof model === "number") {
        if (this.$items.length > model) {
          // have more than we need
          this.$removeChildren(model, this.$items.length);
        } else {
          // need more
          this.$insertChildren(this.$items.length, model);
        }
      } else if (model instanceof Array) {
        this.$removeChildren(0, this.$items.length);
        this.$insertChildren(0, model.length);
      }
      this.count = this.$items.length;
    }
  }, {
    key: "$callOnCompleted",
    value: function $callOnCompleted(child) {
      child.Component.completed();
      var QMLBaseObject = QmlWeb.getConstructor("QtQml", "2.0", "QtObject");
      for (var i = 0; i < child.$tidyupList.length; i++) {
        if (child.$tidyupList[i] instanceof QMLBaseObject) {
          this.$callOnCompleted(child.$tidyupList[i]);
        }
      }
    }
  }, {
    key: "$_onModelDataChanged",
    value: function $_onModelDataChanged(startIndex, endIndex, roles) {
      var model = this.$getModel();
      var roleNames = roles || model.roleNames;
      for (var index = startIndex; index <= endIndex; index++) {
        var _item3 = this.$items[index];
        for (var i in roleNames) {
          _item3.$properties[roleNames[i]].set(model.data(index, roleNames[i]), QmlWeb.QMLProperty.ReasonInit, _item3, this.model.$context);
        }
      }
    }
  }, {
    key: "$_onRowsInserted",
    value: function $_onRowsInserted(startIndex, endIndex) {
      this.$insertChildren(startIndex, endIndex);
      this.count = this.$items.length;
    }
  }, {
    key: "$_onRowsMoved",
    value: function $_onRowsMoved(sourceStartIndex, sourceEndIndex, destinationIndex) {
      var vals = this.$items.splice(sourceStartIndex, sourceEndIndex - sourceStartIndex);
      for (var i = 0; i < vals.length; i++) {
        this.$items.splice(destinationIndex + i, 0, vals[i]);
      }
      var smallestChangedIndex = sourceStartIndex < destinationIndex ? sourceStartIndex : destinationIndex;
      for (var _i11 = smallestChangedIndex; _i11 < this.$items.length; _i11++) {
        this.$items[_i11].index = _i11;
      }
    }
  }, {
    key: "$_onRowsRemoved",
    value: function $_onRowsRemoved(startIndex, endIndex) {
      this.$removeChildren(startIndex, endIndex);
      for (var i = startIndex; i < this.$items.length; i++) {
        this.$items[i].index = i;
      }
      this.count = this.$items.length;
    }
  }, {
    key: "$_onModelReset",
    value: function $_onModelReset() {
      this.$applyModel();
    }
  }, {
    key: "$insertChildren",
    value: function $insertChildren(startIndex, endIndex) {
      if (endIndex <= 0) {
        this.count = 0;
        return;
      }

      var QMLOperationState = QmlWeb.QMLOperationState;
      var createProperty = QmlWeb.createProperty;
      var model = this.$getModel();
      var index = void 0;
      for (index = startIndex; index < endIndex; index++) {
        var newItem = this.delegate.$createObject(this.parent);
        createProperty("int", newItem, "index", { initialValue: index });

        // To properly import JavaScript in the context of a component
        this.delegate.finalizeImports();

        if (typeof model === "number" || model instanceof Array) {
          if (typeof newItem.$properties.modelData === "undefined") {
            createProperty("variant", newItem, "modelData");
          }
          var value = model instanceof Array ? model[index] : typeof model === "number" ? index : "undefined";
          newItem.$properties.modelData.set(value, QmlWeb.QMLProperty.ReasonInit, newItem, model.$context);
        } else {
          for (var i = 0; i < model.roleNames.length; i++) {
            var roleName = model.roleNames[i];
            if (typeof newItem.$properties[roleName] === "undefined") {
              createProperty("variant", newItem, roleName);
            }
            newItem.$properties[roleName].set(model.data(index, roleName), QmlWeb.QMLProperty.ReasonInit, newItem, this.model.$context);
          }
        }

        this.$items.splice(index, 0, newItem);

        // parent must be set after the roles have been added to newItem scope in
        // case we are outside of QMLOperationState.Init and parentChanged has
        // any side effects that result in those roleNames being referenced.
        newItem.parent = this.parent;

        // TODO debug this. Without check to Init, Completed sometimes called
        // twice.. But is this check correct?
        if (QmlWeb.engine.operationState !== QMLOperationState.Init && QmlWeb.engine.operationState !== QMLOperationState.Idle) {
          // We don't call those on first creation, as they will be called
          // by the regular creation-procedures at the right time.
          this.$callOnCompleted(newItem);
        }
      }
      if (QmlWeb.engine.operationState !== QMLOperationState.Init) {
        // We don't call those on first creation, as they will be called
        // by the regular creation-procedures at the right time.
        QmlWeb.engine.$initializePropertyBindings();
      }

      if (index > 0) {
        this.container().childrenChanged();
      }

      for (var _i12 = endIndex; _i12 < this.$items.length; _i12++) {
        this.$items[_i12].index = _i12;
      }
    }
  }, {
    key: "$removeChildren",
    value: function $removeChildren(startIndex, endIndex) {
      var removed = this.$items.splice(startIndex, endIndex - startIndex);
      for (var index in removed) {
        removed[index].$delete();
        this.$removeChildProperties(removed[index]);
      }
    }
  }, {
    key: "$removeChildProperties",
    value: function $removeChildProperties(child) {
      var signals = QmlWeb.engine.completedSignals;
      signals.splice(signals.indexOf(child.Component.completed), 1);
      for (var i = 0; i < child.children.length; i++) {
        this.$removeChildProperties(child.children[i]);
      }
    }
  }]);

  return _class44;
}());

QmlWeb.registerQmlType({
  module: "QtQuick",
  name: "Rotation",
  versions: /.*/,
  baseClass: "QtQml.QtObject",
  properties: {
    angle: "real"
  }
}, function () {
  function _class45(meta) {
    _classCallCheck(this, _class45);

    QmlWeb.callSuper(this, meta);

    var createProperty = QmlWeb.createProperty;

    this.axis = new QmlWeb.QObject(this);
    createProperty("real", this.axis, "x");
    createProperty("real", this.axis, "y");
    createProperty("real", this.axis, "z", { initialValue: 1 });

    this.origin = new QmlWeb.QObject(this);
    createProperty("real", this.origin, "x");
    createProperty("real", this.origin, "y");

    this.angleChanged.connect(this.$parent, this.$parent.$updateTransform);
    this.axis.xChanged.connect(this.$parent, this.$parent.$updateTransform);
    this.axis.yChanged.connect(this.$parent, this.$parent.$updateTransform);
    this.axis.zChanged.connect(this.$parent, this.$parent.$updateTransform);
    this.origin.xChanged.connect(this, this.$updateOrigin);
    this.origin.yChanged.connect(this, this.$updateOrigin);
    this.$parent.$updateTransform();
  }

  _createClass(_class45, [{
    key: "$updateOrigin",
    value: function $updateOrigin() {
      var style = this.$parent.dom.style;
      style.transformOrigin = this.origin.x + "px " + this.origin.y + "px";
      style.webkitTransformOrigin = this.origin.x + "px " + this.origin.y + "px";
    }
  }]);

  return _class45;
}());

QmlWeb.registerQmlType({
  module: "QtQuick",
  name: "Row",
  versions: /.*/,
  baseClass: "Positioner",
  properties: {
    layoutDirection: "enum"
  }
}, function () {
  function _class46(meta) {
    _classCallCheck(this, _class46);

    QmlWeb.callSuper(this, meta);

    this.layoutDirectionChanged.connect(this, this.layoutChildren);
    this.layoutChildren();
  }

  _createClass(_class46, [{
    key: "layoutChildren",
    value: function layoutChildren() {
      var curPos = 0;
      var maxHeight = 0;
      // When layoutDirection is RightToLeft we need oposite order
      var i = this.layoutDirection === 1 ? this.children.length - 1 : 0;
      var endPoint = this.layoutDirection === 1 ? -1 : this.children.length;
      var step = this.layoutDirection === 1 ? -1 : 1;
      for (; i !== endPoint; i += step) {
        var child = this.children[i];
        if (!(child.visible && child.width && child.height)) {
          continue;
        }
        maxHeight = child.height > maxHeight ? child.height : maxHeight;

        child.x = curPos;
        curPos += child.width + this.spacing;
      }
      this.implicitHeight = maxHeight;
      // We want no spacing at the right side
      this.implicitWidth = curPos - this.spacing;
    }
  }]);

  return _class46;
}());

QmlWeb.registerQmlType({
  module: "QtQuick",
  name: "Scale",
  versions: /.*/,
  baseClass: "QtQml.QtObject",
  properties: {
    xScale: "real",
    yScale: "real"
  }
}, function () {
  function _class47(meta) {
    _classCallCheck(this, _class47);

    QmlWeb.callSuper(this, meta);

    var createProperty = QmlWeb.createProperty;
    this.origin = new QmlWeb.QObject(this);
    createProperty("real", this.origin, "x");
    createProperty("real", this.origin, "y");

    this.xScaleChanged.connect(this.$parent, this.$parent.$updateTransform);
    this.yScaleChanged.connect(this.$parent, this.$parent.$updateTransform);
    this.origin.xChanged.connect(this, this.$updateOrigin);
    this.origin.yChanged.connect(this, this.$updateOrigin);

    /* QML default origin is top-left, while CSS default origin is centre, so
     * $updateOrigin must be called to set the initial transformOrigin. */
    this.$updateOrigin();
  }

  _createClass(_class47, [{
    key: "$updateOrigin",
    value: function $updateOrigin() {
      var style = this.$parent.dom.style;
      style.transformOrigin = this.origin.x + "px " + this.origin.y + "px";
      style.webkitTransformOrigin = this.origin.x + "px " + this.origin.y + "px";
    }
  }]);

  return _class47;
}());

QmlWeb.registerQmlType({
  module: "QtQuick",
  name: "SequentialAnimation",
  versions: /.*/,
  baseClass: "Animation",
  properties: {
    animations: "list"
  },
  defaultProperty: "animations"
}, function () {
  function _class48(meta) {
    var _this32 = this;

    _classCallCheck(this, _class48);

    QmlWeb.callSuper(this, meta);

    this.animationsChanged.connect(this, this.$onAnimatonsChanged);

    QmlWeb.engine.$registerStart(function () {
      if (!_this32.running) return;
      _this32.running = false; // toggled back by start();
      _this32.start();
    });
    QmlWeb.engine.$registerStop(function () {
      return self.stop();
    });
  }

  _createClass(_class48, [{
    key: "$onAnimatonsChanged",
    value: function $onAnimatonsChanged() {
      var flags = QmlWeb.Signal.UniqueConnection;
      for (var i = 0; i < this.animations.length; i++) {
        var animation = this.animations[i];
        animation.runningChanged.connect(this, this.$nextAnimation, flags);
      }
    }
  }, {
    key: "$nextAnimation",
    value: function $nextAnimation(proceed) {
      if (this.running && !proceed) {
        this.$curIndex++;
        if (this.$curIndex < this.animations.length) {
          var anim = this.animations[this.$curIndex];
          console.log("nextAnimation", this, this.$curIndex, anim);
          anim.start();
        } else {
          this.$passedLoops++;
          if (this.$passedLoops >= this.loops) {
            this.complete();
          } else {
            this.$curIndex = -1;
            this.$nextAnimation();
          }
        }
      }
    }
  }, {
    key: "start",
    value: function start() {
      if (this.running) return;
      this.running = true;
      this.$curIndex = -1;
      this.$passedLoops = 0;
      this.$nextAnimation();
    }
  }, {
    key: "stop",
    value: function stop() {
      if (!this.running) return;
      this.running = false;
      if (this.$curIndex < this.animations.length) {
        this.animations[this.$curIndex].stop();
      }
    }
  }, {
    key: "complete",
    value: function complete() {
      if (!this.running) return;
      if (this.$curIndex < this.animations.length) {
        // Stop current animation
        this.animations[this.$curIndex].stop();
      }
      this.running = false;
    }
  }]);

  return _class48;
}());

QmlWeb.registerQmlType({
  module: "QtQuick",
  name: "State",
  versions: /.*/,
  baseClass: "QtQml.QtObject",
  properties: {
    name: "string",
    changes: "list",
    extend: "string",
    when: "bool"
  },
  defaultProperty: "changes"
}, function () {
  function _class49(meta) {
    _classCallCheck(this, _class49);

    QmlWeb.callSuper(this, meta);

    this.$item = this.$parent;

    this.whenChanged.connect(this, this.$onWhenChanged);
  }

  _createClass(_class49, [{
    key: "$getAllChanges",
    value: function $getAllChanges() {
      var _this33 = this;

      if (this.extend) {
        /* ECMAScript 2015. TODO: polyfill Array?
        const base = this.$item.states.find(state => state.name === this.extend);
        */
        var states = this.$item.states;
        var base = states.filter(function (state) {
          return state.name === _this33.extend;
        })[0];
        if (base) {
          return base.$getAllChanges().concat(this.changes);
        }
        console.error("Can't find the state to extend!");
      }
      return this.changes;
    }
  }, {
    key: "$onWhenChanged",
    value: function $onWhenChanged(newVal) {
      if (newVal) {
        this.$item.state = this.name;
      } else if (this.$item.state === this.name) {
        this.$item.state = "";
      }
    }
  }]);

  return _class49;
}());

var platformsDetectors = [
//{ name: "W8", regexp: /Windows NT 6\.2/ },
//{ name: "W7", regexp: /Windows NT 6\.1/ },
//{ name: "Windows", regexp: /Windows NT/ },
{ name: "OSX", regexp: /Macintosh/ }];

var systemPalettes = {};

QmlWeb.registerQmlType({
  module: "QtQuick",
  name: "SystemPalette",
  versions: /.*/,
  baseClass: "QtQml.QtObject",
  enums: {
    SystemPalette: {
      Active: "active", Inactive: "inactive", Disabled: "disabled"
    }
  },
  properties: {
    alternateBase: { type: "color", readOnly: true },
    base: { type: "color", readOnly: true },
    button: { type: "color", readOnly: true },
    buttonText: { type: "color", readOnly: true },
    dark: { type: "color", readOnly: true },
    highlight: { type: "color", readOnly: true },
    highlightedText: { type: "color", readOnly: true },
    light: { type: "color", readOnly: true },
    mid: { type: "color", readOnly: true },
    midlight: { type: "color", readOnly: true },
    shadow: { type: "color", readOnly: true },
    text: { type: "color", readOnly: true },
    window: { type: "color", readOnly: true },
    windowText: { type: "color", readOnly: true },

    colorGroup: "enum"
  }
}, function () {
  function _class50(meta) {
    _classCallCheck(this, _class50);

    QmlWeb.callSuper(this, meta);

    this.colorGroupChanged.connect(this, this.$onColorGroupChanged);

    this.$platform = "OSX";
    // Detect OS
    for (var i = 0; i < platformsDetectors.length; ++i) {
      if (platformsDetectors[i].regexp.test(navigator.userAgent)) {
        this.$platform = platformsDetectors[i].name;
        break;
      }
    }
  }

  _createClass(_class50, [{
    key: "$onColorGroupChanged",
    value: function $onColorGroupChanged(newVal) {
      var _this34 = this;

      var pallete = systemPalettes[this.$platform][newVal];
      this.$canEditReadOnlyProperties = true;
      Object.keys(pallete).forEach(function (key) {
        _this34[key] = pallete[key];
      });
      delete this.$canEditReadOnlyProperties;
    }
  }]);

  return _class50;
}());

systemPalettes.OSX = {
  active: {
    alternateBase: "#f6f6f6",
    base: "#ffffff",
    button: "#ededed",
    buttonText: "#000000",
    dark: "#bfbfbf",
    highlight: "#fbed73",
    highlightText: "#000000",
    light: "#ffffff",
    mid: "#a9a9a9",
    midlight: "#f6f6f6",
    shadow: "#8b8b8b",
    text: "#000000",
    window: "#ededed",
    windowText: "#000000"
  },
  inactive: {
    alternateBase: "#f6f6f6",
    base: "#ffffff",
    button: "#ededed",
    buttonText: "#000000",
    dark: "#bfbfbf",
    highlight: "#d0d0d0",
    highlightText: "#000000",
    light: "#ffffff",
    mid: "#a9a9a9",
    midlight: "#f6f6f6",
    shadow: "#8b8b8b",
    text: "#000000",
    window: "#ededed",
    windowText: "#000000"
  },
  disabled: {
    alternateBase: "#f6f6f6",
    base: "#ededed",
    button: "#ededed",
    buttonText: "#949494",
    dark: "#bfbfbf",
    highlight: "#d0d0d0",
    highlightText: "#7f7f7f",
    light: "#ffffff",
    mid: "#a9a9a9",
    midlight: "#f6f6f6",
    shadow: "#8b8b8b",
    text: "#7f7f7f",
    window: "#ededed",
    windowText: "#7f7f7f"
  }
};

QmlWeb.systemPalettes = systemPalettes;
QmlWeb.platformsDetectors = platformsDetectors;

QmlWeb.registerQmlType({
  module: "QtQuick",
  name: "Text",
  versions: /.*/,
  baseClass: "Item",
  enums: {
    Text: {
      NoWrap: 0, WordWrap: 1, WrapAnywhere: 2, Wrap: 3,
      WrapAtWordBoundaryOrAnywhere: 4,
      AlignLeft: 1, AlignRight: 2, AlignHCenter: 4, AlignJustify: 8,
      AlignTop: 32, AlignBottom: 64, AlignVCenter: 128,
      Normal: 0, Outline: 1, Raised: 2, Sunken: 3
    }
  },
  properties: {
    color: { type: "color", initialValue: "black" },
    text: "string",
    lineHeight: "real",
    wrapMode: { type: "enum", initialValue: 0 }, // Text.NoWrap
    horizontalAlignment: { type: "enum", initialValue: 1 }, // Text.AlignLeft
    style: "enum",
    styleColor: "color"
  }
}, function () {
  function _class51(meta) {
    _classCallCheck(this, _class51);

    QmlWeb.callSuper(this, meta);

    var fc = this.impl = document.createElement("span");
    fc.style.pointerEvents = "none";
    fc.style.width = "100%";
    fc.style.height = "100%";
    fc.style.whiteSpace = "pre";
    this.dom.style.textAlign = "left";
    this.dom.appendChild(fc);

    var QMLFont = QmlWeb.getConstructor("QtQuick", "2.0", "Font");
    this.font = new QMLFont(this);

    this.colorChanged.connect(this, this.$onColorChanged);
    this.textChanged.connect(this, this.$onTextChanged);
    this.lineHeightChanged.connect(this, this.$onLineHeightChanged);
    this.wrapModeChanged.connect(this, this.$onWrapModeChanged);
    this.horizontalAlignmentChanged.connect(this, this.$onHorizontalAlignmentChanged);
    this.styleChanged.connect(this, this.$onStyleChanged);
    this.styleColorChanged.connect(this, this.$onStyleColorChanged);

    this.font.family = "sans-serif";
    this.font.pointSize = 10;

    this.widthChanged.connect(this, this.$onWidthChanged);

    this.font.boldChanged.connect(this, this.$onFontChanged);
    this.font.weightChanged.connect(this, this.$onFontChanged);
    this.font.pixelSizeChanged.connect(this, this.$onFontChanged);
    this.font.pointSizeChanged.connect(this, this.$onFontChanged);
    this.font.familyChanged.connect(this, this.$onFontChanged);
    this.font.letterSpacingChanged.connect(this, this.$onFontChanged);
    this.font.wordSpacingChanged.connect(this, this.$onFontChanged);

    this.Component.completed.connect(this, this.Component$onCompleted);
  }

  _createClass(_class51, [{
    key: "$onColorChanged",
    value: function $onColorChanged(newVal) {
      this.impl.style.color = new QmlWeb.QColor(newVal);
    }
  }, {
    key: "$onTextChanged",
    value: function $onTextChanged(newVal) {
      this.impl.innerHTML = newVal;
      this.$updateImplicit();
    }
  }, {
    key: "$onWidthChanged",
    value: function $onWidthChanged() {
      this.$updateImplicit();
    }
  }, {
    key: "$onLineHeightChanged",
    value: function $onLineHeightChanged(newVal) {
      this.impl.style.lineHeight = newVal + "px";
      this.$updateImplicit();
    }
  }, {
    key: "$onStyleChanged",
    value: function $onStyleChanged(newVal) {
      this.$updateShadow(newVal, this.styleColor);
    }
  }, {
    key: "$onStyleColorChanged",
    value: function $onStyleColorChanged(newVal) {
      this.$updateShadow(this.style, new QmlWeb.QColor(newVal));
    }
  }, {
    key: "$onWrapModeChanged",
    value: function $onWrapModeChanged(newVal) {
      var style = this.impl.style;
      switch (newVal) {
        case this.Text.NoWrap:
          style.whiteSpace = "pre";
          break;
        case this.Text.WordWrap:
          style.whiteSpace = "pre-wrap";
          style.wordWrap = "normal";
          break;
        case this.Text.WrapAnywhere:
          style.whiteSpace = "pre-wrap";
          style.wordBreak = "break-all";
          break;
        case this.Text.Wrap:
        case this.Text.WrapAtWordBoundaryOrAnywhere:
          style.whiteSpace = "pre-wrap";
          style.wordWrap = "break-word";
      }
      this.$updateJustifyWhiteSpace();
    }
  }, {
    key: "$onHorizontalAlignmentChanged",
    value: function $onHorizontalAlignmentChanged(newVal) {
      var textAlign = null;
      switch (newVal) {
        case this.Text.AlignLeft:
          textAlign = "left";
          break;
        case this.Text.AlignRight:
          textAlign = "right";
          break;
        case this.Text.AlignHCenter:
          textAlign = "center";
          break;
        case this.Text.AlignJustify:
          textAlign = "justify";
          break;
      }
      this.dom.style.textAlign = textAlign;
      this.$updateJustifyWhiteSpace();
    }
  }, {
    key: "$onFontChanged",
    value: function $onFontChanged() {
      this.$updateImplicit();
    }
  }, {
    key: "Component$onCompleted",
    value: function Component$onCompleted() {
      this.$updateImplicit();
    }
  }, {
    key: "$updateImplicit",
    value: function $updateImplicit() {
      if (!this.text || !this.dom) {
        this.implicitHeight = this.implicitWidth = 0;
        return;
      }
      var fc = this.impl;
      // Need to move the child out of it's parent so that it can properly
      // recalculate it's "natural" offsetWidth/offsetHeight
      if (this.$isUsingImplicitWidth) {
        document.body.appendChild(fc);
      }
      var height = fc.offsetHeight;
      var width = fc.offsetWidth;
      if (this.$isUsingImplicitWidth) {
        this.dom.appendChild(fc);
      }

      this.implicitHeight = height;
      this.implicitWidth = width;
    }
  }, {
    key: "$updateShadow",
    value: function $updateShadow(textStyle, styleColor) {
      var style = this.impl.style;
      switch (textStyle) {
        case 0:
          style.textShadow = "none";
          break;
        case 1:
          style.textShadow = ["1px 0 0 " + styleColor, "-1px 0 0 " + styleColor, "0 1px 0 " + styleColor, "0 -1px 0 " + styleColor].join(",");
          break;
        case 2:
          style.textShadow = "1px 1px 0 " + styleColor;
          break;
        case 3:
          style.textShadow = "-1px -1px 0 " + styleColor;
          break;
      }
    }
  }, {
    key: "$updateJustifyWhiteSpace",
    value: function $updateJustifyWhiteSpace() {
      var style = this.impl.style;
      // AlignJustify doesn't work with pre/pre-wrap, so we decide the lesser of
      // the two evils to be ignoring "\n"s inside the text.
      if (this.horizontalAlignment === this.Text.AlignJustify) {
        style.whiteSpace = "normal";
      }
      this.$updateImplicit();
    }
  }]);

  return _class51;
}());

QmlWeb.registerQmlType({
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
}, function () {
  function _class52(meta) {
    var _this35 = this;

    _classCallCheck(this, _class52);

    QmlWeb.callSuper(this, meta);

    var QMLFont = QmlWeb.getConstructor("QtQuick", "2.0", "Font");
    this.font = new QMLFont(this);

    // Undo / Redo stacks;
    this.undoStack = [];
    this.undoStackPosition = -1;
    this.redoStack = [];
    this.redoStackPosition = -1;

    var textarea = this.impl = document.createElement("textarea");
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

    this.impl.addEventListener("input", function () {
      return _this35.$updateValue();
    });
  }

  _createClass(_class52, [{
    key: "append",
    value: function append(text) {
      this.text += text;
    }
  }, {
    key: "copy",
    value: function copy() {
      // TODO
    }
  }, {
    key: "cut",
    value: function cut() {
      this.text = this.text(0, this.selectionStart) + this.text(this.selectionEnd, this.text.length);
      // TODO
    }
  }, {
    key: "deselect",
    value: function deselect() {
      //this.selectionStart = -1;
      //this.selectionEnd = -1;
      //this.selectedText = null;
      // TODO
    }
  }, {
    key: "getFormattedText",
    value: function getFormattedText(start, end) {
      var text = this.text.slice(start, end);
      // TODO
      // process text
      return text;
    }
  }, {
    key: "getText",
    value: function getText(start, end) {
      return this.text.slice(start, end);
    }
  }, {
    key: "insert",
    value: function insert() /*position, text*/{
      // TODO
    }
  }, {
    key: "isRightToLeft",
    value: function isRightToLeft() /*start, end*/{
      // TODO
    }
  }, {
    key: "linkAt",
    value: function linkAt() /*x, y*/{
      // TODO
    }
  }, {
    key: "moveCursorSelection",
    value: function moveCursorSelection() /*x, y*/{
      // TODO
    }
  }, {
    key: "paste",
    value: function paste() {
      // TODO
    }
  }, {
    key: "positionAt",
    value: function positionAt() /*x, y*/{
      // TODO
    }
  }, {
    key: "positionToRectangle",
    value: function positionToRectangle() /*position*/{
      // TODO
    }
  }, {
    key: "redo",
    value: function redo() {
      // TODO
    }
  }, {
    key: "remove",
    value: function remove() /*start, end*/{
      // TODO
    }
  }, {
    key: "select",
    value: function select() /*start, end*/{
      // TODO
    }
  }, {
    key: "selectAll",
    value: function selectAll() {
      // TODO
    }
  }, {
    key: "selectWord",
    value: function selectWord() {
      // TODO
    }
  }, {
    key: "undo",
    value: function undo() {
      // TODO
    }
  }, {
    key: "Component$onCompleted",
    value: function Component$onCompleted() {
      this.selectByKeyboard = !this.readOnly;
      this.$updateValue();
      this.implicitWidth = this.offsetWidth;
      this.implicitHeight = this.offsetHeight;
    }
  }, {
    key: "$onTextChanged",
    value: function $onTextChanged(newVal) {
      this.impl.value = newVal;
    }
  }, {
    key: "$onColorChanged",
    value: function $onColorChanged(newVal) {
      this.impl.style.color = newVal;
    }
  }, {
    key: "$updateValue",
    value: function $updateValue() {
      if (this.text !== this.impl.value) {
        this.text = this.impl.value;
      }
      this.length = this.text.length;
      this.lineCount = this.$getLineCount();
      this.$updateCss();
    }
    // Transfer dom style to firstChild,
    // then clear corresponding dom style

  }, {
    key: "$updateCss",
    value: function $updateCss() {
      var supported = ["border", "borderRadius", "borderWidth", "borderColor", "backgroundColor"];
      var style = this.impl.style;
      for (var n = 0; n < supported.length; n++) {
        var o = supported[n];
        var v = this.css[o];
        if (v) {
          style[o] = v;
          this.css[o] = null;
        }
      }
    }
  }, {
    key: "$getLineCount",
    value: function $getLineCount() {
      return this.text.split(/\n/).length;
    }
  }]);

  return _class52;
}());

QmlWeb.registerQmlType({
  module: "QtQuick",
  name: "TextInput",
  versions: /.*/,
  baseClass: "Item",
  enums: {
    TextInput: { Normal: 0, Password: 1, NoEcho: 2, PasswordEchoOnEdit: 3 }
  },
  properties: {
    text: "string",
    maximumLength: { type: "int", initialValue: -1 },
    readOnly: "bool",
    validator: "var",
    echoMode: "enum" // TextInput.Normal
  },
  signals: {
    accepted: []
  }
}, function () {
  function _class53(meta) {
    var _this36 = this;

    _classCallCheck(this, _class53);

    QmlWeb.callSuper(this, meta);

    var QMLFont = QmlWeb.getConstructor("QtQuick", "2.0", "Font");
    this.font = new QMLFont(this);

    var input = this.impl = document.createElement("input");
    input.type = "text";
    input.disabled = true;
    input.style.pointerEvents = "auto";
    // In some browsers text-inputs have a margin by default, which distorts
    // the positioning, so we need to manually set it to 0.
    input.style.margin = "0";
    input.style.padding = "0";
    input.style.width = "100%";
    input.style.height = "100%";
    this.dom.appendChild(input);
    this.setupFocusOnDom(input);
    input.disabled = false;

    this.Component.completed.connect(this, this.Component$onCompleted);
    this.textChanged.connect(this, this.$onTextChanged);
    this.echoModeChanged.connect(this, this.$onEchoModeChanged);
    this.maximumLengthChanged.connect(this, this.$onMaximumLengthChanged);
    this.readOnlyChanged.connect(this, this.$onReadOnlyChanged);
    this.Keys.pressed.connect(this, this.Keys$onPressed);

    this.impl.addEventListener("input", function () {
      return _this36.$updateValue();
    });
  }

  _createClass(_class53, [{
    key: "Component$onCompleted",
    value: function Component$onCompleted() {
      this.implicitWidth = this.impl.offsetWidth;
      this.implicitHeight = this.impl.offsetHeight;
    }
  }, {
    key: "$onTextChanged",
    value: function $onTextChanged(newVal) {
      // We have to check if value actually changes.
      // If we do not have this check, then after user updates text input
      // following occurs: user updates gui text -> updateValue gets called ->
      // textChanged gets called -> gui value updates again -> caret position
      // moves to the right!
      if (this.impl.value !== newVal) {
        this.impl.value = newVal;
      }
    }
  }, {
    key: "$onEchoModeChanged",
    value: function $onEchoModeChanged(newVal) {
      var TextInput = this.TextInput;
      var input = this.impl;
      switch (newVal) {
        case TextInput.Normal:
          input.type = "text";
          break;
        case TextInput.Password:
          input.type = "password";
          break;
        case TextInput.NoEcho:
          // Not supported, use password, that's nearest
          input.type = "password";
          break;
        case TextInput.PasswordEchoOnEdit:
          // Not supported, use password, that's nearest
          input.type = "password";
          break;
      }
    }
  }, {
    key: "$onMaximumLengthChanged",
    value: function $onMaximumLengthChanged(newVal) {
      this.impl.maxLength = newVal < 0 ? null : newVal;
    }
  }, {
    key: "$onReadOnlyChanged",
    value: function $onReadOnlyChanged(newVal) {
      this.impl.disabled = newVal;
    }
  }, {
    key: "Keys$onPressed",
    value: function Keys$onPressed(e) {
      var Qt = QmlWeb.Qt;
      var submit = e.key === Qt.Key_Return || e.key === Qt.Key_Enter;
      if (submit && this.$testValidator()) {
        this.accepted();
        e.accepted = true;
      }
    }
  }, {
    key: "$testValidator",
    value: function $testValidator() {
      if (this.validator) {
        return this.validator.validate(this.text);
      }
      return true;
    }
  }, {
    key: "$updateValue",
    value: function $updateValue() {
      if (this.text !== this.impl.value) {
        this.$canEditReadOnlyProperties = true;
        this.text = this.impl.value;
        this.$canEditReadOnlyProperties = false;
      }
    }
  }]);

  return _class53;
}());

QmlWeb.registerQmlType({
  module: "QtQuick",
  name: "Transition",
  versions: /.*/,
  baseClass: "QtQml.QtObject",
  properties: {
    animations: "list",
    from: { type: "string", initialValue: "*" },
    to: { type: "string", initialValue: "*" },
    reversible: "bool"
  },
  defaultProperty: "animations"
}, function () {
  function _class54(meta) {
    _classCallCheck(this, _class54);

    QmlWeb.callSuper(this, meta);

    this.$item = this.$parent;
  }

  _createClass(_class54, [{
    key: "$start",
    value: function $start(actions) {
      for (var i = 0; i < this.animations.length; i++) {
        var animation = this.animations[i];
        animation.$actions = [];
        var $targets = animation.$targets,
            $props = animation.$props,
            $actions = animation.$actions;

        for (var j in actions) {
          var _action6 = actions[j];
          if (($targets.length === 0 || $targets.indexOf(_action6.target) !== -1) && ($props.length === 0 || $props.indexOf(_action6.property) !== -1)) {
            $actions.push(_action6);
          }
        }
        animation.start();
      }
    }
  }, {
    key: "$stop",
    value: function $stop() {
      for (var i = 0; i < this.animations.length; i++) {
        this.animations[i].stop();
      }
    }
  }]);

  return _class54;
}());

QmlWeb.registerQmlType({
  module: "QtQuick",
  name: "Translate",
  versions: /.*/,
  baseClass: "QtQml.QtObject",
  properties: {
    x: "real",
    y: "real"
  }
}, function () {
  function _class55(meta) {
    _classCallCheck(this, _class55);

    QmlWeb.callSuper(this, meta);

    this.xChanged.connect(this.$parent, this.$parent.$updateTransform);
    this.yChanged.connect(this.$parent, this.$parent.$updateTransform);
  }

  return _class55;
}());

// WARNING: Can have wrong behavior if url is changed while the socket is in
// Connecting state.
// TODO: Recheck everything.

QmlWeb.registerQmlType({
  module: "QtWebSockets",
  name: "WebSocket",
  versions: /.*/,
  baseClass: "QtQml.QtObject",
  enums: {
    WebSocket: { Connecting: 0, Open: 1, Closing: 2, Closed: 3, Error: 4 }
  },
  properties: {
    active: "bool",
    status: { type: "enum", initialValue: 3 }, // WebSocket.Closed
    errorString: "string",
    url: "url"
  },
  signals: {
    textMessageReceived: [{ type: "string", name: "message" }]
  }
}, function () {
  function _class56(meta) {
    _classCallCheck(this, _class56);

    QmlWeb.callSuper(this, meta);

    this.$socket = undefined;
    this.$reconnect = false;

    this.statusChanged.connect(this, this.$onStatusChanged);
    this.activeChanged.connect(this, this.$reconnectSocket);
    this.urlChanged.connect(this, this.$reconnectSocket);
  }

  _createClass(_class56, [{
    key: "$onStatusChanged",
    value: function $onStatusChanged(status) {
      if (status !== this.WebSocket.Error) {
        this.errorString = "";
      }
    }
  }, {
    key: "$connectSocket",
    value: function $connectSocket() {
      var _this37 = this;

      this.$reconnect = false;

      if (!this.url || !this.active) {
        return;
      }

      this.status = this.WebSocket.Connecting;
      this.$socket = new WebSocket(this.url);
      this.$socket.onopen = function () {
        _this37.status = _this37.WebSocket.Open;
      };
      this.$socket.onclose = function () {
        _this37.status = _this37.WebSocket.Closed;
        if (_this37.$reconnect) {
          _this37.$connectSocket();
        }
      };
      this.$socket.onerror = function (error) {
        _this37.errorString = error.message;
        _this37.status = _this37.WebSocket.Error;
      };
      this.$socket.onmessage = function (message) {
        _this37.textMessageReceived(message.data);
      };
    }
  }, {
    key: "$reconnectSocket",
    value: function $reconnectSocket() {
      this.$reconnect = true;
      if (this.status === this.WebSocket.Open) {
        this.status = this.WebSocket.Closing;
        this.$socket.close();
      } else if (this.status !== this.WebSocket.Closing) {
        this.$connectSocket();
      }
    }
  }, {
    key: "sendTextMessage",
    value: function sendTextMessage(message) {
      if (this.status === this.WebSocket.Open) {
        this.$socket.send(message);
      }
    }
  }]);

  return _class56;
}());
}(typeof global != "undefined" ? global : window));

//# sourceMappingURL=qt.js.map
