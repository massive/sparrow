require("./jack");
var sys = require("sys");
var crypto = require("crypto");

var PORT = 8000;
var HOST = "127.0.0.1";
var SECRET = "TopSecretPassCode";

app = Jack.listen(PORT, HOST);
app.get("/client.js", {file : "client/client.js"});
app.get("/client.html", {file : "client/client.html"});
app.get("/base.css", {file : "client/base.css"});

app.get("/", function(request) {
  request.redirect("/client.html");
});

app.get("/join", function(request) {
  var nick = request.nick;
  var hash = request.hash;
  
  log("Connection: " + nick + "@" + request.connection.remoteAddress);  
  
  var result = Chat.join(nick, hash);
  return result;
});

app.post("/send", function(params) {
  var message = params.message;
  var session = Chat.session(params.hash);
  log(params.hash)  
  log("Received: " + message + " by " + session.nick);
  
  var id = Chat.push(message, session.nick);
  return { 
    json : id 
  };
});

app.get("/receive", function(request) {
  var id = request.params.id;
  Chat.query(id, function(messages) {
    request.render(messages);
  });
});

app.get("/who", function(request) {
  return Chat.users();
});

Chat = new function() {
  var messages  = [];
  var callbacks = [];
  var sessions  = [];
  
  this.hash = function(data) {
    return crypto.createHmac("sha1", SECRET).update(data).digest("hex");
  };
  	
	this.users = function() {
	  var nicks = [];
    for(i in sessions) {
      if(sessions[i].hasOwnProperty("nick"))
        nicks.push(sessions[i].nick);
    }
    return nicks;
	};
	
	this.session = function(hash) {
	  return sessions[hash];
	};
	
	this.join = function(nick, hash) {
	  var session = { 
	    hash : this.hash(nick), 
	    nick : nick 
	  };
	  if(this.hash(nick) == hash) {
	    sessions[session.hash] = session;
	    this.send('new_user', {
        users    : this.users(),
        new_user : nick
      });
      return session;
	  } else {
	    log("Got hash "+hash+". Expected hash "+this.hash(nick));
	    return {error:"invalid hash"}
	  }
	};
	
	this.send = function(op, object) {
	  while (callbacks.length > 0) {
      callbacks.shift().callback({op : op, time: new Date(), data: object});
    }
	};

  this.push = function(text, nick) {
    log("New message received: " + text);
    message = { message: text, id: messages.length, nick : nick};
    messages.push(message);
    
    this.send('new_message', {
      messages: [message], 
      last_id:  messages.length
    });
    
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
      callback({
        op : 'new_message',
        data : {
          messages : result, 
          last_id  : messages.length
      }});
    } else {
      callbacks.push({
        run_at   : new Date(), 
        callback : callback
      });
    }
    
    setInterval(function () {
      var now = new Date();
      while (callbacks.length > 0 && now - callbacks[0].run_at > 30*1000) {
        callbacks.shift().callback({op:'noop'});
      }
    }, 3000);    
  };
};

