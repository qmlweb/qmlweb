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
    scope: [
      'can reference parent items id'
    ]
  },
  Initialize: {
    Translate: ["can be loaded"],
    Scale: ["can be loaded"],
    Rotation: ["can be loaded"],
    Font: ["can be loaded"],
    AnimatedImage: ["can be loaded"],
  }
};
