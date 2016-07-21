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
  Initialize: {
    QtQuick: [
      "Translate",
      "Scale",
      "Rotation",
      "Font"
    ]
  }
};
