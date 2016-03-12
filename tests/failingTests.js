window.failingTests = {
  Render: {
    Async: [
      //TODO: failing tests not always working...
      'NumberAnimationAutorun',
      'Image',
      'NumberAnimation'
    ],
    Simple: [
      'RectangleBorderChildren',
      'RectanglesOpacity',
      'AnchorChains'
    ]
  },
  QMLEngine: {
    parse: [
      'can parse a function assigned to a var property'
    ],
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
