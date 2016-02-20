/**
 * Created by henrik on 20.02.16.
 */
describe('properties', function() {
    var loader = prefixedQmlLoader('QMLEngine/qml/');
    it('assigned values', function() {
        var qml = loader('BasicProperties');
        var div = qml.rootElement
        expect(qml).not.toBe(undefined)
        expect(qml.rootObject).not.toBe(null)
        expect(qml.rootObject.intProperty).toBe(10)
        expect(qml.rootObject.doubleProperty).toBe(0.5)
        expect(qml.rootObject.stringProperty).toBe("hello")
    });

    it('property binding', function() {
        var qml = loader('BoundProperties');
        var obj = qml.rootObject

        expect(obj.intB).toBe(20)
        expect(obj.textB).toBe("hello world")
        obj.intA = 5
        expect(obj.intB).toBe(10)
        obj.textA = "goodbye"
        expect(obj.textB).toBe("goodbye world")

    });

    it('reference by ids', function() {
        var qml = loader('RootItem');
        var obj = qml.rootObject
        var parentItem = contextVariable(obj, "parentItem")
        expect(parentItem).not.toBe(undefined)
        expect(parentItem.$context).not.toBe(undefined)
        var childA = contextVariable(parentItem, "childA")
        expect(childA).not.toBe(undefined)
        var childB = contextVariable(parentItem, "childB")
        expect(childB).not.toBe(undefined)
    });

});