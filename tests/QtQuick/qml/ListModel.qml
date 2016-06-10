import QtQuick 2.5

ListModel {
  id: fruitModel

  ListElement {
    name: "Apple"
    cost: 2.45
    attributes: [
      ListElement { description: "Core" },
      ListElement { description: "Deciduous" }
    ]
  }
  ListElement {
    name: "Orange"
    cost: 3.25
    attributes: [
      ListElement { description: "Citrus" }
    ]
  }
  ListElement {
    name: "Banana"
    cost: 1.95
    attributes: [
      ListElement { description: "Tropical" },
      ListElement { description: "Seedless" }
    ]
  }
}
