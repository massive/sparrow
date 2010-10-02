var id = 0;

function Chat() { };

Chat.prototype = {
  longPoll : function() {
    that = this;
	  $.ajax({
			cache: false,
			dataType: 'json',
			type: "GET",      
			url: "/receive",
			error: function () {
				setTimeout(poll, 10*1000);
			},
			data : {
			  id : id
			},
			success: function (json) {
			  if(json.messages) {
  			  console.log("Current id:"+id);
  				that.writeResult(json);
          id = json.last_id;
  			  console.log("New id:"+id);
  			} else {
  			  console.log("Received empty packet");
  			}
			  that.longPoll();        
			}
		});
	},
	
	joinAs : function(nick) {
	  $.ajax({
	    type: "GET",
	    url: "/join",
	    data :  {
	      nick : nick
	    }
	  });
	  this.attach();
	},
	
  attach : function() {
    $('#message').keyup(function(e) {
    	if(e.keyCode == 13) {
    	  var message = $(this).val();
    	  $.ajax({
    	    type : "POST",
    			url: "http://127.0.0.1:8000/send",
    	    data : {
    	      message : message
    	    }
    	  });
    	  $(this).val("");
    	}  	
    });
    this.longPoll();
  },

  writeResult : function(json) {
    messages = json['messages']
    for(o in messages) {
      $("body").append("<div>"+messages[o].message+"</div>");
    }
  }
	
};