require("./server");
var qs = require("querystring");
var url = require("url");
var sys = require("sys");

var PORT = 8000;
var HOST = "127.0.0.1";

app = Nodework.listen(PORT, HOST);
app.get("/client.js", {file : "client.js"});
app.get("/client.html", {file : "client.html"});
app.get("/", function(request) {
  request.redirect("/client.html");
});

app.get("/join", function(params) {
  var nick = params.nick;
  log("Connection: " + nick + "@" + params.connection.remoteAddress);
  return "Join: " + nick;
});

app.post("/send", function(params) {
  var message = params.message;
  log("Received: " + message);
  var id = Chat.push(message);
  return {json:id};
});

app.get("/receive", function(request) {
  var id = request.params.id;
  Chat.query(id, function(messages) {
    request.render(messages);
  });
});

Chat = new function() {
  var messages = [];
  var callbacks = [];
    
  this.push = function(text) {
    log("New message received: " + text);
    message = { message:text, id: messages.length };
    messages.push(message);
    
    while (callbacks.length > 0) {
       callbacks.shift().callback({messages: [message], last_id: messages.length});
    }
    
    return messages.length;
  };
  
  this.query = function(id, callback) {
    var result = [];
    id = id ? id : 0;
    log("Requested all messages since ID "+id);
    
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

