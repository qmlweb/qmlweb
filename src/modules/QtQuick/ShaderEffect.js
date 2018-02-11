// eslint-disable-next-line no-undef
class QtQuick_ShaderEffect extends QtQuick_Item {
  static enums = {
    ShaderEffect: {
      NoCulling: 0, BackFaceCulling: 1, FrontFaceCulling: 2,
      Compiled: 0, Uncompiled: 1, Error: 2
    }
  };
  static properties = {
    blending: { type: "bool", initialValue: true },
    cullMode: "enum", // ShaderEffect.NoCulling
    fragmentShader: "string",
    log: "string",
    mesh: "var",
    status: { type: "enum", initialValue: 1 }, // ShaderEffect.Uncompiled
    supportsAtlasTextures: "bool",
    vertexShader: "string"
  };

  // TODO
}
