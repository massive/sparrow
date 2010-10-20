require("../../sparrow/lib/sparrow");
var sys = require("sys");
var path = require("path");

var PORT = 8000;
var HOST = "127.0.0.1";
var SECRET = "TopSecretPassCode";

Sparrow.config({
  port : PORT,
  host : HOST,
  root : path.dirname(__filename) + "/../"
});

Sparrow.start();