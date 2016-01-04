registerQmlType({
  module:   'QmlWeb',
  name:     'RestModel',
  versions: /.*/,
  baseClass: QMLItem,
  constructor: function QMLRestModel(meta) {
    QMLItem.call(this, meta);
    var self = this;
    var attributes = this.getAttributes();

    createSimpleProperty("string", this, "url");
    createSimpleProperty("bool",   this, "isLoading");
    createSimpleProperty("string", this, "mimeType");
    createSimpleProperty("string", this, "queryMimeType");

    this.mimeType      = "application/json";
    this.queryMimeType = "application/x-www-urlencoded";
    this.isLoading     = false;
    this.attributes    = attributes;

    this.fetched = Signal();
    this.saved   = Signal();

    this.runningRequests = 0;

    this.fetch = function() {
      ajax({
        method:   'GET',
        mimeType: self.mimetype,
        success: function(xhr) {
          xhrReadResponse(xhr);
          self.fetched();
        }
      });
    };

    this.create = function() {
      sendToServer('POST');
    };

    this.save = function() {
      sendToServer('PUT');
    };

    function sendToServer(method) {
      var body = generateBodyForPostQuery();

      ajax({
        method:   method,
        mimeType: self.queryMimeType,
        body:     body,
        success:  function(xhr) {
          xhrReadResponse(xhr);
          self.saved();
        }
      });
    }

    this.remove = function() {
      ajax({
        method: 'DELETE',
        success: function(xhr) {
          self.destroy();
        }
      });
    };

    function generateBodyForPostQuery() {
      var object     = {};
      var body;

      for (var i = 0 ; i < self.attributes.length ; ++i)
        object[self.attributes[i]] = self.$properties[self.attributes[i]].get();
      console.log(object);
      if (self.queryMimeType == 'application/json' || self.queryMimeType == 'text/json')
        body = JSON.stringify(object);
      else if (self.queryMimeType == 'application/x-www-urlencoded')
        body = objectToUrlEncoded(object);
      return body;
    }

    function myEncodeURIComponent(str) {
      return encodeURIComponent(str).replace(/[!'()*]/g, function (c) {
        return '%' + c.charCodeAt(0).toString(16);
      });
    }

    function objectToUrlEncoded(object, prefix) {
      var str = '';
      for (var key in object) {
        if (object.hasOwnProperty(key)) {
          var value = object[key];
          if (str != '')
            str += '&';
          if (typeof prefix != 'undefined')
            key  = prefix + '[' + key + ']';
          if (typeof value == 'object')
            str += objectToUrlEncoded(value, key);
          else
            str += myEncodeURIComponent(key) + '=' + myEncodeURIComponent(value);
        }
      }
      return str;
    }

    function ajax(options) {
      var xhr = new XMLHttpRequest();

      xhr.overrideMimeType(self.mimeType);
      xhr.onreadystatechange = function() {
        if (xhr.readyState == XMLHttpRequest.DONE) {
          if (xhr.status == 200)
            options.success(xhr);
          else
            options.failure(xhr);
          self.runningRequests -= 1;
          if (self.runningRequests <= 0)
            self.isLoading = false;
        }
      }
      xhr.open(options.method, self.url, true);
      if (typeof options.body != 'undefined') {
        xhr.setRequestHeader('Content-Type', self.queryMimeType);
        xhr.send(options.body);
      }
      else
        xhr.send(null);
      self.runningRequests += 1;
      self.isLoading = true;
    }

    function xhrReadResponse(xhr) {
      var responseObject;

      if (self.mimeType == 'application/json' || self.mimeType == 'text/json') {
        responseObject = JSON.parse(xhr.responseText);
      }
      updatePropertiesFromResponseObject(responseObject);
    }

    function updatePropertiesFromResponseObject(responseObject) {
      for (var key in responseObject) {
        if (responseObject.hasOwnProperty(key) && self.$hasProperty(key)) {
          self.$properties[key].set(responseObject[key]);
        }
      }
    }

    this.$hasProperty = function(name) {
      return (typeof self.$properties[name] != 'undefined');
    }
  }
});
