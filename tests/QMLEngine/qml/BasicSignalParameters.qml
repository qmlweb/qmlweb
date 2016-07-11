import QtQuick 2.0

Item {
  id: item

  signal someSignal(int a, string b)

  property int propA
  property string propB

  onSomeSignal: {
    propA = a
    propB = b
  }

  Component.onCompleted: {
    item.someSignal(42, "foo")
  }
}
