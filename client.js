function Chat() {
  this.id = 0;
  this.key = 0;
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
			  key : self.key
			},
			success: function (json) {
			  if(json.messages) {
  			  console.log("Current id:"+ self.id);
  				self.writeResult(json);
          self.id = json.last_id;
  			  console.log("New id:"+ self.id);
  			} else {
  			  console.log("Received empty packet");
  			}
			  self.longPoll();        
			}
		});
	},
	
	joinAs : function(nick, hash) {
	  var self = this;
	  $.ajax({
	    type: "GET",
	    url: "/join",
	    dataType : 'json',
	    data :  {
	      nick : nick,
	      hash : hash
	    },
	    success : function(json) {
	      self.key = json.key;
    	  self.attach();
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
    			url: "http://127.0.0.1:8000/send",
    	    data : {
    	      message : message,
    	      key : self.key
    	    }
    	  });
    	  $(this).val("");
    	}  	
    });
    this.longPoll();
    this.who();
  },
  
  who : function() {
    var self = this;
    
	  $.ajax({
			dataType: 'json',
			type: "GET",      
			url: "/who",
			data : {
			  key : self.key
			},
			success: function (json) {
        self.writeWho(json);        
    	  setTimeout(function() { self.who() }, 5000);
			}
		});
		console.log("Running who")
  },
  
  writeWho : function(users) {
    var self = this;
    
    $("#who").empty();
    for(u in users) {
      $("#who").append("<div>"+users[u]+"</div>");
    }
  },  

  writeResult : function(json) {
    messages = json['messages']
    for(o in messages) {
      $("#messages").append("<div><span>"+messages[o].nick+"</span>: <span>"+messages[o].message+"</span></div>");
    }
  }
	
};