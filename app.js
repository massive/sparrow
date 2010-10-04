require("./server");
var qs = require("querystring");
var url = require("url");

var PORT = 8000;
var HOST = "127.0.0.1";

app = router.listen(PORT, HOST);

app.fileMap("/client.js", "client.js");
app.fileMap("/client.html", "client.html");

app.get("/join", function(req, res) {
  var nick = qs.parse(url.parse(req.url).query).nick;  
  res.render("Join: " +nick);
  router.log("Connection: " + nick + "@" + res.connection.remoteAddress);
});

app.post("/send", function(req, res, data) {
  router.log("Received: "+data);
  var message = data.message;
  var id = Chat.appendMessage(message);
  res.render({id:id}, {json:true});
});

app.get("/receive", function(req, res) {
  var query = qs.parse(url.parse(req.url).query);
  var id = query.id;
  var self = this;
  Chat.messages(id, function(messages) {
    res.render(messages, {json:true});
  });
});