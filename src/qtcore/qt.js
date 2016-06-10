global.Qt = {
  rgba: function(r,g,b,a) {
    return "rgba("
      + Math.round(r * 255) + ","
      + Math.round(g * 255) + ","
      + Math.round(b * 255) + ","
      + a + ")";
  },
  hsla: function(h,s,l,a) {
    return "hsla("
      + Math.round(h * 360) + ","
      + Math.round(s * 100) + "%,"
      + Math.round(l * 100) + "%,"
      + a + ")";
  },
  openUrlExternally: function(url) {
    page = window.open(url, '_blank');
    page.focus();
  },
  // Load file, parse and construct as Component (.qml)
  createComponent: function(name) {
    if (name in engine.components)
        return engine.components[name];

    var nameIsUrl = name.indexOf("//") >= 0 || name.indexOf(":/") >= 0; // e.g. // in protocol, or :/ in disk urls (D:/)

    // Do not perform path lookups if name starts with @ sign.
    // This is used when we load components from qmldir files
    // because in that case we do not need any lookups.
    var origName = name;
    if (name.length > 0 && name[0] == "@") {
      nameIsUrl = true;
      name = name.substr( 1,name.length-1 );
    }

    var file = nameIsUrl ? name : engine.$basePath + name;

    var src = getUrlContents(file, true);
    // if failed to load, and provided name is not direct url, try to load from dirs in importPathList()
    if (src==false && !nameIsUrl) {
      var moredirs = engine.importPathList();

      for (var i=0; i<moredirs.length; i++) {
        file = moredirs[i] + name;
        src = getUrlContents(file, true);
        if (src !== false) break;
      }
    }

    // When createComponent failed to load content from all probable sources, it should return undefined.
    if (src === false)
      return undefined;

    var tree = parseQML(src, file);

    if (tree.$children.length !== 1)
        console.error("A QML component must only contain one root element!");

    var component = new QMLComponent({ object: tree, context: _executionContext });
    component.$basePath = engine.extractBasePath( file );
    component.$imports = tree.$imports;
    component.$file = file; // just for debugging

    engine.loadImports( tree.$imports,component.$basePath );

    engine.components[origName] = component;
    return component;
  },

  createQmlObject: function(src, parent, file) {
        var tree = parseQML(src, file);

        // Create and initialize objects

        var component = new QMLComponent({ object: tree, parent: parent, context: _executionContext });

        engine.loadImports( tree.$imports );

        if (!file) file = Qt.resolvedUrl("createQmlObject_function");
        component.$basePath = engine.extractBasePath(file);
        component.$imports = tree.$imports; // for later use
        component.$file = file; // not just for debugging, but for basepath too, see above

        var obj = component.createObject(parent);
        obj.parent = parent;
        parent.childrenChanged();

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
  resolvedUrl: function(url)
  {
    if (!url || !url.substr) // url is not a string object
      return url;

    // Must check for cases: D:/, file://, http://, or slash at the beginning. 
    // This means the url is absolute => we have to skip processing (except removing dot segments).
    if (url == "" || url.indexOf(":/") != -1 || url.indexOf("/") == 0)
      return engine.removeDotSegments( url );

    // we have $basePath variable placed in context of "current" document
    // this is done in construct() function

    // let's go to the callers and inspect their arguments
    // The 2-nd argument of the callers we hope is context object
    // e.g. see calling signature of bindings and signals

    var detectedBasePath = "";
    var currentCaller = Qt.resolvedUrl.caller;
    var maxcount = 10;
    while (maxcount-- > 0 && currentCaller) {
      if (currentCaller.arguments[1] && currentCaller.arguments[1]["$basePath"])
      {
        detectedBasePath = currentCaller.arguments[1]["$basePath"];
        break;
      }
      currentCaller = currentCaller.caller;
    }

    return engine.removeDotSegments( detectedBasePath + url )
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
  Key_F1: 112, Key_F2: 113, Key_F3: 114, Key_F4: 115, Key_F5: 116, Key_F6: 117, Key_F7: 118, Key_F8: 119, Key_F9: 120, Key_F10: 121, Key_F11: 122, Key_F12: 123, Key_F13: 124, Key_F14: 125, Key_F15: 126, Key_F16: 127, Key_F17: 128, Key_F18: 129, Key_F19: 130, Key_F20: 131, Key_F21: 132, Key_F22: 133, Key_F23: 134, Key_F24: 135, Key_F25: 0, Key_F26: 0, Key_F27: 0, Key_F28: 0, Key_F29: 0, Key_F30: 0, Key_F31: 0, Key_F32: 0, Key_F33: 0, Key_F34: 0, Key_F35: 0,
  Key_Super_L: 0,
  Key_Super_R: 0,
  Key_Menu: 0,
  Key_Hyper_L: 0,
  Key_Hyper_R: 0,
  Key_Help: 6,
  Key_Direction_L: 0,
  Key_Direction_R: 0,
  Key_Space: 32,
  Key_Any:   32,
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
  Key_0: 48, Key_1: 49, Key_2: 50, Key_3: 51, Key_4: 52, Key_5: 53, Key_6: 54, Key_7: 55, Key_8: 56, Key_9: 57,
  Key_Colon: 58,
  Key_Semicolon: 59,
  Key_Less: 60,
  Key_Equal: 61,
  Key_Greater: 62,
  Key_Question: 63,
  Key_At: 64,
  Key_A: 65, Key_B: 66, Key_C: 67, Key_D: 68, Key_E: 69, Key_F: 70, Key_G: 71, Key_H: 72, Key_I: 73, Key_J: 74, Key_K: 75, Key_L: 76, Key_M: 77, Key_N: 78, Key_O: 79, Key_P: 80, Key_Q: 81, Key_R: 82, Key_S: 83, Key_T: 84, Key_U: 85, Key_V: 86, Key_W: 87, Key_X: 88, Key_Y: 89, Key_Z: 90,
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
}
