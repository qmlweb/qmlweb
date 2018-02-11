// eslint-disable-next-line no-undef
class QtQuick_ShaderEffectSource extends QtQuick_Item {
  static enums = {
    ShaderEffectSource: {
      Alpha: 0x6406, RGB: 0x6407, RGBA: 0x6408,
      NoMirroring: 0, MirrorHorizontally: 1, MirrorVertically: 2,
      ClampToEdge: 0, RepeatHorizontally: 1, RepeatVertically: 2, Repeat: 3
    }
  };
  static properties = {
    format: { type: "enum", initialValue: 0x6408 }, // ShaderEffectSource.RGBA
    hideSource: "bool",
    live: { type: "bool", initialValue: true },
    mipmap: "bool",
    recursive: "bool",
    sourceItem: "Item",
    sourceRect: "rect",
    textureMirroring: { type: "enum", initialValue: 2 }, // MirrorVertically
    textureSize: "size",
    wrapMode: "enum" // ShaderEffectSource.ClampToEdge
  };

  // TODO

  scheduleUpdate() {
    // TODO
  }
}
