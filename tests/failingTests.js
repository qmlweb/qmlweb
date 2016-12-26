window.failingTests = {
  Render: {
    Async: [
      "NumberAnimationAutorun"
    ]
  },
  QMLEngine: {
    basic: [
      "SignalDisconnect"
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
