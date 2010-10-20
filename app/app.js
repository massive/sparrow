require("./config/application.js");

get("/client.js", {file : "client/client.js"});
get("/client.html", {file : "client/client.html"});
get("/base.css", {file : "client/base.css"});

get("/", function() {
  this.redirect("/client.html");
});

get("/join", function() {
  var nick = this.params("nick");
  var key  = this.params("key");
  
  var result = Chat.join(nick, key);
  return result;
});

post("/send", function() {
  var message = this.params("message");
  var session = Chat.session(this.params("key"));
  log("Received: " + message + " by " + session.nick);
  
  var id = Chat.push(message, session.nick);
  return { 
    json : id 
  };
});

get("/receive", function() {
  var id = this.params("id");
  var self = this;
  Chat.query(id, function(messages) {
    self.render(messages);
  });
});

get("/who", function() {
  return Chat.users();
});

var crypto = require("crypto");
var SECRET = "TopSecretPassCode";

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
	
	this.join = function(nick, hash, callbacks) {
	  var session = { 
	    hash : this.hash(nick), 
	    nick : nick 
	  };
	  
	  if(this.hash(nick) == hash) {
	    sessions[session.hash] = session;
	    var result = {
        users    : this.users(),
        new_user : nick
      };
      this.notify(nick+" joined")
	    return result;
	  } else {
	    log("Got hash "+hash+". Expected hash "+this.hash(nick));
      return {error : "Invalid hash"}
	  }
	};
	
	this.sendCallbacks = function(object) {
	  object.time = new Date();
	  while (callbacks.length > 0) {
      callbacks.shift().callback(object);
    }
	};
	
	this.notify = function(text) {
    log("New message received: " + text);
    message = { message: text, id: messages.length, system : true};
    messages.push(message);
    
    this.sendCallbacks({
      messages: [message], 
      last_id:  messages.length
    });
    
    return messages.length;	  
	}

  this.push = function(text, nick) {
    log("New message received: " + text);
    message = { message: text, id: messages.length, nick : nick};
    messages.push(message);
    
    this.sendCallbacks({
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
        messages : result, 
        last_id  : messages.length
      });
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

