// eslint-disable-next-line no-undef
class QtQuick_Animator extends QtQuick_Animation {
  static versions = /^2\./;
  static properties = {
    duration: { type: "int", initialValue: 250 },
    from: "real",
    target: "Item",
    to: "real"
  };

  constructor(meta) {
    super(meta);

    this.easing = new QmlWeb.QObject(this);
    QmlWeb.createProperties(this.easing, {
      type: { type: "enum", initialValue: this.Easing.Linear },
      amplitude: { type: "real", initialValue: 1 },
      overshoot: { type: "real", initialValue: 1.70158 },
      period: { type: "real", initialValue: 0.3 },
      bezierCurve: "list"
    });
  }
}
