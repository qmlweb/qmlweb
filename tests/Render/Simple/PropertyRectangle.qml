import QtQuick 2.0

Rectangle {
  property real r: 3.4
  property int num: Math.round(1.5)
  property var arr: [1, 2, 3]
  property bool foo: true
  property string s: foo ? 'green' : 'red'
  color: s
  width: height * 2
  height: s.length + arr.length * arr[1] + (Math.round(r) - num)
}
