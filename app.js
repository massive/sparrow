require("./server");
var qs = require("querystring");
var url = require("url");

var PORT = 8000;
var HOST = "127.0.0.1";

app = router.listen(PORT, HOST);

app.fileMap("/client.js", "client.js");
app.fileMap("/client.html", "client.html");

app.get("/join", function(params) {
  //var nick = qs.parse(url.parse(req.url).query).nick;  
  var nick = params.nick;
  params.render("Join: " +nick);
  router.log("Connection: " + nick + "@" + params.connection.remoteAddress);
});

app.post("/send", function(params) {
  var message = params.message;
  router.log("Received: " + message);
  var id = Chat.appendMessage(message);
  params.render({id:id}, {json:true});
});

app.get("/receive", function(params) {
  var id = params.id;
  Chat.messages(id, function(messages) {
    params.render(messages, {json:true});
  });
});