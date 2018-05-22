window.failingTests = {
  Render: {
    Simple: [
      "RectangleImplicitSize"
    ]
  },
  QMLEngine: {
    basic: [
      "SignalDisconnect"
    ],
    imports: [
      "Qmldir singleton"
    ],
    properties: [
      "Property and signal can have the same names",
      "Property and signal can have the same names(reverse order)"
    ],
    scope: [
      "object id should override same-named property of base object"
    ]
  },
  QtQml: {
    Binding: [
      "binding undefined var"
    ]
  },
  QtQuick: {
    Timer: [
      "can roughly set short intervals" // flaky
    ],
    Repeater: [
      "handle delegate property and role name conflict"
    ]
  },
  Initialize: {
    QtQuick: [
      "Translate",
      "Scale",
      "Rotation",
      "Font"
    ]
  }
};
