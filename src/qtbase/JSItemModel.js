/**
 * JSItemModel is a QAbstractItemModel like class that allows to create models
 * from javascript, that can later be used from QML. To implement a model,
 * - create a JSItemModel object and add rowCount() and data() functions to the
 *   object
 * - use setRoleNames to define roleNames
 * - emit dataChanged, rowsInserted, rowsMoved, rowsRemoved and modelReset as
 *   your internal data changes.
 *
 * Example:
 *
 * var data = [{ name: "Ann", age: 23},
 *             { name: "John", age: 38},
 *             { name: "Gottlieb", age: 67}];
 * myModel = new JSItemModel();
 *
 * myModel.data = function(index, role) {
 *     if (index > data.length)
 *         return undefined;
 *     return data[index][role];
 * }
 * myModel.rowCount = function() {
 *     return data.length;
 * }
 * myModel.setRoleNames(["name", "age"]);
 *
 */
const JSItemModel = function() {
    this.roleNames = [];

    this.setRoleNames = function(names) {
        this.roleNames = names;
    }

    this.dataChanged = Signal([
        {type:"int", name:"startIndex"},
        {type:"int", name:"endIndex"}
    ]);
    this.rowsInserted = Signal([
        {type:"int", name:"startIndex"},
        {type:"int", name:"endIndex"}
    ]);
    this.rowsMoved = Signal([
        {type:"int", name:"sourceStartIndex"},
        {type:"int", name:"sourceEndIndex"},
        {type:"int", name:"destinationIndex"}
    ]);
    this.rowsRemoved = Signal([
        {type:"int", name:"startIndex"},
        {type:"int", name:"endIndex"}
    ]);
    this.modelReset = Signal();
};

QmlWeb.JSItemModel = JSItemModel;
