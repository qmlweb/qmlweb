QmlWeb.registerQmlType({
  module: "QtQuick.Particles",
  name: "AngleDirection",
  versions: /^2\./,
  baseClass: "Direction",
  properties: {
    angle: "real",
    angleVariation: "real",
    magnitude: "real",
    magnitudeVariation: "real"
  }
}, class {
  constructor(meta) {
    QmlWeb.callSuper(this, meta);
  }
});
