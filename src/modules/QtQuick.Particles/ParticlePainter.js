QmlWeb.registerQmlType({
  module: "QtQuick.Particles",
  name: "ParticlePainter",
  versions: /^2\./,
  baseClass: "QtQuick.Item",
  properties: {
    groups: "list",
    system: "ParticleSystem"
  }
}, class {
  constructor(meta) {
    QmlWeb.callSuper(this, meta);
  }
});
