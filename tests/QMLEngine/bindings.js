describe("QMLEngine.bindings", function() {
  setupDivElement();
  var load = prefixedQmlLoader("QMLEngine/qml/Bindings");

  it("NoSrc", function() {
    load("NoSrc", this.div);
    var div = this.div.children[0];
    expect(div.offsetWidth).toBe(10);
    expect(div.offsetHeight).toBe(12);
  });

  it("update immediately", function() {
    var qml = load("Update", this.div);
    expect(qml.intB).toBe(20);
    expect(qml.textB).toBe("hello world");
    expect(qml.sizeWidth).toBe(1);
    expect(qml.sizeHeight).toBe(2);
    qml.intA = 5;
    expect(qml.intB).toBe(10);
    qml.textA = "goodbye";
    expect(qml.textB).toBe("goodbye world");
    qml.size.width = 3;
    expect(qml.sizeWidth).toBe(3);
  });

  /* This test case shows that QMLProperty.js::get() method should check
     if property itself is already evaluated or not. If it sees itself as
     non-evaluated yet, it must evaluate self before returning the result.
     If property lacks that evaluation, the get will return 'undefined' value.
  */
  it("RecursiveInit", function() {
    var qml = load("RecursiveInit", this.div);
    expect(qml.log).toBe("Fly to planet N5!");
  });

  /* This test case shows that if QMLProperty.js::get() evaluates self
     before returning the result, it might meet another properties
     and call their's gets. That's why the case is called recursive.
     This exposes us that `evaluatingProperty` variable is not enought
     to track changed's signals connections, because it is being reset
     to undefined value after each use, and we must use stack for that.
  */
  it("RecursiveInit2", function() {
    var qml = load("RecursiveInit2", this.div);
    qml.retarget();
    expect(qml.log).toBe("Fly to planet N10!Fly to planet N15!");
  });

  // must have exactly 1 call of changed signal
  it("RecursiveInit3", function() {
    var qml = load("RecursiveInit3", this.div);
    expect(qml.log).toBe("Fly to planet N6!");
  });

  // must have exactly 0 call of changed signal
  it("RecursiveInit4", function() {
    var qml = load("RecursiveInit4", this.div);
    expect(qml.log).toBe("");
  });

  it("can be bound inside an array", function() {
    var qml = load("Array", this.div);
    expect(qml.bindingArray[3][1]).toBe(2);
    qml.value++;
    expect(qml.bindingArray[3][1]).toBe(3);
  });

  it("this", function() {
    var qml = load("This", this.div);
    expect(qml.intA).toBe(10);
    expect(qml.intB).toBe(20);
    expect(qml.foo()).toBe(30);
  });
});
