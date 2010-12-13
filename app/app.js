require("./config/application.js");

var chat = new Chat();
chat.config({
  secret : "TopSecretPassCode"  
});

get("/client.js", {file : "client/client.js"});
get("/client.html", {file : "client/client.html"});
get("/base.css", {file : "client/base.css"});
get("/", function() {
  this.redirect("/client.html");
});

get("/join", function() {
  var nick = this.params("nick");
  var key  = this.params("key");
  
  var result = chat.join(nick, key);
  return result;
});

post("/send", function() {
  var message = this.params("message");
  var session = chat.session(this.params("key"));
  log("Received: " + message + " by " + session.nick);
  
  var id = chat.push(message, session.nick);
  return { 
    json : id 
  };
});

get("/receive/:since", function() {
  var since = this.params("since");
  var self = this;
  chat.query(since, function(messages) {
    self.render(messages);
  });
});

get("/who", function() {
  return chat.users();
});