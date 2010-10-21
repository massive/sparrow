var crypto = require("crypto");

Chat = function() {  
  var messages  = [];
  var callbacks = [];
  var sessions  = [];
  var configs   = {};
  
  this.hash = function(data) {
    return crypto.createHmac("sha1", this.configs.secret).update(data).digest("hex");
  };
  
  this.config = function(config) {
    this.configs = config;
  };
  
  this.start = function() {
    Sparrow.config(this.configs);
    Sparrow.start();
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
exports = Chat;