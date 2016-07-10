import QtQuick 2.0
import QtTest 1.0

TestCase {
  name: "size"
  property size def
  property size arg: "1x2.5"
  property size tmp

  function compareS(a, b) {
    return compare(a + "", b + "")
  }

  function test_construction() {
    compareS(def, "QSizeF(-1, -1)");
    compareS(arg, "QSizeF(1, 2.5)");
    tmp = "100.5 x   20";
    compareS(tmp, "QSizeF(100.5, 20)");
    compareS(Qt.size(1, 2.5), "QSizeF(1, 2.5)");
  }

  function test_get() {
    compare(def.width, -1);
    compare(def.height, -1);
    compare(arg.width, 1);
    compare(arg.height, 2.5);
    tmp = "-5 x 40.31";
    compare(tmp.width, -5);
    compare(tmp.height, 40.31);
  }

  function test_set() {
    tmp = "60 x -3";
    compareS(tmp, "QSizeF(60, -3)");
    tmp.width = 100.5;
    compareS(tmp, "QSizeF(100.5, -3)");
    tmp.height = -0.125;
    compareS(tmp, "QSizeF(100.5, -0.125)");
    compare(tmp.width, 100.5);
    compare(tmp.height, -0.125);
  }

  function test_immut() {
    tmp = arg;
    tmp.width = 100.5;
    tmp.height = -0.125;
    compareS(tmp, "QSizeF(100.5, -0.125)");
    compareS(arg, "QSizeF(1, 2.5)");
  }
}
