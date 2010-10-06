require("./server");
var qs = require("querystring");
var url = require("url");
var sys = require("sys");

var PORT = 8000;
var HOST = "127.0.0.1";

app = router.listen(PORT, HOST);

app.get("/client.js", {file : "client.js"});
app.get("/client.html", {file : "client.html"});

app.get("/join", function(params) {
  var nick = params.nick;
  router.log("Connection: " + nick + "@" + params.connection.remoteAddress);
  return "Join: " + nick;
});

app.post("/send", function(params) {
  var message = params.message;
  router.log("Received: " + message);
  var id = Chat.appendMessage(message);
  return {json:id};
});

app.get("/receive", function(params) {
  var id = params.id;
  Chat.messages(id, function(messages) {
    router.log(params.id);
    //router.log(sys.inspect(messages));
    /*return {
      json : messages
    };*/
    params.display(messages);
  });
});

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
    router.log("Requested messages > "+id);
    
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

