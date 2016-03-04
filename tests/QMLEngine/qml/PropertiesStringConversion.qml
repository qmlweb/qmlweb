import QtQuick 2.0
import QtQuick.Controls 1.1

Item {
  property int intA: 10
  property string stringA: intA
  property string stringB: 11

  function reassign() {
    stringA = 333;
  }

  Column {
    Text {
      text: stringA + typeof(stringA)
    }
    Button {
      onClicked: reassign()
      text: "Reassign"
    }
  }
}
