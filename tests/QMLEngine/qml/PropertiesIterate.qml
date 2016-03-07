Item {
  property int prop1: 10
  property int prop2: 20
  property int prop3: 30
  property int count: 0
  Component.onCompleted: {
    console.log("Completed!!")
    for (var prop in this) {
      count += 1
    }
  }
}
