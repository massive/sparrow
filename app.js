var PORT = 8000;
var HOST = "127.0.0.1";

app = httpServer.createServer(POST, HOST);
app.fileMap("/client.js", "client.js");
app.fileMap("/client.html", "client.html");

app.get("/join", function(req, res) {
  var nick = qs.parse(url.parse(this.request().url).query).nick;  
  this.render("Join: " +nick);
  httpServer.log("Connection: " + nick + "@" + this.response().connection.remoteAddress);
});

app.post("/send", function(req, res, data) {
  var message = data.message;
  var id = Chat.appendMessage(message);
  this.render({id:id}, {json:true});
});

app.get("/receive", function(req, res) {
  var query = qs.parse(url.parse(req.url).query);
  var id = query.id;
  var self = this;
  sys.puts(sys.inspect(this));
  Chat.messages(id, function(messages) {
    self.render(messages, {json:true});
  });
});