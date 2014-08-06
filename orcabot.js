// configure bot
var config = require("./config");

// get node modules
var irc = require("irc");
var twit = require("twit");

//get modules

// bot name
var bot = new irc.Client(config.server, config.botName, {
	channels: config.channels,
	userName: config.botName,
	realName: config.realName
});

// Listen for any message, say to him/her in the room
// bot.addListener("message", function(from, to, text, message) {
// 	bot.say(config.channels[0], "(⊙ ◡ ⊙)");
// });

bot.addListener("message", function(from, to, message) {
    if(message.indexOf("hi") > -1) {
    	bot.say(to, "(⊙ ◡ ⊙)");
	}
});

// google

bot.addListener("message", function(from, to, message) {
	if(message.indexOf(".g") > -1) {
		message = message.replace(".g ", "");
		message = message.replace(/ /g, "+");
		var searchLink = "https://google.com/search?q=" + message;
		bot.say(to, searchLink);
	}
});

// twitter

var t = new twit({

});

bot.addListener("message", function(from, to, message) {
	if(message.indexOf(".tw") > -1) {
		message = message.replace(".tw ", "");
		var screenName = message;
		t.get("statuses/user_timeline", {screen_name: screenName, count: 1}, function (err, data, response) {
			if(data === undefined) {
				bot.say(to, "User not found!");
			} else {
				bot.say(to, "Most recent tweet by " + "\u0002" + data[0].user.name + "\u0002 "  + "(\u0002@" + data[0].user.screen_name + "\u0002" + ")" + "\u0002 | \u0002" + data[0].text + "\u0002 | \u0002" + data[0].created_at);
			}
		});
	}
});