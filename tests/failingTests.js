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
    imports: [
      'Javascript',
      'RecursiveInit',
      'RecursiveInit2'
    ],
    properties: [
      'alias have changed signal',
      'alias to id with same name'
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
