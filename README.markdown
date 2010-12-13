Sparrow - Simple Chat for Node.js
=======================

Simple node.js chat server and/or application framework.

The purpose of this application is to learn to use node.js and server side javascript, not necessarily to do the best framework ever.

** Note: This is a work in progress **

Usage
-----

Applicattion is divided into two parts, Jack and Sparrow, where Jack is the base framework and Sparrow contains the business logic.

Jack supports GET, PUT, POST, and DELETE HTTP methods.

Goals
-----
* Learn Node.js by creating *everything* from scratch
* Simple SSO for integrating chat to existing systems
* Extract the application core and create a framework from that

Goals accomplished
------------------
* params('param') instead of params.param
* this.render instead of request.render
* Sessions (partially complete)
* SimpleSO via MAC auth
* All REST methods. DELETE, PUT first
* Wildcards / parametrized routes

TODO for Chat
----------------
* Chat rooms
* Add tests
* IRC-like API (/who, /join, /nick etc.)

TODO for Sparrow
-------------
* Add persistence (MongoDB and/or Redis)
* Exception handling
* Cookie support
* Sessions
* Views
* Refactor callback API to modules