import QtQuick 2.0
import QtTest 1.0

TestCase {
  name: "vector3d"
  property vector3d def
  property vector3d arg: "1,-2.5,10"
  property vector3d tmp

  function compareS(a, b) {
    return compare(a + "", b + "")
  }

  function test_construction() {
    compareS(def, "QVector3D(0, 0, 0)");
    compareS(arg, "QVector3D(1, -2.5, 10)");
    tmp = "-1,   20,5.5";
    compareS(tmp, "QVector3D(-1, 20, 5.5)");
    compareS(Qt.vector3d(1, 2.5, -3), "QVector3D(1, 2.5, -3)");
  }

  function test_get() {
    compare(def.x, 0);
    compare(def.y, 0);
    compare(def.z, 0);
    compare(arg.x, 1);
    compare(arg.y, -2.5);
    compare(arg.z, 10);
    tmp = "1.72, 40.1, -7.5";
    compare(tmp.x, 1.72);
    compare(tmp.y, 40.1);
    compare(tmp.z, -7.5);
  }

  function test_set() {
    tmp = "0.5, -3, 172.25";
    compareS(tmp, "QVector3D(0.5, -3, 172.25)");
    tmp.x = 100.5;
    compareS(tmp, "QVector3D(100.5, -3, 172.25)");
    tmp.y = -0.125;
    compareS(tmp, "QVector3D(100.5, -0.125, 172.25)");
    tmp.z = -1965;
    compareS(tmp, "QVector3D(100.5, -0.125, -1965)");
    compare(tmp.x, 100.5);
    compare(tmp.y, -0.125);
    compare(tmp.z, -1965);
  }

  function test_crossProduct() {
    compareS(arg.crossProduct(undefined), def);
    compareS(arg.crossProduct(42), def);
    compareS(def.crossProduct(def), def);
    compareS(def.crossProduct(arg), def);
    compareS(arg.crossProduct(def), def);
    compareS(arg.crossProduct(arg), def);
    var a = Qt.vector3d(3, 4, 10);
    compareS(arg.crossProduct(a), "QVector3D(-65, 20, 11.5)");
    compareS(a.crossProduct(arg), "QVector3D(65, -20, -11.5)");
  }

  function test_dotProduct() {
    compare(arg.dotProduct(undefined), 0);
    compare(arg.dotProduct(42), 0);
    compare(def.dotProduct(def), 0);
    compare(def.dotProduct(arg), 0);
    compare(arg.dotProduct(def), 0);
    compare(arg.dotProduct(arg), 107.25);
    var a = Qt.vector3d(3, 4, 10);
    compare(arg.dotProduct(a), 93);
    compare(a.dotProduct(arg), 93);
  }

  function test_times() {
    // vector3d
    compareS(def.times(def), def);
    compareS(def.times(arg), def);
    compareS(arg.times(def), def);
    compareS(arg.times(arg), "QVector3D(1, 6.25, 100)");
    var a = Qt.vector3d(3, 4, 0.2);
    compareS(arg.times(a), "QVector3D(3, -10, 2)");
    compareS(a.times(arg), "QVector3D(3, -10, 2)");
    // number
    compareS(def.times(0), def);
    compareS(def.times(2), def);
    compareS(arg.times(0), def);
    compareS(arg.times(1), arg);
    compareS(arg.times(2), "QVector3D(2, -5, 20)");
    compareS(arg.times(-6), "QVector3D(-6, 15, -60)");
  }

  function test_plus() {
    compareS(def.plus(arg), arg);
    compareS(def.plus(1.5), def);
    compareS(arg.plus(2.5), arg);
    tmp = "-1.5, 20.5, 5";
    compareS(arg.plus(tmp), "QVector3D(-0.5, 18, 15)");
    compareS(tmp.plus(arg), arg.plus(tmp));
  }

  function test_minus() {
    compareS(def.minus(arg), "QVector3D(-1, 2.5, -10)");
    compareS(arg.minus(def), arg);
    compareS(def.minus(1.5), def);
    compareS(arg.minus(2.5), arg);
    tmp = "-1.5, 20.5, 5";
    compareS(arg.minus(tmp), "QVector3D(2.5, -23, 5)");
    compareS(tmp.minus(arg), "QVector3D(-2.5, 23, -5)");
  }

  function test_normalized() {
    compareS(def.normalized(), def);
    compareS(Qt.vector3d(3/20, 0, 4/20).normalized(), Qt.vector3d(3/5, 0, 4/5));
    compareS(Qt.vector3d(2, 2, 1).normalized(), Qt.vector3d(2/3, 2/3, 1/3));
  }

  function test_length() {
    compare(def.length(), 0);
    compare(arg.length(), Math.sqrt(107.25));
    tmp = "-1, 20, 5.5";
    compare(tmp.length(), Math.sqrt(431.25));
    compare(Qt.vector3d(3, 0, 4).length(), 5);
    compare(Qt.vector3d(2, 2, 1).length(), 3);
  }

  function test_toVector2d() {
    compareS(def.toVector2d(), "QVector2D(0, 0)");
    compareS(arg.toVector2d(), "QVector2D(1, -2.5)");
    tmp = "-1, 20, 5.5";
    compareS(tmp.toVector2d(), "QVector2D(-1, 20)");
  }

  function test_toVector4d() {
    compareS(def.toVector4d(), "QVector4D(0, 0, 0, 0)");
    compareS(arg.toVector4d(), "QVector4D(1, -2.5, 10, 0)");
    tmp = "-1, 20, 5.5";
    compareS(tmp.toVector4d(), "QVector4D(-1, 20, 5.5, 0)");
  }

  function test_fuzzyEquals() {
    verify(def.fuzzyEquals(def));
    verify(!def.fuzzyEquals(arg));
    verify(!arg.fuzzyEquals(def));
    var a = Qt.vector3d(2.41, -5.23, -1);
    verify(a.fuzzyEquals(Qt.vector3d(2.41, -5.23, -1)));
    verify(!a.fuzzyEquals(Qt.vector3d(2.41, -5.231, -1)));
    verify(a.fuzzyEquals(Qt.vector3d(2.410003, -5.230007, -1.000008)));
    verify(a.fuzzyEquals(Qt.vector3d(2.409, -5.231, -1.0012), 0.0015));
    verify(!a.fuzzyEquals(Qt.vector3d(2.409, -5.231, -1.0012), 0.0005));
  }

  function test_immut() {
    tmp = arg;
    tmp.x = 100.5;
    tmp.y = -0.125;
    tmp.z = -1965;
    compareS(tmp, "QVector3D(100.5, -0.125, -1965)");
    compareS(arg, "QVector3D(1, -2.5, 10)");
  }
}
