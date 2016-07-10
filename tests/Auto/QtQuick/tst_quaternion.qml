import QtQuick 2.0
import QtTest 1.0

TestCase {
  name: "quaternion"
  property quaternion def
  property quaternion arg: "5,2.5,10, -3"
  property quaternion tmp

  function compareS(a, b) {
    return compare(a + "", b + "")
  }

  function test_construction() {
    compareS(def, "QQuaternion(1, 0, 0, 0)");
    compareS(arg, "QQuaternion(5, 2.5, 10, -3)");
    tmp = "-1,   20,5.5  ,11";
    compareS(tmp, "QQuaternion(-1, 20, 5.5, 11)");
    compareS(Qt.quaternion(3, 2.5, -3, 10), "QQuaternion(3, 2.5, -3, 10)");
  }

  function test_get() {
    compare(def.scalar, 1);
    compare(def.x, 0);
    compare(def.y, 0);
    compare(def.z, 0);
    compare(arg.scalar, 5);
    compare(arg.x, 2.5);
    compare(arg.y, 10);
    compare(arg.z, -3);
    tmp = "-5.1, 1.72, 40, -7.5";
    compare(tmp.scalar, -5.1);
    compare(tmp.x, 1.72);
    compare(tmp.y, 40);
    compare(tmp.z, -7.5);
  }

  function test_set() {
    tmp = "32, 60.5, -3, 172.25";
    compareS(tmp, "QQuaternion(32, 60.5, -3, 172.25)");
    tmp.x = 100.5;
    compareS(tmp, "QQuaternion(32, 100.5, -3, 172.25)");
    tmp.y = -0.125;
    compareS(tmp, "QQuaternion(32, 100.5, -0.125, 172.25)");
    tmp.scalar = 51;
    compareS(tmp, "QQuaternion(51, 100.5, -0.125, 172.25)");
    tmp.z = -1965;
    compareS(tmp, "QQuaternion(51, 100.5, -0.125, -1965)");
    compare(tmp.scalar, 51);
    compare(tmp.x, 100.5);
    compare(tmp.y, -0.125);
    compare(tmp.z, -1965);
  }

  function test_immut() {
    tmp = arg;
    tmp.x = 100.5;
    tmp.y = -0.125;
    tmp.scalar = 51;
    tmp.z = -1965;
    compareS(tmp, "QQuaternion(51, 100.5, -0.125, -1965)");
    compareS(arg, "QQuaternion(5, 2.5, 10, -3)");
  }
}
