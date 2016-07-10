import QtQuick 2.0
import QtTest 1.0

TestCase {
  name: "vector2d"
  property vector2d def
  property vector2d arg: "1,2.5"
  property vector2d tmp

  function compareS(a, b) {
    return compare(a + "", b + "")
  }

  function test_construction() {
    compareS(def, "QVector2D(0, 0)");
    compareS(arg, "QVector2D(1, 2.5)");
    tmp = "-1,   20";
    compareS(tmp, "QVector2D(-1, 20)");
    compareS(Qt.vector2d(1, 2.5), "QVector2D(1, 2.5)");
  }

  function test_get() {
    compare(def.x, 0);
    compare(def.y, 0);
    compare(arg.x, 1);
    compare(arg.y, 2.5);
    tmp = "-5, 40";
    compare(tmp.x, -5);
    compare(tmp.y, 40);
  }

  function test_set() {
    tmp = "60, -3";
    compareS(tmp, "QVector2D(60, -3)");
    tmp.x = 100.5;
    compareS(tmp, "QVector2D(100.5, -3)");
    tmp.y = -0.125;
    compareS(tmp, "QVector2D(100.5, -0.125)");
    compare(tmp.x, 100.5);
    compare(tmp.y, -0.125);
  }

  function test_dotProduct() {
    compare(arg.dotProduct(undefined), 0);
    compare(arg.dotProduct(42), 0);
    compare(def.dotProduct(def), 0);
    compare(def.dotProduct(arg), 0);
    compare(arg.dotProduct(def), 0);
    compare(arg.dotProduct(arg), 7.25);
    var a = Qt.vector2d(3, 4);
    compare(arg.dotProduct(a), 13);
    compare(a.dotProduct(arg), 13);
  }

  function test_times() {
    // vector2d
    compareS(def.times(def), def);
    compareS(def.times(arg), def);
    compareS(arg.times(def), def);
    compareS(arg.times(arg), "QVector2D(1, 6.25)");
    var a = Qt.vector2d(3, 4);
    compareS(arg.times(a), "QVector2D(3, 10)");
    compareS(a.times(arg), "QVector2D(3, 10)");
    // number
    compareS(def.times(0), def);
    compareS(def.times(2), def);
    compareS(arg.times(0), def);
    compareS(arg.times(1), arg);
    compareS(arg.times(2), "QVector2D(2, 5)");
    compareS(arg.times(-6), "QVector2D(-6, -15)");
  }

  function test_plus() {
    compareS(def.plus(arg), arg);
    compareS(def.plus(1.5), def);
    compareS(arg.plus(2.5), arg);
    tmp = "-1.5,   20.5";
    compareS(arg.plus(tmp), "QVector2D(-0.5, 23)");
    compareS(tmp.plus(arg), arg.plus(tmp));
  }

  function test_minus() {
    compareS(def.minus(arg), "QVector2D(-1, -2.5)");
    compareS(arg.minus(def), arg);
    compareS(def.minus(1.5), def);
    compareS(arg.minus(2.5), arg);
    tmp = "-1.5,   20.5";
    compareS(arg.minus(tmp), "QVector2D(2.5, -18)");
    compareS(tmp.minus(arg), "QVector2D(-2.5, 18)");
  }

  function test_normalized() {
    compareS(def.normalized(), def);
    compareS(Qt.vector2d(3/20, 4/20).normalized(), Qt.vector2d(3/5, 4/5));
  }

  function test_length() {
    compare(def.length(), 0);
    compare(arg.length(), Math.sqrt(7.25));
    tmp = "-1,   20.5";
    compare(tmp.length(), Math.sqrt(421.25));
    compare(Qt.vector2d(3, 4).length(), 5);
  }

  function test_toVector3d() {
    compareS(def.toVector3d(), "QVector3D(0, 0, 0)");
    compareS(arg.toVector3d(), "QVector3D(1, 2.5, 0)");
    tmp = "-1,   20.5";
    compareS(tmp.toVector3d(), "QVector3D(-1, 20.5, 0)");
  }

  function test_toVector4d() {
    compareS(def.toVector4d(), "QVector4D(0, 0, 0, 0)");
    compareS(arg.toVector4d(), "QVector4D(1, 2.5, 0, 0)");
    tmp = "-1,   20.5";
    compareS(tmp.toVector4d(), "QVector4D(-1, 20.5, 0, 0)");
  }

  function test_fuzzyEquals() {
    verify(def.fuzzyEquals(def));
    verify(!def.fuzzyEquals(arg));
    verify(!arg.fuzzyEquals(def));
    var a = Qt.vector2d(2.41, -5.23);
    verify(a.fuzzyEquals(Qt.vector2d(2.41, -5.23)));
    verify(!a.fuzzyEquals(Qt.vector2d(2.41, -5.231)));
    verify(a.fuzzyEquals(Qt.vector2d(2.410009, -5.230007)));
    verify(a.fuzzyEquals(Qt.vector2d(2.409, -5.231), 0.0015));
    verify(!a.fuzzyEquals(Qt.vector2d(2.409, -5.231), 0.0005));
  }

  function test_immut() {
    tmp = arg;
    tmp.x = 100.5;
    tmp.y = -0.125;
    compareS(tmp, "QVector2D(100.5, -0.125)");
    compareS(arg, "QVector2D(1, 2.5)");
  }
}
