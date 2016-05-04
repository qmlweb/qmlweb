registerQmlType({
  module:   'QtGraphicalEffects',
  name:     'FastBlur',
  versions: /.*/,
  baseClass: 'QtQuick.Item',
  constructor: function QMLFastBlur(meta) {
    callSuper(this, meta);

    var previousSource = null;
    var filterObject;

    createProperty("real", this, "radius");
    createProperty("var",  this, "source");
    this.radius = 0;
    this.source = null;

    var updateFilterObject = (function() {
      filterObject = {
        transformType: 'filter',
        operation:     'blur',
        parameters:    this.radius + 'px'
      };
    }).bind(this);

    function stripEffectFromSource(source) {
      if (previousSource != null) {
        var index = previousSource.transform.indexOf(filterObject);

        previousSource.transform.splice(index, 1);
        previousSource.$updateTransform();
      }
    }

    function updateEffect(source) {
      console.log("updating effect");
      stripEffectFromSource(previousSource);
      if (source != null && typeof source.transform != 'undefined') {
        updateFilterObject();
        console.log("updating effect:", filterObject, source);
        source.transform.push(filterObject);
        source.$updateTransform();
        previousSource = source;
      } else {
        previousSource = null;
      }
    }

    this.radiusChanged.connect(this, (function(newVal) {
      updateEffect(this.source);
    }).bind(this));

    this.sourceChanged.connect(this, (function(newVal) {
      updateEffect(this.source);
    }).bind(this));
  }
});
