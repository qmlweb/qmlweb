window.failingTests = {
  Render: {
    Async: [
      'NumberAnimationAutorun', 'Image'
    ],
    Simple: [
      'RectanglesOpacity',
      'RepeaterNumber'
    ],
  },
  QMLEngine: {
    imports: [
      'Javascript'
    ],
  },
  Initialize: {
    "QtQuick-Translate": ["can be loaded"],
    "QtQuick-Scale": ["can be loaded"],
    "QtQuick-Rotation": ["can be loaded"],
    "QtQuick-Font": ["can be loaded"],
    "QtQuick-AnimatedImage": ["can be loaded"],
  }
};
