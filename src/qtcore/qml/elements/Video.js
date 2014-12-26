window.MediaPlayer = {
  NoError: 0, ResourceError: 1, FormatError: 2, NetworkError: 4, AccessDenied: 8, ServiceMissing: 16,
  StoppedState: 0, PlayingState: 1, PausedState: 2,
  NoMedia: 0, Loading: 1, Loaded: 2, Buffering: 4, Stalled: 8, EndOfMedia: 16, InvalidMedia: 32, UnknownStatus: 64
};

registerQmlType("Video", function QMLVideo(meta) {
  var domVideo;
  var runningEventListener = false;
  var volumeBackup;

  QMLItem.call(this, meta);

  this.dom.innerHTML = "<video></video>";
  domVideo = this.dom.firstChild;
  this.dom.firstChild.style.width = this.dom.firstChild.style.height = "100%";
  this.dom.firstChild.style.margin = "0";

  createSimpleProperty("bool",   this, "autoPlay");
  createSimpleProperty("int",    this, "duration");
  createSimpleProperty("int",    this, "position");
  createSimpleProperty("bool",   this, "muted");
  createSimpleProperty("real",   this, "playbackRate");
  createSimpleProperty("enum",   this, "playbackState");
  createSimpleProperty("string", this, "source");
  createSimpleProperty("real",   this, "volume");
  createSimpleProperty("enum",   this, "status");
  createSimpleProperty("enum",   this, "error");
  this.status = MediaPlayer.NoMedia;
  this.error = MediaPlayer.NoError;
  this.volume = domVideo.volume;
  this.duration = domVideo.duration;
  this.playbackState = MediaPlayer.StoppedState;
  this.muted = false;

  this.paused  = Signal();
  this.playing = Signal();
  this.stopped = Signal();

  this.autoPlayChanged.connect(this, (function(newVal) {
    domVideo.autoplay = newVal;
  }).bind(this));

  domVideo.addEventListener("play", (function() {
    this.playing();
    this.playbackState = MediaPlayer.PlayingState;
  }).bind(this));

  domVideo.addEventListener("pause", (function() {
    this.paused();
    this.playbackState = MediaPlayer.PausedState;
  }).bind(this));

  domVideo.addEventListener("timeupdate", (function() {
    runningEventListener = true;
    this.position = domVideo.currentTime * 1000;
    runningEventListener = false;
  }).bind(this));

  domVideo.addEventListener("ended", (function() {
    this.stopped();
    this.playbackState = MediaPlayer.StoppedState;
  }).bind(this));

  domVideo.addEventListener("progress", (function() {
    if (domVideo.buffered.length > 0) {
      this.progress = domVideo.buffered.end(0) / domVideo.duration;
      this.status   = this.progress < 1 ? MediaPlayer.Buffering : MediaPlayer.Buffered;
    }
  }).bind(this));

  domVideo.addEventListener("stalled", (function() {
    this.status = MediaPlayer.Stalled;
  }).bind(this));

  domVideo.addEventListener("canplaythrough", (function() {
    this.status = MediaPlayer.Buffered;
  }).bind(this));

  domVideo.addEventListener("loadstart", (function() {
    this.status = MediaPlayer.Loading;
  }).bind(this));

  domVideo.addEventListener("durationchanged", (function() {
    this.duration = domVideo.duration;
  }).bind(this));

  domVideo.addEventListener("volumechanged", (function() {
    runningEventListener = true;
    this.volume = demoVideo.volume;
    runningEventListener = false;
  }).bind(this));

  domVideo.addEventListener("suspend", (function() {
    this.error |= MediaPlayer.NetworkError;
  }).bind(this));

  domVideo.addEventListener("error", (function() {
    this.error |= MediaPlayer.ResourceError;
  }).bind(this));

  domVideo.addEventListener("ratechange", (function() {
    runningEventListener = true;
    this.playbackRate = domVideo.playbackRate;
    runningEventListener = false;
  }).bind(this));

  this.pause = (function() {
    domVideo.pause();
  }).bind(this);

  this.play = (function() {
    domVideo.play();
  }).bind(this);

  this.seek = (function(offset) {
    domVideo.currentTime = offset * 1000;
  }).bind(this);

  this.stop = (function() {
  }).bind(this);

  this.mimetypeFromExtension = function(extension) {
    var mimetypes = {
      ogg: 'video/ogg',
      ogv: 'video/ogg',
      ogm: 'video/ogg',
      mp4: 'video/mp4',
      webm: 'video/webm'
    };

    if (typeof mimetypes[extension] == 'undefined')
      return "";
    return mimetypes[extension];
  };

  this.addSource = (function(src) {
    var domSource = document.createElement("SOURCE");
    var parts = src.split('.');
    var extension = parts[parts.length - 1];

    domSource.src  = src;
    domSource.type = this.mimetypeFromExtension(extension.toLowerCase());
    this.dom.firstChild.appendChild(domSource);
    if (domVideo.canPlayType(domSource.type) == "")
      this.error |= MediaPlayer.FormatError;
  }).bind(this);

  this.removeSource = (function() {
    while (domVideo.childNodes.length)
      domVideo.removeChild(video.childNodes.item(0));
  }).bind(this);

  this.sourceChanged.connect(this, (function(source) {
    this.removeSource();
    this.addSource(source);
  }).bind(this));

  this.positionChanged.connect(this, (function(currentTime) {
    if (!runningEventListener)
      domVideo.currentTime = currentTime / 1000;
  }).bind(this));

  this.volumeChanged.connect(this, (function(volume) {
    if (!runningEventListener)
      domVideo.volume = volume;
  }).bind(this));

  this.playbackRateChanged.connect(this, (function(playbackRate) {
    if (!runningEventListener)
      domVideo.playbackRate = playbackRate;
  }).bind(this));

  this.mutedChanged.connect(this, (function(newValue) {
    if (newValue == true) {
      volulmeBackup = domVideo.volume;
      this.volume = 0;
    } else {
      this.volume = volumeBackup;
    }
  }).bind(this));
});
