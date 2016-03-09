import QtQuick 2.0

Rectangle {
  property int result: 0

  property int value: 1
  onValueChanged: result += 2

  width: 40
  height: 41

  property string foo: 'foo'
  property string bar: 'bar'

  onWidthChanged: result += 4
  onHeightChanged: result += 8
  onFooChanged: result += 16
  onBarChanged: result += 32

  Component.onCompleted: {
    result += 1;
    width = 41;
    height = 41;
    foo = 'foo';
    bar = '';
    bar = 'bar';
  }
}
