import QtQuick 2.0

Item {
  property color foo: "#abcDEF"
  property color bar: "#abcdef"

  property var trueTests: [
    foo === bar,
    foo == bar,
    foo == "#abcdef"
  ]
  property var falseTests: [
    foo === "#abcDEF",
    foo == "#abcDEF",
    foo === "#abcdef"
  ]
}
