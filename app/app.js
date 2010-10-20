require("./config/application.js");
require("./lib/chat.js");

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



