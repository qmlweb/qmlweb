class QVector4D extends QmlWeb.QObject {
  constructor(...args) {
    super();
    let data = args;
    if (args.length === 1 && typeof args[0] === "string") {
      data = args[0].split(",").map(x => parseFloat(x.trim()));
      if (data.length !== 4) data = [];
    } else if (args.length === 1 && args[0] instanceof QVector4D) {
      data = [args[0].x, args[0].y, args[0].z, args[0].w];
    }
    if (data.length === 0) {
      data = [0, 0, 0, 0];
    } else if (data.length !== 4) {
      throw new Error("Invalid arguments");
    }
    QmlWeb.createProperties(this, {
      x: { type: "real", initialValue: data[0] },
      y: { type: "real", initialValue: data[1] },
      z: { type: "real", initialValue: data[2] },
      w: { type: "real", initialValue: data[3] }
    });
  }
  toString() {
    return super.$toString(this.x, this.y, this.z, this.w);
  }
  dotProduct(a) {
    if (a instanceof QVector4D) {
      return a.x * this.x + a.y * this.y + a.z * this.z + a.w * this.w;
    }
    return 0;
  }
  times(a) {
    if (a instanceof QmlWeb.QMatrix4x4) {
      const t = this;
      return new QVector4D(
        t.x * a.m11 + t.y * a.m21 + t.z * a.m31 + t.w * a.m41,
        t.x * a.m12 + t.y * a.m22 + t.z * a.m32 + t.w * a.m42,
        t.x * a.m13 + t.y * a.m23 + t.z * a.m33 + t.w * a.m43,
        t.x * a.m14 + t.y * a.m24 + t.z * a.m34 + t.w * a.m44
      );
    }
    if (a instanceof QVector4D) {
      const t = this;
      return new QVector4D(t.x * a.x, t.y * a.y, t.z * a.z, t.w * a.w);
    }
    return new QVector4D(this.x * a, this.y * a, this.z * a, this.w * a);
  }
  plus(a) {
    if (a instanceof QVector4D) {
      const t = this;
      return new QVector4D(t.x + a.x, t.y + a.y, t.z + a.z, t.w + a.w);
    }
    return new QVector4D(this.x, this.y, this.z, this.w);
  }
  minus(a) {
    if (a instanceof QVector4D) {
      const t = this;
      return new QVector4D(t.x - a.x, t.y - a.y, t.z - a.z, t.w - a.w);
    }
    return new QVector4D(this.x, this.y, this.z, this.w);
  }
  normalized() {
    const length = this.length();
    return this.times(1 / (length === 0 ? 1 : length));
  }
  length() {
    return Math.sqrt(this.dotProduct(this));
  }
  toVector2d() {
    return new QmlWeb.QVector2D(this.x, this.y);
  }
  toVector3d() {
    return new QmlWeb.QVector3D(this.x, this.y, this.z);
  }
  fuzzyEquals(a, epsilon = 0.00001) {
    return [this.x - a.x, this.y - a.y, this.z - a.z, this.w - a.w].every(
      delta => Math.abs(delta) <= epsilon
    );
  }

  static nonNullableType = true;
  static requireConstructor = true;
}

QmlWeb.QVector4D = QVector4D;
