registerQmlType({
  module:   'QtMobility',
  name:     'GeoLocation',
  versions: /.*/,
  baseClass: "QtQuick.Item",
  properties: {
    accuracy: "double",
    altitude: "double",
    altitudeAccuracy: "double",
    heading: "double",
    latitude: "double",
    longitude: "double",
    speed: "double",
    timestamp: "date",
    label: "string"
  }
}, class {
  constructor(meta) {
    callSuper(this, meta);
    var self = this;

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
