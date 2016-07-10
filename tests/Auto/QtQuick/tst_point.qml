import QtQuick 2.0
import QtTest 1.0

TestCase {
  name: "point"
  property point def
  property point arg: "1,2.5"
  property point tmp

  function compareS(a, b) {
    return compare(a + "", b + "")
  }

  function test_construction() {
    compareS(def, "QPointF(0, 0)");
    compareS(arg, "QPointF(1, 2.5)");
    tmp = "-1,   20";
    compareS(tmp, "QPointF(-1, 20)");
    compareS(Qt.point(1, 2.5), "QPointF(1, 2.5)");
  }

  function test_get() {
    compare(def.x, 0);
    compare(def.y, 0);
    compare(arg.x, 1);
    compare(arg.y, 2.5);
    tmp = "-5, 40.31";
    compare(tmp.x, -5);
    compare(tmp.y, 40.31);
  }

  function test_set() {
    tmp = "60, -3";
    compareS(tmp, "QPointF(60, -3)");
    tmp.x = 100.5;
    compareS(tmp, "QPointF(100.5, -3)");
    tmp.y = -0.125;
    compareS(tmp, "QPointF(100.5, -0.125)");
    compare(tmp.x, 100.5);
    compare(tmp.y, -0.125);
  }

  function test_immut() {
    tmp = arg;
    tmp.x = 10.5;
    tmp.y = -20.25;
    compareS(tmp, "QPointF(10.5, -20.25)");
    compareS(arg, "QPointF(1, 2.5)");
  }
}
