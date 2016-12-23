QmlWeb.registerQmlType({
  module: "QtQuick.Particles",
  name: "CustomParticle",
  versions: /^2\./,
  baseClass: "ParticlePainter",
  properties: {
    fragmentShader: "string",
    vertexShader: "string"
  }
}, class {
  constructor(meta) {
    QmlWeb.callSuper(this, meta);

    // TODO
  }
});
