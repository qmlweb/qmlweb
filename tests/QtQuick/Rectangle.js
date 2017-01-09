describe("QtQuick.Rectangle", function() {
  setupDivElement();
  var load = prefixedQmlLoader("QtQuick/qml/Rectangle");

  it("White", function() {
    load("White", this.div);
    var div = this.div.children[0];
    expect(div.children[0].innerHTML).toBe("");
    expect(div.children[0].style.backgroundColor).toBe("rgb(255, 255, 255)");
    expect(div.offsetWidth).toBe(200);
    expect(div.offsetHeight).toBe(100);
    expect(div.clientWidth).toBe(200);
    expect(div.clientHeight).toBe(100);
  });
  it("Color", function() {
    load("Color", this.div);
    var div = this.div.children[0];
    expect(div.children[0].style.backgroundColor).toBe("rgb(255, 0, 0)");
  });
  it("Transparent", function() {
    load("Transparent", this.div);
    var div = this.div.children[0];
    expect(div.children[0].style.backgroundColor).toBe("transparent");
  });
});
