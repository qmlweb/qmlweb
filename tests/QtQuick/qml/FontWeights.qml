import QtQuick 2.0

Item {
  property var weights: ["Thin", "ExtraLight", "Light", "Normal", "Medium", "DemiBold", "Bold", "ExtraBold", "Black"]
  property alias repeater: repeater_
  Column {
    Repeater {
      id: repeater_
      model: weights.length
      Text {
        text: weights[index]
        font.weight: eval("Font." + text)
      }
    }
  }
}
