// configure bot
var config = {
	channels: ["#house"],
	server: "irc.snoonet.org",
	botName: "orcabot",
	realName: "https://github.com/emyarod/orcabot",
};

// get lib
var irc = require("irc");

// bot name
var bot = new irc.Client(config.server, config.botName, {
	channels: config.channels,
	realName: config.realName
});

// Listen for any message, say to him/her in the room
// bot.addListener("message", function(from, to, text, message) {
// 	bot.say(config.channels[0], "(⊙ ◡ ⊙)");
// });

bot.addListener("message", function(from, to, message) {
    if(message.indexOf('hi') > -1) {
        bot.say(to, '(⊙ ◡ ⊙)');
    }
});