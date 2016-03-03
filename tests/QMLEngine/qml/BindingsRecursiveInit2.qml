import QtQuick 2.2
import QtQuick.Controls 1.0

Item {
  width: 800
  property int intA: 10 / intB + intD
  property int intB: intC
  property int intC: 1
  property int intD: 0

  onIntAChanged: launch()

  property var log: ""
  function launch() {
    // perform something expensive and important,
    // where intA value really matters
    log = log + "Fly to planet N" + intA + "!"; 
  }

  function retarget() {
    intD = 5;
  }

  Text {
    text: log
  }

  Button {
    y: 30
    text: "retarget!"
    onClicked: retarget()
  }
}
