class QMatrix4x4 extends QmlWeb.QObject {
  constructor(...args) {
    super();
    let data = args;
    if (args.length === 0) {
      data = [];
      for (let row = 1; row <= 4; row++) {
        for (let col = 1; col <= 4; col++) {
          data.push(col === row ? 1 : 0);
        }
      }
    } else if (args.length === 1 && args[0] instanceof QMatrix4x4) {
      data = [];
      for (let row = 1; row <= 4; row++) {
        for (let col = 1; col <= 4; col++) {
          const name = `m${row}${col}`;
          data.push(args[0][name]);
        }
      }
    } else if (args.length !== 16) {
      throw new Error("Invalid arguments");
    }
    for (let row = 1; row <= 4; row++) {
      for (let col = 1; col <= 4; col++) {
        const name = `m${row}${col}`;
        const value = data[4 * (row - 1) + col - 1];
        QmlWeb.createProperty("real", this, name, { initialValue: value });
      }
    }
  }
  toString() {
    return super.$toString(
      this.m11, this.m12, this.m13, this.m14,
      this.m21, this.m22, this.m23, this.m24,
      this.m31, this.m32, this.m33, this.m34,
      this.m41, this.m42, this.m43, this.m44
    );
  }
  times(a) {
    if (a instanceof QmlWeb.QMatrix4x4) {
      const t = this;
      return new QmlWeb.QMatrix4x4(
        t.m11 * a.m11 + t.m12 * a.m21 + t.m13 * a.m31 + t.m14 * a.m41,
        t.m11 * a.m12 + t.m12 * a.m22 + t.m13 * a.m32 + t.m14 * a.m42,
        t.m11 * a.m13 + t.m12 * a.m23 + t.m13 * a.m33 + t.m14 * a.m43,
        t.m11 * a.m14 + t.m12 * a.m24 + t.m13 * a.m34 + t.m14 * a.m44,

        t.m21 * a.m11 + t.m22 * a.m21 + t.m23 * a.m31 + t.m24 * a.m41,
        t.m21 * a.m12 + t.m22 * a.m22 + t.m23 * a.m32 + t.m24 * a.m42,
        t.m21 * a.m13 + t.m22 * a.m23 + t.m23 * a.m33 + t.m24 * a.m43,
        t.m21 * a.m14 + t.m22 * a.m24 + t.m23 * a.m34 + t.m24 * a.m44,

        t.m31 * a.m11 + t.m32 * a.m21 + t.m33 * a.m31 + t.m34 * a.m41,
        t.m31 * a.m12 + t.m32 * a.m22 + t.m33 * a.m32 + t.m34 * a.m42,
        t.m31 * a.m13 + t.m32 * a.m23 + t.m33 * a.m33 + t.m34 * a.m43,
        t.m31 * a.m14 + t.m32 * a.m24 + t.m33 * a.m34 + t.m34 * a.m44,

        t.m41 * a.m11 + t.m42 * a.m21 + t.m43 * a.m31 + t.m44 * a.m41,
        t.m41 * a.m12 + t.m42 * a.m22 + t.m43 * a.m32 + t.m44 * a.m42,
        t.m41 * a.m13 + t.m42 * a.m23 + t.m43 * a.m33 + t.m44 * a.m43,
        t.m41 * a.m14 + t.m42 * a.m24 + t.m43 * a.m34 + t.m44 * a.m44
      );
    }
    if (a instanceof QmlWeb.QVector4D) {
      const t = this;
      return new QmlWeb.QVector4D(
        t.m11 * a.x + t.m12 * a.y + t.m13 * a.z + t.m14 * a.w,
        t.m21 * a.x + t.m22 * a.y + t.m23 * a.z + t.m24 * a.w,
        t.m31 * a.x + t.m32 * a.y + t.m33 * a.z + t.m34 * a.w,
        t.m41 * a.x + t.m42 * a.y + t.m43 * a.z + t.m44 * a.w
      );
    }
    if (a instanceof QmlWeb.QVector3D) {
      const v = this.times(new QmlWeb.QVector4D(a.x, a.y, a.z, 1));
      return new QmlWeb.QVector3D(v.x / v.w, v.y / v.w, v.z / v.w);
    }
    return new QMatrix4x4(
      this.m11 * a, this.m12 * a, this.m13 * a, this.m14 * a,
      this.m21 * a, this.m22 * a, this.m23 * a, this.m24 * a,
      this.m31 * a, this.m32 * a, this.m33 * a, this.m34 * a,
      this.m41 * a, this.m42 * a, this.m43 * a, this.m44 * a
    );
  }
  plus(other) {
    const a = other instanceof QMatrix4x4 ? other : new QMatrix4x4();
    return new QMatrix4x4(
      this.m11 + a.m11, this.m12 + a.m12, this.m13 + a.m13, this.m14 + a.m14,
      this.m21 + a.m21, this.m22 + a.m22, this.m23 + a.m23, this.m24 + a.m24,
      this.m31 + a.m31, this.m32 + a.m32, this.m33 + a.m33, this.m34 + a.m34,
      this.m41 + a.m41, this.m42 + a.m42, this.m43 + a.m43, this.m44 + a.m44
    );
  }
  minus(other) {
    const a = other instanceof QMatrix4x4 ? other : new QMatrix4x4();
    return new QMatrix4x4(
      this.m11 - a.m11, this.m12 - a.m12, this.m13 - a.m13, this.m14 - a.m14,
      this.m21 - a.m21, this.m22 - a.m22, this.m23 - a.m23, this.m24 - a.m24,
      this.m31 - a.m31, this.m32 - a.m32, this.m33 - a.m33, this.m34 - a.m34,
      this.m41 - a.m41, this.m42 - a.m42, this.m43 - a.m43, this.m44 - a.m44
    );
  }
  row(i) {
    const row = i + 1;
    const arr = [1, 2, 3, 4].map(col => this[`m${row}${col}`]);
    return new QmlWeb.QVector4D(...arr);
  }
  column(i) {
    const col = i + 1;
    const arr = [1, 2, 3, 4].map(row => this[`m${row}${col}`]);
    return new QmlWeb.QVector4D(...arr);
  }
  determinant() {
    // Laplace expansion
    const t = this;
    const s0 = t.m11 * t.m22 - t.m12 * t.m21;
    const c5 = t.m33 * t.m44 - t.m34 * t.m43;
    const s1 = t.m11 * t.m23 - t.m13 * t.m21;
    const c4 = t.m32 * t.m44 - t.m34 * t.m42;
    const s2 = t.m11 * t.m24 - t.m14 * t.m21;
    const c3 = t.m32 * t.m43 - t.m33 * t.m42;
    const s3 = t.m12 * t.m23 - t.m13 * t.m22;
    const c2 = t.m31 * t.m44 - t.m34 * t.m41;
    const s4 = t.m12 * t.m24 - t.m14 * t.m22;
    const c1 = t.m31 * t.m43 - t.m33 * t.m41;
    const s5 = t.m13 * t.m24 - t.m14 * t.m23;
    const c0 = t.m31 * t.m42 - t.m32 * t.m41;
    return s0 * c5 - s1 * c4 + s2 * c3 + s3 * c2 - s4 * c1 + s5 * c0;
  }
  inverted() {
    // Laplace expansion
    const t = this;
    const s0 = t.m11 * t.m22 - t.m12 * t.m21;
    const c5 = t.m33 * t.m44 - t.m34 * t.m43;
    const s1 = t.m11 * t.m23 - t.m13 * t.m21;
    const c4 = t.m32 * t.m44 - t.m34 * t.m42;
    const s2 = t.m11 * t.m24 - t.m14 * t.m21;
    const c3 = t.m32 * t.m43 - t.m33 * t.m42;
    const s3 = t.m12 * t.m23 - t.m13 * t.m22;
    const c2 = t.m31 * t.m44 - t.m34 * t.m41;
    const s4 = t.m12 * t.m24 - t.m14 * t.m22;
    const c1 = t.m31 * t.m43 - t.m33 * t.m41;
    const s5 = t.m13 * t.m24 - t.m14 * t.m23;
    const c0 = t.m31 * t.m42 - t.m32 * t.m41;
    const det = s0 * c5 - s1 * c4 + s2 * c3 + s3 * c2 - s4 * c1 + s5 * c0;
    const adj = [
      +t.m22 * c5 - t.m23 * c4 + t.m24 * c3,
      -t.m12 * c5 + t.m13 * c4 - t.m14 * c3,
      +t.m42 * s5 - t.m43 * s4 + t.m44 * s3,
      -t.m32 * s5 + t.m33 * s4 - t.m34 * s3,

      -t.m21 * c5 + t.m23 * c2 - t.m24 * c1,
      +t.m11 * c5 - t.m13 * c2 + t.m14 * c1,
      -t.m41 * s5 + t.m43 * s2 - t.m44 * s1,
      +t.m31 * s5 - t.m33 * s2 + t.m34 * s1,

      +t.m21 * c4 - t.m22 * c2 + t.m24 * c0,
      -t.m11 * c4 + t.m12 * c2 - t.m14 * c0,
      +t.m41 * s4 - t.m42 * s2 + t.m44 * s0,
      -t.m31 * s4 + t.m32 * s2 - t.m34 * s0,

      -t.m21 * c3 + t.m22 * c1 - t.m23 * c0,
      +t.m11 * c3 - t.m12 * c1 + t.m13 * c0,
      -t.m41 * s3 + t.m42 * s1 - t.m43 * s0,
      +t.m31 * s3 - t.m32 * s1 + t.m33 * s0
    ];
    return new QMatrix4x4(...adj.map(x => x / det));
  }
  transposed() {
    return new QMatrix4x4(
      this.m11, this.m21, this.m31, this.m41,
      this.m12, this.m22, this.m32, this.m42,
      this.m13, this.m23, this.m33, this.m43,
      this.m14, this.m24, this.m34, this.m44
    );
  }
  fuzzyEquals(a, epsilon = 0.00001) {
    for (let row = 1; row <= 4; row++) {
      for (let col = 1; col <= 4; col++) {
        const name = `m${row}${col}`;
        if (Math.abs(this[name] - a[name]) > epsilon) {
          return false;
        }
      }
    }
    return true;
  }

  static nonNullableType = true;
  static requireConstructor = true;
}

QmlWeb.QMatrix4x4 = QMatrix4x4;
