var sys = require("sys");
var url = require("url");
var http = require("http");
var qs = require("querystring");
var readFile = require("fs").readFile;

var PORT = 8000;
var HOST = "127.0.0.1";
var NOT_FOUND = "Not Found\n";

var getMap = {};
var postMap = {};
var chat = {};

chat = new function() {
  var messages = [];
  var callbacks = [];
  
  this.fileMap = function(path, filename) {            
    chat.get(path, function(req, res) {
      chat.staticHandler(filename, function () {
        res.writeHead(200, []);
        res.end(body);
      })
    });    
  };
  
  this.staticHandler = function (filename, callback) {
    chat.log("loading " + filename + "...");
    readFile(filename, function (err, data) {
      if (err) {
        chat.log("Error loading " + filename);
      } else {
        body = data;
        chat.log("Static file " + filename + " loaded");
        callback();
      }
    });    
  };
  
  this.appendMessage = function(text) {
    chat.log("New message: " + text);
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
    chat.log("Since: "+id);
    
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
      while (callbacks.length > 0 && now - callbacks[0].timestamp > 3*1000) {
        callbacks.shift().callback({messages: [], last_id: messages.length});
      }
    }, 3000);      
  };
};

chat.log = function(message, vebosity) {
  sys.puts(Date.now() + ": " + sys.inspect(message));
}

chat.get = function (path, handler) {
  getMap[path] = handler;
};

chat.post = function (path, handler) {
  postMap[path] = handler;
};

chat.getPostParams = function(req, res, callback, context) {  
  var body = '';
  req.addListener('data', function(chunk){
     body += chunk;
  });

  req.addListener('end', function() {
    var obj = qs.parse(body.replace(/\+/g, ' '));
    callback.bind(context)(req,res,obj);
  });
}

chat.listen = function (port, host) {
  server.listen(port, host);
  sys.puts("Server at http://" + (host || "127.0.0.1") + ":" + port.toString() + "/");
};


function notFound(req, res) {
  res.writeHead(404, { "Content-Type": "text/plain"
                     , "Content-Length": NOT_FOUND.length
                     });
  res.end(NOT_FOUND);
}

Function.prototype.bind = function(thisValue) {
    var f = this;
    return function() {
        return f.apply(thisValue, arguments);
    };
};
        
var server = http.createServer(function (req, res) {
  var self = this;
  chat.log("Request URL: "+req.url);
      
  res.render = function (renderable, opts) {  
    var body = renderable;
    
    opts = opts || {}
    opts['Content-Type'] = "text/plain";
    
    if(opts['json']) {
      body = JSON.stringify(renderable);
      opts['Content-Type'] = "javascript/json";
    }
    
    if(typeof opts['code'] == "undefined") 
      opts['code'] = 200;
    
    res.writeHead(opts['code'], 
      { "Content-Type"   : opts['Content-Type'],
        "Content-Length" : body.length
      }
    );
    chat.log("Rendering "+body);    
    res.end(body);
  };
    
  this.res = res;
  this.req = req;
  
  this.response = function() {
    return self.res;
  }

  this.request = function() {
    return self.req;
  }
    
  if(req.method == "GET") {
    var handler = getMap[url.parse(req.url).pathname] || notFound;
    handler.bind(this)(req, res);
  } else {
    var handler = postMap[url.parse(req.url).pathname] || notFound;
    chat.getPostParams(req, res, handler);
  }  
})

chat.listen(Number(process.env.PORT || PORT), HOST);

chat.fileMap("/client.js", "client.js");
chat.fileMap("/client.html", "client.html");

chat.get("/join", function(req, res) {
  var nick = qs.parse(url.parse(this.request().url).query).nick;  
  res.render("Join: " +nick);
  chat.log("Connection: " + nick + "@" + this.response().connection.remoteAddress);
});

chat.post("/send", function(req, res, data) {
  var message = data.message;
  var id = chat.appendMessage(message);
});

chat.get("/receive", function(req, res) {
  var query = qs.parse(url.parse(req.url).query);
  var id = query.id;
  var self = this;
  chat.messages(id, function(messages) {
    res.render(messages, {json:true});
  });
});