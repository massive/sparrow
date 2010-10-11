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
    var obj = qs.parse(body.replace(/\+/g, ' '));
    var query = qs.parse(url.parse(request.url).query);
    request.response = response;
    var params = {};
    
    for(i in obj) {
      params[i] = obj[i];
      request[i] = obj[i];
    }
    
    for(i in query) {
      params[i] = query[i];
      request[i] = query[i];
    }
    
    request.params = params;
    var handler = Nodework.resolve(request);
    var result = handler(request);
    if(typeof result != "undefined" || typeof result != "boolean")
      request.render(result);
  });
  
  request.render = function(content) {
    if(typeof content == "undefined") {
      log("Render nothing");
      return;
    };
    
    if(content.error) {
      this.output({
        body : content.error,
        code : 400
      });
    }

    log("Rendering "+typeof content);      
        
    if(typeof content == "string") {
      request.output({
        body : content,
        type : 'text/plain'
      });
    } else if(content['json'] || typeof content == 'object') {
      request.output({
        type: 'application/json',
        body: JSON.stringify(content['json'] || content)
      });
    } else {
      request.output(content);
    }      
  };

  request.output = function (content) {  
    var body = content['body'];
    if(typeof content['code'] == "undefined") 
      content['code'] = 200;
      
    response.writeHead(content['code'], 
      { "Content-Type"   : content['type'],
        "Content-Length" : body.length}.extend(content['headers'] || {})
    );
    log("Rendering " + sys.inspect(body));
    response.end(body);
  };
  
  request.redirect = function(location){
    this.output({  
      code: 302,
      headers: [[ 'Location', location ]], 
      body: '<a href="'+ location + '">' + location + '</a>' 
    })
  };  
});

exports = Nodework = new function() {
  var routes = {};
  var self = this;
    
  this.fileHandler = function(filename) {
    return function(request) { 
      self.staticHandler(filename, function () {
        request.response.writeHead(200, []);
        request.response.end(body);
      });
    };
  }
  
  this.staticHandler = function (filename, callback) {
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
  
  this.get = function (path, handler) {
    if(typeof handler == "object") {
      handler = this.fileHandler(handler["file"]);
    }
    routes[path] = handler;
  };

  this.post = function (path, handler) {
    routes[path] = handler;
  };
  
  this.resolve = function(request) {
    return routes[url.parse(request.url).pathname] || self.notFound;
  };

  this.log = function(message, vebosity) {
    if(typeof message != "string")
      message = sys.inspect(message);
      
    sys.puts("["+(new Date()).strftime("%H:%m:%S %d-%m-%Y") + "] " + message);
  };
    
  GLOBAL.log = this.log;
  
  this.notFound = function(request) {
    var NOT_FOUND = "Not Found\n";
    request.response.writeHead(404, { "Content-Type": "text/plain"
                       , "Content-Length": NOT_FOUND.length
                       });
    request.response.end(NOT_FOUND);
  };
  
  this.listen = function(port, host) {
    log("Server at http://" + (host || "127.0.0.1") + ":" + port.toString() + "/");    
    httpServer.listen(Number(process.env.PORT || port), host);
    return self;
  }; 
}












