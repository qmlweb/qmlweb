import QtQuick 2.0
import QtTest 1.0

TestCase {
  name: "rect"
  property rect def
  property rect arg: "1,-3,2.5x10"
  property rect tmp

  function compareS(a, b) {
    return compare(a + "", b + "")
  }

  function test_construction() {
    compareS(def, "QRectF(0, 0, 0, 0)");
    compareS(arg, "QRectF(1, -3, 2.5, 10)");
    tmp = "-1,   20,5.5  x11";
    compareS(tmp, "QRectF(-1, 20, 5.5, 11)");
    compareS(Qt.rect(-1, 2.5, 3, 10), "QRectF(-1, 2.5, 3, 10)");
  }

  function test_get() {
    compare(def.x, 0);
    compare(def.y, 0);
    compare(def.width, 0);
    compare(def.height, 0);
    compare(arg.x, 1);
    compare(arg.y, -3);
    compare(arg.width, 2.5);
    compare(arg.height, 10);
    tmp = "-5.1, 1.72, 40 x -7.5";
    compare(tmp.x, -5.1);
    compare(tmp.y, 1.72);
    compare(tmp.width, 40);
    compare(tmp.height, -7.5);
  }

  function test_set() {
    tmp = "32, 60.5, -3 x 172.25";
    compareS(tmp, "QRectF(32, 60.5, -3, 172.25)");
    tmp.y = 100.5;
    compareS(tmp, "QRectF(32, 100.5, -3, 172.25)");
    tmp.width = -0.125;
    compareS(tmp, "QRectF(32, 100.5, -0.125, 172.25)");
    tmp.x = 51;
    compareS(tmp, "QRectF(51, 100.5, -0.125, 172.25)");
    tmp.height = -1965;
    compareS(tmp, "QRectF(51, 100.5, -0.125, -1965)");
    compare(tmp.x, 51);
    compare(tmp.y, 100.5);
    compare(tmp.width, -0.125);
    compare(tmp.height, -1965);
  }

  function test_immut() {
    tmp = arg;
    tmp.y = 100.5;
    tmp.width = -0.125;
    tmp.x = 51;
    tmp.height = -1965;
    compareS(tmp, "QRectF(51, 100.5, -0.125, -1965)");
    compareS(arg, "QRectF(1, -3, 2.5, 10)");
  }
}
