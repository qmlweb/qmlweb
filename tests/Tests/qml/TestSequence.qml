import QtQuick 2.0
import "../../common"

Item {
  property int value: 1
  TestCase {
    name: "first"
    function test(done) {
      value = 2;
      done();
    }
  }
  TestCase {
    name: "second"
    function test(done) {
      value = 3;
      done();
    }
  }
}
