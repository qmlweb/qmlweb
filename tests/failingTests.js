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
    properties: [
      "alias to id with same name",
      "ChangedExpressionSignal"
    ],
    scope: [
      "object id should override same-named property of base object"
    ]
  },
  QtQuick: {
    Timer: [
      "can roughly set short intervals" // flaky
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
