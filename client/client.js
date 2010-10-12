function Chat(address, port) {
  this.id = 0;
  this.hash = "";
  this.address = address;
  this.port = port;
};

Chat.prototype = {  
  longPoll : function() {    
    var self = this;
    
	  $.ajax({
			cache: false,
			dataType: 'json',
			type: "GET",      
			url: "/receive",
			error: function () {
				setTimeout(self.longPoll, 10*1000);
			},
			data : {
			  id  : self.id,
			  hash : self.hash
			},
			success: function (json) {
			  if(json.op == "new_message") {
  				self.appendMessages(json.data.messages);
          self.id = json.data.last_id;
			  } else if(json.op == "new_user") {
			    self.newUser(json.data.new_user);
  			} else {
  			  console.log("Received unknown packet: "+json.op);
  			}  			
  			self.longPoll();
			}
		});
	},
	
	join : function(nick, hash) {
	  var self = this;
	  this.hash = hash;
	  $.ajax({
	    type: "GET",
	    url: "/join",
	    dataType : 'json',
	    data :  {
	      nick : nick,
	      hash : hash
	    },
	    success : function(json) {
    	  self.attach();
    	  $("#my_nick").text(nick);
	    }
	  });
	},
	
  attach : function() {
    var self = this;
    
    $('#message').keyup(function(e) {
    	if(e.keyCode == 13) {
    	  var message = $(this).val();
    	  $.ajax({
    	    type : "POST",
    			url: "http://"+self.address+":"+self.port+"/send",
    	    data : {
    	      message : message,
    	      hash    : self.hash
    	    }
    	  });
    	  $(this).val("");
    	}  	
    });
    this.longPoll();
    //this.who();
  },
  
  who : function() {
    var self = this;    
	  $.ajax({
			dataType: 'json',
			type: "GET",      
			url: "/who",
			data : {
			  hash : self.hash
			},
			success: function (json) {
        self.writeWho(json);        
    	  setTimeout(function() { self.who() }, 5000);
			}
		});
  },
  
  writeWho : function(users) {
    var self = this;    
    $("#who").empty();
    for(u in users) {
      $("#who").append("<div>"+users[u]+"</div>");
    }
  },
  
  newUser : function(nick) {
    $("#messages").append("<div><span>"+nick+" joined</span></div>");    
  },

  appendMessages : function(messages) {
    for(o in messages) {
      $("#messages").append("<div><span>"+messages[o].nick+"</span>: <span>"+messages[o].message+"</span></div>");
    }
    $("#messages").scrollTop($("#messages")[0].scrollHeight);
  }
	
};