// configure bot
var config = require("./config");

// get irc package
var irc = require("irc");

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
    if(message.indexOf('hi') > -1) {
        bot.say(to, '(⊙ ◡ ⊙)');
    }
});