describe('QMLEngine.parse', function() {
  setupDivElement();
  var load = prefixedQmlLoader('QMLEngine/qml/Parse');

  it('should throw error with line number and code extract', function() {
    var exception = null;
    try {
      load('Error', this.div);
    } catch (e) {
      exception = e;
    }
    expect(exception).not.toBe(null);
    expect(exception.comment).toContain("properly int error");
    expect(exception.line).toBe(4);
  });

  it("can parse a function assigned to a var property", function() {
    var qml = load('FunctionVar', this.div);
    expect(typeof qml.aFunction).toBe("function");
  });
});
