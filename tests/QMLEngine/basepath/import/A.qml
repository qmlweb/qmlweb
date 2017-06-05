import QtQuick 2.0
import QtQuick.Controls 1.2

Item {
  property var a
  property var b

  onAChanged: foo1()
  onBChanged: foo2()

  function foo1() { b = a+1; }
  function foo2() {}
}