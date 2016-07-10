import QtQuick 2.0
import QtTest 1.0

TestCase {
  name: "vector4d"
  property vector4d def
  property vector4d arg: "5,2.5,10, -3"
  property vector4d tmp

  function compareS(a, b) {
    return compare(a + "", b + "")
  }

  function test_construction() {
    compareS(def, "QVector4D(0, 0, 0, 0)");
    compareS(arg, "QVector4D(5, 2.5, 10, -3)");
    tmp = "-1,   20,5.5  ,11";
    compareS(tmp, "QVector4D(-1, 20, 5.5, 11)");
    compareS(Qt.vector4d(1, 2.5, -3, 10), "QVector4D(1, 2.5, -3, 10)");
  }

  function test_get() {
    compare(def.x, 0);
    compare(def.y, 0);
    compare(def.z, 0);
    compare(def.w, 0);
    compare(arg.x, 5);
    compare(arg.y, 2.5);
    compare(arg.z, 10);
    compare(arg.w, -3);
    tmp = "-5.1, 1.72, 40, -7.5";
    compare(tmp.x, -5.1);
    compare(tmp.y, 1.72);
    compare(tmp.z, 40);
    compare(tmp.w, -7.5);
  }

  function test_set() {
    tmp = "32, 60.5, -3, 172.25";
    compareS(tmp, "QVector4D(32, 60.5, -3, 172.25)");
    tmp.y = 100.5;
    compareS(tmp, "QVector4D(32, 100.5, -3, 172.25)");
    tmp.z = -0.125;
    compareS(tmp, "QVector4D(32, 100.5, -0.125, 172.25)");
    tmp.x = 51;
    compareS(tmp, "QVector4D(51, 100.5, -0.125, 172.25)");
    tmp.w = -1965;
    compareS(tmp, "QVector4D(51, 100.5, -0.125, -1965)");
    compare(tmp.x, 51);
    compare(tmp.y, 100.5);
    compare(tmp.z, -0.125);
    compare(tmp.w, -1965);
  }

  function test_dotProduct() {
    compare(arg.dotProduct(undefined), 0);
    compare(arg.dotProduct(42), 0);
    compare(def.dotProduct(def), 0);
    compare(def.dotProduct(arg), 0);
    compare(arg.dotProduct(def), 0);
    compare(arg.dotProduct(arg), 140.25);
    var a = Qt.vector4d(3, 4, 10, 2.5);
    compare(arg.dotProduct(a), 117.5);
    compare(a.dotProduct(arg), 117.5);
  }

  function test_times() {
    // vector4d
    compareS(def.times(def), def);
    compareS(def.times(arg), def);
    compareS(arg.times(def), def);
    compareS(arg.times(arg), "QVector4D(25, 6.25, 100, 9)");
    var a = Qt.vector4d(3, 4, 0.2, 8.5/3);
    compareS(arg.times(a), "QVector4D(15, 10, 2, -8.5)");
    compareS(a.times(arg), "QVector4D(15, 10, 2, -8.5)");
    // number
    compareS(def.times(0), def);
    compareS(def.times(2), def);
    compareS(arg.times(0), def);
    compareS(arg.times(1), arg);
    compareS(arg.times(2), "QVector4D(10, 5, 20, -6)");
    compareS(arg.times(-6), "QVector4D(-30, -15, -60, 18)");
  }

  function test_plus() {
    compareS(def.plus(arg), arg);
    compareS(def.plus(1.5), def);
    compareS(arg.plus(2.5), arg);
    tmp = "-1.5, 20.5, 5, 11";
    compareS(arg.plus(tmp), "QVector4D(3.5, 23, 15, 8)");
    compareS(tmp.plus(arg), arg.plus(tmp));
  }

  function test_minus() {
    compareS(def.minus(arg), "QVector4D(-5, -2.5, -10, 3)");
    compareS(arg.minus(def), arg);
    compareS(def.minus(1.5), def);
    compareS(arg.minus(2.5), arg);
    tmp = "-1.5, 20.5, 5, 11";
    compareS(arg.minus(tmp), "QVector4D(6.5, -18, 5, -14)");
    compareS(tmp.minus(arg), "QVector4D(-6.5, 18, -5, 14)");
  }

  function test_normalized() {
    compareS(def.normalized(), def);
    compareS(Qt.vector4d(2, 0, 2, 1).normalized(), Qt.vector4d(2/3, 0, 2/3, 1/3));
    compareS(Qt.vector4d(1, 4, 2, 2).normalized(), Qt.vector4d(1/5, 4/5, 2/5, 2/5));
  }

  function test_length() {
    compare(def.length(), 0);
    compare(arg.length(), Math.sqrt(140.25));
    tmp = "-1, 20, 5.5, 11";
    compare(tmp.length(), Math.sqrt(552.25));
    compare(Qt.vector4d(2, 0, 2, 1).length(), 3);
    compare(Qt.vector4d(1, 4, 2, 2).length(), 5);
  }

  function test_toVector2d() {
    compareS(def.toVector2d(), "QVector2D(0, 0)");
    compareS(arg.toVector2d(), "QVector2D(5, 2.5)");
    tmp = "-1, 20, 5.5, 11";
    compareS(tmp.toVector2d(), "QVector2D(-1, 20)");
  }

  function test_toVector3d() {
    compareS(def.toVector3d(), "QVector3D(0, 0, 0)");
    compareS(arg.toVector3d(), "QVector3D(5, 2.5, 10)");
    tmp = "-1, 20, 5.5, 11";
    compareS(tmp.toVector3d(), "QVector3D(-1, 20, 5.5)");
  }

  function test_fuzzyEquals() {
    verify(def.fuzzyEquals(def));
    verify(!def.fuzzyEquals(arg));
    verify(!arg.fuzzyEquals(def));
    var a = Qt.vector4d(2.41, -5.23, -1, 110);
    verify(a.fuzzyEquals(Qt.vector4d(2.41, -5.23, -1, 110)));
    verify(!a.fuzzyEquals(Qt.vector4d(2.41, -5.231, -1, 110)));
    verify(a.fuzzyEquals(Qt.vector4d(2.410003, -5.230007, -1.000008, 110.000002)));
    verify(a.fuzzyEquals(Qt.vector4d(2.409, -5.231, -1.0012, 110.0009), 0.0015));
    verify(!a.fuzzyEquals(Qt.vector4d(2.409, -5.231, -1.0012, 110.0009), 0.0005));
  }

  function test_immut() {
    tmp = arg;
    tmp.y = 100.5;
    tmp.z = -0.125;
    tmp.x = 51;
    tmp.w = -1965;
    compareS(tmp, "QVector4D(51, 100.5, -0.125, -1965)");
    compareS(arg, "QVector4D(5, 2.5, 10, -3)");
  }
}
