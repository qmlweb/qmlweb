// Base object for all qml thingies
var objectIds = 0;
function QObject(parent) {
    this.$parent = parent;
    if (parent && parent.$tidyupList)
        parent.$tidyupList.push(this);
    // List of things to tidy up when deleting this object.
    if (!this.$tidyupList)
        this.$tidyupList = [];
    if (!this.$properties)
        this.$properties = {};

    this.objectId = objectIds++;
    this.$delete = function() {
        var item;
        while (this.$tidyupList.length > 0) {
            item = this.$tidyupList[0];
            if (item.$delete) {// It's a QObject
                item.$delete();
                item.parent = undefined;
            }
            else // It must be a signal
                item.disconnect(this);
        }

        var prop;
        for (var i in this.$properties) {
            prop = this.$properties[i];
            while (prop.$tidyupList.length > 0)
                prop.$tidyupList[0].disconnect(prop);
        }

        if (this.$parent && this.$parent.$tidyupList)
            this.$parent.$tidyupList.splice(this.$parent.$tidyupList.indexOf(this), 1);
    }
}
