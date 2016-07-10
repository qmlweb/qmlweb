describe("QtQuick.Item", function() {
  setupDivElement();
  var load = prefixedQmlLoader("QtQuick/qml/Item");

  it("Empty", function() {
    load("Empty", this.div);
    expect(this.div.innerHTML).toBe("");
    expect(this.div.style.backgroundColor).toBe("");
  });
  it("Size", function() {
    load("Size", this.div);
    expect(this.div.offsetWidth).toBe(200);
    expect(this.div.offsetHeight).toBe(100);
    expect(this.div.clientWidth).toBe(200);
    expect(this.div.clientHeight).toBe(100);
  });
});
