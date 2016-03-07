window.failingTests = {
  Render: {
    Async: [
      'NumberAnimationAutorun'
    ],
    Simple: [
      'RectangleBorderChildren',
      'RectanglesOpacity'
    ]
  },
  QMLEngine: {
    imports: [
      'Javascript',
      'RecursiveInit',
      'RecursiveInit2'
    ],
    properties: [
      'alias have changed signal',
      'alias to id with same name',
      'StringConversion',
      'undefined property has undefined value'
    ]
  },
  Initialize: {
    QtQuick: [
      'Translate',
      'Scale',
      'Rotation',
      'Font',
      'AnimatedImage'
    ]
  }
};
