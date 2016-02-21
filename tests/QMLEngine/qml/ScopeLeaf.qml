Item {
    property int value: 1
    property int rootValue: rootItem.value
    property int parentValue: parentItem.value
    property int totalValue: rootValue + parentValue
}