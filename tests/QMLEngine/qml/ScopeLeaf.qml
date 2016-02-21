Item {
  property int value: 2
  property int totalValue: (parentItem.value + rootItem.value) * value
}
