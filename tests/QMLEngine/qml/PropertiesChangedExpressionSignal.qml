import QtQuick 2.0

Item {
  property int counter: 0

  property int value: 0
  Component.onCompleted: value++

  property int foo: value > 0 ? 1 : 0
  onFooChanged: counter++
}
