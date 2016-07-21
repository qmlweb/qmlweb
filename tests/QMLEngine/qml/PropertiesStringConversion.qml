import QtQuick 2.0

Item {
  property int intA: 10
  property string stringA: intA
  property string stringB: 11
  property string stringBinding: 1 + 1
  property string stringFalseVal: 0

  function reassign() {
    stringA = 333;
  }
}
