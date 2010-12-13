require("./extensions");

var sys = require("sys");
var url = require("url");
var http = require("http");
var qs = require("querystring");
var readFile = require("fs").readFile;

httpServer = http.createServer(function (request, response) {
  var self = this;
  var body = '';

  log("Requested URL: "+request.url);
  
  request.addListener('data', function(chunk){
     body += chunk;
  });

  request.addListener('end', function() {
    var obj   = qs.parse(body.replace(/\+/g, ' '));
    var query = qs.parse(url.parse(request.url).query);
    var that = this;
    
    request.parameters = {};
    request.response = response;
    
    obj.each(function(key, value) {
      that.parameters[key] = value;
    });
    
    query.each(function(key, value) {
      that.parameters[key] = value;
    });
    
    var handler = Sparrow.resolve(request);
    try {
      var result = handler.bind(request)(request);
    } catch(err) {
      log(err, Sparrow.LOG_LEVEL_ERROR);
      this.writeOut({
        body : err.message,
        code : 500
      });
    }
    if(typeof result != "undefined" || typeof result != "boolean")
      request.render(result);
  });
  
  request.params = function(param) {
    log("Fetch param "+param)
    return this.parameters[param] || null;
  };
  
  request.render = function(content) {
    if(typeof content == "undefined") {
      log("Render nothing");
      return;
    };
    
    if(content.text) {
      this.writeOut({
        body : content.error,
        code : 400
      });
    }

    log("CONTENT TYPE "+typeof content);      
        
    if(typeof content == "string") {
      request.writeOut({
        body : content,
        type : 'text/plain'
      });
    } else if(content['json'] || typeof content == 'object') {
      request.writeOut({
        type: 'application/json',
        body: JSON.stringify(content['json'] || content)
      });
    } else {
      request.writeOut(content);
    }      
  };

  request.writeOut = function (content) {  
    var body = content['body'];
    if(typeof content['code'] == "undefined") 
      content['code'] = 200;
      
    response.writeHead(content['code'], 
      { "Content-Type"   : content['type'],
        "Content-Length" : body.length}.extend(content['headers'] || {})
    );
    log("CONTENT: " + sys.inspect(body));
    response.end(body);
  };
  
  request.path = function() {
    return url.parse(request.url).pathname;
  }
  
  request.redirect = function(location){
    this.writeOut({  
      code: 302,
      headers: [[ 'Location', location ]], 
      body: '<a href="'+ location + '">' + location + '</a>' 
    })
  };  
});

Sparrow = new function() {
  this.routes = {};
  this.config = {};
  var self = this;
  LOG_LEVEL_ERROR = 10;
    
  this.fileHandler = function(filename) {
    return function(request) { 
      self.staticHandler(filename, function () {
        request.response.writeHead(200, []);
        request.response.end(body);
      });
    };
  }
  
  this.staticHandler = function (filename, callback) {
    var filename = this.config.root + filename;
    log("Loading file " + filename);    
    readFile(filename, function (err, data) {
      if (err) {
        log("Error loading " + filename);
      } else {
        body = data;
        log("Static file " + filename + " loaded");
        callback();
      }
    });    
  };
  
  
  ['get', 'post', 'delete', 'update'].each(function(i, method) {
    self.routes[method.toUpperCase()] = [];
    this[method] = function (path, handler) {
      self.addRouteFor(method.toUpperCase(), path, handler);
    };    
  });
  
  this.addRouteFor = function(method, path, handler) {
    if(typeof path == 'string') {
      var path_as_regexp = path;
      var route_keys;
      
      path_as_regexp = path_as_regexp.replace(/\//g, "\\/");
      path_as_regexp = path_as_regexp.replace(/:(\w+)/g, '(\\w+)')
      path_as_regexp = "^"+path_as_regexp+"$"
      
      var route_keys = [];
      
      var matches = path.match(/:\w+/g);
      if(matches) {
        matches.each(function(i, match) {
          route_keys.push(match.substr(1));
        });
      }
      
      self.routes[method].push({
        route : new RegExp(path_as_regexp),
        keys : route_keys,
        handler : handler
      })
    }
  };
  
  this.findRouteFor = function(method, path) {    
    var routes_for_method = self.routes[method];    
    for(var i = 0; i < routes_for_method.length; i++) {
      var route_as_regexp = routes_for_method[i].route;      
      
      if(path.match(route_as_regexp)) {
        return routes_for_method[i];
      }
    }
    return null;
  };
  
  this.resolve = function(request) {
    var route_set = this.findRouteFor(request.method, request.path()) || self.notFound;
    
    if(route_set) {      
      if(request.method == "GET" && route_set.handler.file) {
        return self.fileHandler(route_set.handler.file)
      } 
      
      if(route_set.keys)
        self.extract_route_parameters(route_set, request);
        
      return route_set.handler;
    } else {
      return self.notFound;
    }
  };
  
  this.extract_route_parameters = function(route_set, request) {
    var path = request.path();
    var keys = route_set.keys;
    
    var matches = path.match(route_set.route);
        
    for(i = 0; i < keys.length; i++) {
      var key = keys[i];
      var value = matches[i+1];
      request.parameters[key] = value;      
    }
    
    log(request);
    
  };

  this.log = function(message, vebosity) {
    if(typeof message != "string")
      message = sys.inspect(message);
      
    sys.puts("["+(new Date()).strftime("%H:%m:%S %d-%m-%Y") + "] " + message);
  };
  
  ['log'].each(function(i, func) {
    GLOBAL[func] = self[func];
  });
  
  this.notFound = function(request) {
    var NOT_FOUND = ""+request.method+": "+request.url+" Not Found\n";
    request.response.writeHead(404, { 
        "Content-Type": "text/plain",
        "Content-Length": NOT_FOUND.length
    });
    request.response.end(NOT_FOUND);
  };
  
  this.config = function(configuration) {
    this.config = configuration;
  };
  
  this.start = function() {
    log("Server at http://" + (this.config.host || "127.0.0.1") + ":" + this.config.port.toString() + "/");    
    httpServer.listen(Number(process.env.PORT || this.config.port), this.config.host);
    return self;
  }; 
}

exports = Sparrow;
