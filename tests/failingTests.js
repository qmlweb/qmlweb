window.failingTests = {
  Render: {
    Async: [
      'NumberAnimationAutorun',
      'Image',
      'NumberAnimation'
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
  QtQuick: {
    Text: [
      'Render TextBasic'
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
