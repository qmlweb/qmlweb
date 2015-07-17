/**
 * Create QML object
 * QMLObject is inherited by all QML items
 *
 */

/**
 * Create QML property
 *
 * @param   parent  parent of the QObject
 *
 */
var objectIds = 0;

function QObject(parent) {
    this.$parent = parent;
    if (parent && parent.$tidyupList)
        parent.$tidyupList.push(this);
    if (!this.$tidyupList)
        this.$tidyupList = [];
    if (!this.$properties)
        this.$properties = {};

    this.objectId = objectIds++;
    this.$delete = function () {
        while (this.$tidyupList.length > 0) {
            var item = this.$tidyupList[0];
            if (item.$delete)
                item.$delete();
            else
                item.disconnect(this);
        }

        for (var i in this.$properties) {
            var prop = this.$properties[i];
            while (prop.$tidyupList.length > 0)
                prop.$tidyupList[0].disconnect(prop);
        }

        if (this.$parent && this.$parent.$tidyupList)
            this.$parent.$tidyupList.splice(this.$parent.$tidyupList.indexOf(this), 1);
    }
}
