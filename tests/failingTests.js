window.failingTests = {
  Render: {
    Async: [
      'NumberAnimationAutorun'
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
    scope: [
      'can reference parent items id'
    ]
  },
  QtQuick: {
    Translate: ["can be loaded"],
    Scale: ["can be loaded"],
    Rotation: ["can be loaded"]
    
  }



};
