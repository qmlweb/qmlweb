QmlWeb.registerQmlType({
  module: "QtQuick",
  name: "ShaderEffect",
  versions: /.*/,
  baseClass: "Item",
  enums: {
    ShaderEffect: {
      NoCulling: 0, BackFaceCulling: 1, FrontFaceCulling: 2,
      Compiled: 0, Uncompiled: 1, Error: 2
    }
  },
  properties: {
    blending: { type: "bool", initialValue: true },
    cullMode: "enum", // ShaderEffect.NoCulling
    fragmentShader: "string",
    log: "string",
    mesh: "var",
    status: { type: "enum", initialValue: 1 }, // ShaderEffect.Uncompiled
    supportsAtlasTextures: "bool",
    vertexShader: "string"
  }
}, class {
  constructor(meta) {
    QmlWeb.callSuper(this, meta);

    // TODO
  }
});
