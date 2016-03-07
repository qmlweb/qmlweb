import QtQuick 2.0

Item {
  property var a: 'a_init_value'
  property var b: 'b_init_value'
  property var c: ''
  property var d
  property var p
  property var q


  function foo() {
    a = '333';
    var b = '3local';
    var c = b;
    d = b;
    p = q = 17;
  }

  Component.onCompleted: foo()

  Text {
    text: 'a=' + a + ' b=' + b;
  }
}
