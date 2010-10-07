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
  var session = Chat.createSession(nick);
  log("Connection: " + nick + "@" + params.connection.remoteAddress);  
  return session;
});

app.post("/send", function(params) {
  var message = params.message;
  var session = Chat.session(params.key);
  log("Received: " + message + " by " + session.nick);
  var id = Chat.push(message, session.nick);
  return {json:id};
});

app.get("/receive", function(request) {
  var id = request.params.id;
  Chat.query(id, function(messages) {
    request.render(messages);
  });
});

app.get("/who", function(request) {
  return Chat.activeSessions();
});

Chat = new function() {
  var messages  = [];
  var callbacks = [];
  var sessions  = [];
  
  this.key = function(){
		var chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/', // base64 alphabet
			  ret = '';

		for (var bits=32; bits > 0; --bits){
			ret += chars[0x3F & (Math.floor(Math.random() * 0x100000000))];
		}
		return ret;
	};
	
	this.activeSessions = function() {
	  var nicks = [];
    for(i in sessions) {
      nicks.push(sessions[i].nick)
    }
    return nicks;
	};
	
	this.session = function(key) {
	  return sessions[key];
	};
	
	this.createSession = function(nick) {
	  var session = {key:this.key(), nick:nick};
	  sessions[session.key] = session;
	  return session;
	};	

  this.push = function(text, nick) {
    log("New message received: " + text);
    message = { message: text, id: messages.length, nick : nick};
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

