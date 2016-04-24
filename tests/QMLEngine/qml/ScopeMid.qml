import QtQuick 2.0

Item {
  id: parentItem
  property int value: 100
  property int sum: childA.totalValue + childB.totalValue

  ScopeLeaf {
    id: childA
    value: 2
  }

  ScopeLeaf {
    id: childB
    value: 4
  }
}
