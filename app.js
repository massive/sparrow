require("./server");
var sys = require("sys");
var crypto = require("crypto");

var PORT = 8000;
var HOST = "127.0.0.1";
var SECRET = "LiveChatFI";

app = Nodework.listen(PORT, HOST);
app.get("/client.js", {file : "client.js"});
app.get("/client.html", {file : "client.html"});
app.get("/", function(request) {
  request.redirect("/client.html");
});

app.get("/join", function(params) {
  var nick = params.nick;
  var hash = params.hash;
  var session = Chat.createSession(nick, hash);
  if(session) {
    log("Connection: " + nick + "@" + params.connection.remoteAddress);  
    return session;
  } else {
    return {error : "Hash does not match"}
  }    
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
  
  this.hash = function(data) {
    return crypto.createHmac("sha1", SECRET).update(data).digest("hex");
  };
  	
	this.activeSessions = function() {
	  var nicks = [];
    for(i in sessions) {
      if(sessions[i].hasOwnProperty("nick"))
        nicks.push(sessions[i].nick);
    }
    return nicks;
	};
	
	this.session = function(key) {
	  return sessions[key];
	};
	
	this.createSession = function(nick, hash) {
	  var session = {key:this.hash(nick), nick:nick};
	  if(this.hash(nick) == hash) {
	    sessions[session.key] = session;
	    return session;
	  } else {
	    log("Got hash "+hash+". Expected hash "+this.hash(nick));
	    return false;
	  }
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
      while (callbacks.length > 0 && now - callbacks[0].timestamp > 30*1000) {
        callbacks.shift().callback({messages: [], last_id: messages.length});
      }
    }, 3000);    
  };
};

