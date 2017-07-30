QmlWeb.registerQmlType(class Animator {
  static module = "QtQuick";
  static versions = /^2\./;
  static baseClass = "Animation";
  static properties = {
    duration: { type: "int", initialValue: 250 },
    from: "real",
    target: "Item",
    to: "real"
  };

  constructor(meta) {
    QmlWeb.callSuper(this, meta);

    this.easing = new QmlWeb.QObject(this);
    QmlWeb.createProperties(this.easing, {
      type: { type: "enum", initialValue: this.Easing.Linear },
      amplitude: { type: "real", initialValue: 1 },
      overshoot: { type: "real", initialValue: 1.70158 },
      period: { type: "real", initialValue: 0.3 },
      bezierCurve: "list"
    });
  }
});
