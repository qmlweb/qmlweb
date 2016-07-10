describe("QtQuick.Rectangle", function() {
  setupDivElement();
  var load = prefixedQmlLoader("QtQuick/qml/Rectangle");

  it("White", function() {
    load("White", this.div);
    expect(this.div.children[0].innerHTML).toBe("");
    expect(this.div.children[0].style.backgroundColor).toBe("white");
    expect(this.div.offsetWidth).toBe(200);
    expect(this.div.offsetHeight).toBe(100);
    expect(this.div.clientWidth).toBe(200);
    expect(this.div.clientHeight).toBe(100);
  });
  it("Color", function() {
    load("Color", this.div);
    expect(this.div.children[0].style.backgroundColor).toBe("red");
  });
  it("Transparent", function() {
    load("Transparent", this.div);
    expect(this.div.children[0].style.backgroundColor).toBe("transparent");
  });
});
