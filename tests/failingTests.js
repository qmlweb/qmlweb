window.failingTests = {
  Render: {
    Async: [
      'NumberAnimationAutorun'
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
      'works when named signal',
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
