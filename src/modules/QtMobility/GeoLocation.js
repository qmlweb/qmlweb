registerQmlType({
  module:   'QtMobility',
  name:     'GeoLocation',
  versions: /.*/,
  baseClass: 'QtQuick.Item',
  constructor: function QMLGeoLocation(meta) {
    callSuper(this, meta);
    var self = this;

    createProperty("double", this, "accuracy");
    createProperty("double", this, "altitude");
    createProperty("double", this, "altitudeAccuracy");
    createProperty("double", this, "heading");
    createProperty("string", this, "label");
    createProperty("double", this, "latitude");
    createProperty("double", this, "longitude");
    createProperty("double", this, "speed");
    createProperty("date",   this, "timestamp");

    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition
    }

    var updatePosition = (function(position) {
      this.accuracy         = position.coords.accuracy;
      this.altitude         = position.coords.altitude;
      this.altitudeAccuracy = position.coords.altitudeAccuracy;
      this.heading          = position.coords.heading;
      this.latitude         = position.coords.latitude;
      this.longitude        = position.coords.longitude;
      this.speed            = position.coords.speed;
      this.timestamp        = position.timestamp;
    }).bind(this);

    navigator.geolocation.getCurrentPosition(updatePosition);
    navigator.geolocation.watchPosition(updatePosition);
  }
});
