require("./extensions");

var sys = require("sys");
var url = require("url");
var http = require("http");
var qs = require("querystring");
var readFile = require("fs").readFile;

var NOT_FOUND = "Not Found\n";

var chat = {};

Function.prototype.bind = function(thisValue) {
    var f = this;
    return function() {
        return f.apply(thisValue, arguments);
    };
};

httpServer = http.createServer(function (req, res) {
  var self = this;
  var body = '';

  router.log("Request URL: "+req.url);
  
  req.addListener('data', function(chunk){
     body += chunk;
  });

  req.addListener('end', function() {
    var obj = qs.parse(body.replace(/\+/g, ' '));
    var query = qs.parse(url.parse(req.url).query);
    req.response = res;
    
    for(i in obj) {
      req[i] = obj[i];
    }
    
    for(i in query) {
      req[i] = query[i];
    }
    
    var handler = router.resolve(req);
    var result = handler(req);
    req.display(result);
  });
  
  req.display = function(content) {
    if(typeof content == "undefined") {
      router.log("Render nothing");
      return;
    };
    
    if(typeof content == "string") {
      router.log("Render String");      
      req.render({
        body : content,
        type : 'text/plain'
      });
    } else if(content['json'] || typeof content == 'object') {
      router.log("Render JSON");      
      req.render({
        type: 'application/json',
        body: JSON.stringify(content['json'] || content)
      });
    } else {
      router.log("Render something");      
      req.render(content);
    }      
  };

  req.render = function (content) {  
    var body = content['body'];

    if(typeof content['code'] == "undefined") 
      content['code'] = 200;

    res.writeHead(content['code'], 
      { "Content-Type"   : content['type'],
        "Content-Length" : body.length
      }
    );
    router.log("Rendering " + sys.inspect(body));
    res.end(body);
  };  
});

exports = router = new function() {
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
    self.log("Loading file " + filename);
    readFile(filename, function (err, data) {
      if (err) {
        self.log("Error loading " + filename);
      } else {
        body = data;
        self.log("Static file " + filename + " loaded");
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
  }

  this.log = function(message, vebosity) {
    if(typeof message != "string")
      message = sys.inspect(message);
      
    sys.puts("["+(new Date()).strftime("%H:%m:%S %d-%m-%Y") + "] " + message);
  };
  
  this.notFound = function(req, res) {
    req.response.writeHead(404, { "Content-Type": "text/plain"
                       , "Content-Length": NOT_FOUND.length
                       });
    req.response.end(NOT_FOUND);
  };
  
  this.listen = function(port, host) {
    router.log("Server at http://" + (host || "127.0.0.1") + ":" + port.toString() + "/");    
    httpServer.listen(Number(process.env.PORT || port), host);
    return self;
  }; 
}












