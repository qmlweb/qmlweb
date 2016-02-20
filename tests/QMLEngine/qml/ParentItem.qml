Item{
    id: parentItem
    property int value: 100
    property int sum: childA.totalValue + childB.totalValue

    ChildItem{
        id: childA
        value: 2
    }
    ChildItem{
        id: childB
        value: 4
    }
}