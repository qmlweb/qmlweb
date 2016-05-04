function QMLDomElement(meta) {
    callSuper(this, meta);
    var tagName = meta.object.tagName || 'div';
    this.dom = document.createElement(tagName);

    createProperty('string', this, 'tagName');

    // TODO: support properties, styles, perhaps changing the tagName
}

registerQmlType({
    module: 'QmlWeb.Dom',
    name: 'DomElement',
    versions: /.*/,
    baseClass: 'QtQuick.Item',
    constructor: QMLDomElement
});
