
function QMLList(meta) {
    var list = [];
    if (meta.object instanceof Array) {
        for (var i=0;i<meta.object.length;i++) 
            list.push(construct({object: meta.object[i], parent: meta.parent, context: meta.context }));
    }
    else if (meta.object instanceof QMLMetaElement)
        list.push(construct({object: meta.object, parent: meta.parent, context: meta.context }));

    return list;
}