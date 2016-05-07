window.failingTests = {
  Render: {
    Async: [
      'NumberAnimationAutorun'
    ],
    Simple: [
      'RectanglesOpacity'
    ]
  },
  QMLEngine: {
    parse: [
      'can parse a function assigned to a var property'
    ],
    imports: [
      'RecursiveInit',
      'RecursiveInit2'
    ],
    properties: [
      'alias to id with same name',
      'ChangedExpressionSignal',
      'StringConversion'
    ],
    scope: [
      'object id should override same-named property of base object'
    ]
  },
  Initialize: {
    QtQuick: [
      'Translate',
      'Scale',
      'Rotation',
      'Font'
    ]
  }
};
