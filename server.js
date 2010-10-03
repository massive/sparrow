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
  router.log("Request URL: "+req.url);
  var body = '';
  
  req.addListener('data', function(chunk){
     body += chunk;
  });

  req.addListener('end', function() {
    var obj = qs.parse(body.replace(/\+/g, ' '));
    var handler = router.resolve(req);
    handler(req, res, obj);
  });

  res.render = function (content, opts) {  
    var body = content;

    opts = opts || {}
    opts['Content-Type'] = "text/plain";

    if(opts['json']) {
      body = JSON.stringify(content);
      opts['Content-Type'] = "javascript/json";
    }

    if(typeof opts['code'] == "undefined") 
      opts['code'] = 200;

    res.writeHead(opts['code'], 
      { "Content-Type"   : opts['Content-Type'],
        "Content-Length" : body.length
      }
    );
    router.log("Rendering "+body);    

    res.end(body);
  };
  
});


var router = new function() {
  var routes = {};
  var self = this;
  
  this.fileMap = function(path, filename) {            
    self.get(path, function(req, res) {
      self.staticHandler(filename, function () {
        res.writeHead(200, []);
        res.end(body);
      })
    });    
  };
  
  this.staticHandler = function (filename, callback) {
    self.log("loading " + filename + "...");
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
    routes[path] = handler;
  };

  this.post = function (path, handler) {
    routes[path] = handler;
  };
  
  this.resolve = function(request) {
    return routes[url.parse(request.url).pathname] || self.notFound;
  }

  this.listen = function (port, host) {
    self.log("Server at http://" + (host || "127.0.0.1") + ":" + port.toString() + "/");
    server.listen(port, host);
  };

  this.log = function(message, vebosity) {
    sys.puts(Date.now() + ": " + sys.inspect(message));
  };
  
  this.notFound = function(req, res) {
    res.writeHead(404, { "Content-Type": "text/plain"
                       , "Content-Length": NOT_FOUND.length
                       });
    res.end(NOT_FOUND);
  };
  
  this.handler = function(route) {
    
  };
  
  this.listen = function(port, host) {
    httpServer.listen(Number(process.env.PORT || port), host);
    return self;
  }; 
}
      

Chat = new function() {
  var messages = [];
  var callbacks = [];
    
  this.appendMessage = function(text) {
    router.log("New message: " + text);
    m = {message:text, id: messages.length};
    messages.push(m);
    
    while (callbacks.length > 0) {
       callbacks.shift().callback({messages: [m], last_id: messages.length});
    }
    
    return messages.length;
  };
  
  this.messages = function(id, callback) {
    var result = [];
    id = id ? id : 0;
    router.log("Since: "+id);
    
    for(i = id; i < messages.length; i++) {
      result.push(messages[i]);
    }
    
    if (result.length != 0) {
      callback({messages: result, last_id: messages.length});
    } else {
      callbacks.push({timestamp: new Date(), callback: callback });
    }
    
    setInterval(function () {
      var now = new Date();
      while (callbacks.length > 0 && now - callbacks[0].timestamp > 1*1000) {
        callbacks.shift().callback({messages: [], last_id: messages.length});
      }
    }, 3000);      
  };
};












var PORT = 8000;
var HOST = "127.0.0.1";

app = router.listen(PORT, HOST);

app.fileMap("/client.js", "client.js");
app.fileMap("/client.html", "client.html");

app.get("/join", function(req, res) {
  var nick = qs.parse(url.parse(req.url).query).nick;  
  res.render("Join: " +nick);
  router.log("Connection: " + nick + "@" + res.connection.remoteAddress);
});

app.post("/send", function(req, res, data) {
  router.log("Received: "+data);
  var message = data.message;
  var id = Chat.appendMessage(message);
  res.render({id:id}, {json:true});
});

app.get("/receive", function(req, res) {
  var query = qs.parse(url.parse(req.url).query);
  var id = query.id;
  var self = this;
  sys.puts(sys.inspect(this));
  Chat.messages(id, function(messages) {
    res.render(messages, {json:true});
  });
});

