import QtQuick 2.0
import QtTest 1.0

TestCase {
  name: "matrix4x4"
  property matrix4x4 def
  property matrix4x4 tmp

  function compareS(a, b) {
    return compare(a + "", b + "")
  }

  function test_construction() {
    compareS(def, "QMatrix4x4(1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1)");
    compareS(Qt.matrix4x4(), "QMatrix4x4(1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1)");
    compareS(
      Qt.matrix4x4(1, 2, 3, 4, 5, 6, 7, 9, 10, 11.5, 12.25, -3, -4.5, 6, 19, 100),
      "QMatrix4x4(1, 2, 3, 4, 5, 6, 7, 9, 10, 11.5, 12.25, -3, -4.5, 6, 19, 100)"
    );
  }

  function test_plus() {
    var i = Qt.matrix4x4();
    var a = Qt.matrix4x4(1, 2, 3, 4, 5, 6, 7, 9, 10, 11, 12.25, -3, -4.5, 6, 19, 10);
    var b = Qt.matrix4x4(1, -1, 5, 0.5, 18, 9, 10, 11, 32, 13, 24, 15, 16, 17, 18, 19);
    compareS(a.plus(i), "QMatrix4x4(2, 2, 3, 4, 5, 7, 7, 9, 10, 11, 13.25, -3, -4.5, 6, 19, 11)");
    compareS(i.plus(a), a.plus(i));
    compareS(a.plus(101), a.plus(i));
    compareS(a.plus(b), "QMatrix4x4(2, 1, 8, 4.5, 23, 15, 17, 20, 42, 24, 36.25, 12, 11.5, 23, 37, 29)");
    compareS(b.plus(a), a.plus(b));
  }

  function test_minus() {
    var i = Qt.matrix4x4();
    var a = Qt.matrix4x4(1, 2, 3, 4, 5, 6, 7, 9, 10, 11, 12.25, -3, -4.5, 6, 19, 10);
    var b = Qt.matrix4x4(1, -1, 5, 0.5, 18, 9, 10, 11, 32, 13, 24, 15, 16, 17, 18, 19);
    compareS(a.minus(i), "QMatrix4x4(0, 2, 3, 4, 5, 5, 7, 9, 10, 11, 11.25, -3, -4.5, 6, 19, 9)");
    compareS(a.minus(101), a.minus(i));
    compareS(a.minus(b), "QMatrix4x4(0, 3, -2, 3.5, -13, -3, -3, -2, -22, -2, -11.75, -18, -20.5, -11, 1, -9)");
    compareS(b.minus(a), "QMatrix4x4(0, -3, 2, -3.5, 13, 3, 3, 2, 22, 2, 11.75, 18, 20.5, 11, -1, 9)");
  }

  function test_times() {
    var a = Qt.matrix4x4(1, 2, 3, 4, 5, 6, 7, 9, 10, 11, 12.25, -3, -4.5, 6, 19, 10);
    var b = Qt.matrix4x4(1, -1, 5, 0.5, 18, 9, 10, 11, 32, 13, 24, 15, 16, 17, 18, 19);
    // matrix4x4
    compareS(a.times(2), "QMatrix4x4(2, 4, 6, 8, 10, 12, 14, 18, 20, 22, 24.5, -6, -9, 12, 38, 20)");
    compareS(a.times(b), "QMatrix4x4(197, 124, 169, 143.5, 481, 293, 415, 344.5, 552, 197.25, 400, 252.75, 871.5, 475.5, 673.5, 538.75)");
    compareS(b.times(a), "QMatrix4x4(43.75, 54, 66.75, -15, 113.5, 266, 448.5, 233, 269.5, 496, 766, 323, 195.5, 446, 748.5, 353)");
    // number
    compareS(def.times(1), def);
    compareS(def.times(2.5), "QMatrix4x4(2.5, 0, 0, 0, 0, 2.5, 0, 0, 0, 0, 2.5, 0, 0, 0, 0, 2.5)");
    compareS(a.times(-6), "QMatrix4x4(-6, -12, -18, -24, -30, -36, -42, -54, -60, -66, -73.5, 18, 27, -36, -114, -60)");
    // vector4d
    var def4d = Qt.vector4d(0, 0, 0, 0);
    compareS(def.times(def4d), def4d);
    compareS(def4d.times(def), def4d);
    compareS(a.times(def4d), def4d);
    compareS(def4d.times(a), def4d);
    var arg4d = Qt.vector4d(1, 2, 3.5, -4);
    compareS(def.times(arg4d), arg4d);
    compareS(arg4d.times(def), arg4d);
    compareS(a.times(arg4d), "QVector4D(-0.5, 5.5, 86.875, 34)");
    compareS(arg4d.times(a), "QVector4D(64, 28.5, -16.125, -28.5)");
    // vector3d
    var def3d = Qt.vector3d(0, 0, 0);
    compareS(def.times(def3d), def3d);
    compareS(def3d.times(def), def3d);
    compareS(a.times(def3d), "QVector3D(0.4, 0.9, -0.3)");
    compareS(def3d.times(a), "QVector3D(-0.45, 0.6, 1.9)");
    var arg3d = Qt.vector3d(1, -2, 3.5);
    compareS(def.times(arg3d), arg3d);
    compareS(arg3d.times(def), arg3d);
    verify(a.times(arg3d).fuzzyEquals(Qt.vector3d(0.191667, 0.441667, 0.464583)));
    verify(arg3d.times(a).fuzzyEquals(Qt.vector3d(-1.48276, -2.37931, -3.50862)));
  }

  function test_determinant() {
    var i = Qt.matrix4x4();
    var a = Qt.matrix4x4(1, 2, 3, 4, 5, 6, 7, 9, 10, 11, 12.25, -3, -4.5, 6, 19, 10);
    var b = Qt.matrix4x4(1, -1, 5, 0.5, 18, 9, 10, 11, 32, 13, 24, 15, 16, 17, 18, 19);
    var m = Qt.matrix4x4(1, -1, 2, 4, 18, 9, 10, 11, 32, 13, 24, 15, 16, 17, 18, 19);
    compare(i.determinant(), 1);
    compare(a.determinant(), -169.25);
    compare(b.determinant(), 3570);
    compare(m.determinant(), 8100);
  }

  function test_transposed() {
    var i = Qt.matrix4x4();
    var a = Qt.matrix4x4(1, 2, 3, 4, 5, 6, 7, 9, 10, 11, 12.25, -3, -4.5, 6, 19, 10);
    compareS(i.transposed(), "QMatrix4x4(1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1)");
    compareS(a.transposed(), "QMatrix4x4(1, 5, 10, -4.5, 2, 6, 11, 6, 3, 7, 12.25, 19, 4, 9, -3, 10)");
  }

  function test_inverted() {
    var i = Qt.matrix4x4();
    var m = Qt.matrix4x4(1, -1, 2, 4, 18, 9, 10, 11, 32, 13, 24, 15, 16, 17, 18, 19);
    compareS(i.inverted(), "QMatrix4x4(1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1)");
    compareS(m.inverted().times(8100), "QMatrix4x4(-160, 866, 8, -474, -1780, 218, -316, 498, 240, -1704, 798, 306, 1500, 690, -480, 90)");
  }

  function test_get() {
    compare(def.m11, 1);
    compare(def.m12, 0);
    compare(def.m44, 1);
    var a = Qt.matrix4x4(1, 2, 3, 4, 5, 6, 7, 9, 10, 11, 12.25, -3, -4.5, 6, 19, 10);
    compare(a.m14, 4);
    compare(a.m21, 5);
  }

  function test_set() {
    var a = Qt.matrix4x4(1, 2, 3, 4, 5, 6, 7, 9, 10, 11.5, 12.25, -3, -4.5, 6, 19, 10);
    a.m11 = 10;
    a.m43 *= 2;
    a.m22 = 2.5;
    compareS(a, "QMatrix4x4(10, 2, 3, 4, 5, 2.5, 7, 9, 10, 11.5, 12.25, -3, -4.5, 6, 38, 10)");
  }

  function test_row() {
    compareS(def.row(0), "QVector4D(1, 0, 0, 0)");
    compareS(def.row(1), "QVector4D(0, 1, 0, 0)");
    compareS(def.row(2), "QVector4D(0, 0, 1, 0)");
    compareS(def.row(3), "QVector4D(0, 0, 0, 1)");
    var a = Qt.matrix4x4(1, 2, 3, 4, 5, 6, 7, 9, 10, 11.5, 12.25, -3, -4.5, -6, 19, 10.25);
    compareS(a.row(0), "QVector4D(1, 2, 3, 4)");
    compareS(a.row(1), "QVector4D(5, 6, 7, 9)");
    compareS(a.row(2), "QVector4D(10, 11.5, 12.25, -3)");
    compareS(a.row(3), "QVector4D(-4.5, -6, 19, 10.25)");
  }

  function test_column() {
    compareS(def.column(0), "QVector4D(1, 0, 0, 0)");
    compareS(def.column(1), "QVector4D(0, 1, 0, 0)");
    compareS(def.column(2), "QVector4D(0, 0, 1, 0)");
    compareS(def.column(3), "QVector4D(0, 0, 0, 1)");
    var a = Qt.matrix4x4(1, 2, 3, 4, 5, 6, 7, 9, 10, 11.5, 12.25, -3, -4.5, -6, 19, 10.25);
    compareS(a.column(0), "QVector4D(1, 5, 10, -4.5)");
    compareS(a.column(1), "QVector4D(2, 6, 11.5, -6)");
    compareS(a.column(2), "QVector4D(3, 7, 12.25, 19)");
    compareS(a.column(3), "QVector4D(4, 9, -3, 10.25)");
  }

  function test_immut() {
    tmp = def;
    tmp.m11 = 0;
    tmp.m13 = 10;
    compareS(tmp, "QMatrix4x4(0, 0, 10, 0, 0, 1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1)");
    compareS(def, "QMatrix4x4(1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1)");
  }

  function test_fuzzyEquals() {
    verify(def.fuzzyEquals(def));
    var a = Qt.matrix4x4();
    a.m11 = 1.01;
    verify(!def.fuzzyEquals(a));
    verify(!a.fuzzyEquals(def));
    verify(def.fuzzyEquals(a, 0.015));
    verify(a.fuzzyEquals(def, 0.015));
    a.m23 = 0.1;
    verify(!def.fuzzyEquals(a, 0.015));
    verify(!a.fuzzyEquals(def, 0.015));
    verify(def.fuzzyEquals(a, 0.15));
    verify(a.fuzzyEquals(def, 0.15));
  }
}
