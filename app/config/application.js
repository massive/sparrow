require("../../sparrow/lib/sparrow");
require("../lib/chat.js");

var sys = require("sys");
var path = require("path");

var PORT = 8000;
var HOST = "127.0.0.1";

Sparrow.config({
  port : PORT,
  host : HOST,
  root : path.dirname(__filename) + "/../",
});

Chat.config({
  secret : "TopSecretPassCode"  
});

Sparrow.start();