// configure bot
var config = require("./config");

// get node modules
var irc = require("irc");
var twit = require("twit");
var LastFmNode = require("lastfm").LastFmNode;

//get modules

// bot name
var bot = new irc.Client(config.server, config.botName, {
	channels: config.channels,
	userName: config.botName,
	realName: config.realName
});

// greeting

bot.addListener("message", function(from, to, message) {
    if(message.indexOf("hi") > -1) {
    	bot.say(to, "(⊙ ◡ ⊙)");
	}
});

// google

bot.addListener("message", function(from, to, message) {
	if(message.search(".g ") > -1 && message.search(".g ") === 0) {
		message = message.replace(".g ", "");
		message = message.replace(/ /g, "+");
		var searchLink = "https://google.com/search?q=" + message;
		bot.say(to, searchLink);
	}
});

// bot response coloring
var white = "\u000300";
var black = "\u000301";
var darkBlue = "\u000302";
var darkGreen = "\u000303";
var lightRed = "\u000304";
var darkRed = "\u000305";
var magenta = "\u000306";
var orange = "\u000307";
var yellow = "\u000308";
var lightGreen = "\u000309";
var cyan = "\u000310";
var lightCyan = "\u000311";
var lightBlue = "\u000312";
var lightMagenta = "\u000313";
var gray = "\u000314";
var lightGray = "\u000315";
var reset = "\u000f";
var bold = "\u0002";
var reset = "\u000f";
var underline = "\u001f";

// twitter

var t = new twit({
	consumer_key: config.twitterConsumerKey,
	consumer_secret: config.twitterConsumerSecret,
	access_token: config.twitterAccessToken,
	access_token_secret: config.twitterAccessTokenSecret,
});

bot.addListener("message", function(from, to, message) {
	if(message.search(".tw ") > -1 && message.search(".tw ") === 0) {
		message = message.replace(".tw ", "");
		var screenName = message;
		t.get("statuses/user_timeline", {screen_name: screenName, count: 1}, function (err, data, response) {
			if(data === undefined) {
				bot.say(to, "User not found!");
			} else {
				bot.say(to, "Most recent tweet by " + bold + data[0].user.name + bold + " "  + "(" + bold + "@" + data[0].user.screen_name + bold + ")" + bold + lightBlue + " | " + bold + reset + data[0].text + lightBlue + bold + " | " + bold + reset + data[0].created_at);
			}
		});
	}
});

// last.fm now playing

var lastfm = new LastFmNode({
	api_key: config.lfmApiKey,
	secret: config.lfmSecret
});

bot.addListener("message", function(from, to, message) {
	if(message.search(".np ") > -1 && message.search(".np ") === 0) {
		message = message.replace(".np ", "");
		var username = message;
		lastfm.request("user.getRecentTracks", {
			user: username,
			handlers: {
				success: function(data) {
					if(data.recenttracks.track[0].album['#text'] !== "") {
						bot.say(to, "Last.fm " + lightRed + bold + "| " + reset + bold + username + bold + reset + " last listened to " + "\"" + data.recenttracks.track[0].name + "\"" + " by " + data.recenttracks.track[0].artist["#text"] + " from " + underline + data.recenttracks.track[0].album["#text"] + underline + lightRed + bold + " | " + reset + "http://www.last.fm/user/" + username + "/now");
					} else {
						bot.say(to, "Last.fm " + lightRed + bold + "| " + reset + bold + username + bold + reset + " last listened to " + "\"" + data.recenttracks.track[0].name + "\"" + " by " + data.recenttracks.track[0].artist["#text"] + lightRed + bold + " | " + reset + "http://www.last.fm/user/" + username + "/now");
					}
					console.log(data);
					// console.log(data.recenttracks.track[0]);
				},
				error: function(error) {
					bot.say(to, bold + username + bold + " doesn't exist in my database!");
				}
			}
		});
	}
});

// last.fm charts

bot.addListener("message", function(from, to, message) {
	if(message.search(".charts ") > -1 && message.search(".charts ") === 0) {
		message = message.replace(".charts ", "");
		var username = message;
		lastfm.request("user.getWeeklyArtistChart", {
			user: username,
			handlers: {
				success: function(data) {
					var charts = [];
					for(i = 0; i < 5; i++){
						charts.push(data.weeklyartistchart.artist[i].name + " (" + data.weeklyartistchart.artist[i].playcount + ")");
					}
					bot.say(to, "Last.fm weekly charts for " + bold + username + lightRed + " | " + bold + reset + charts.join(", "));
				},
				error: function(error) {
					bot.say(to, bold + username + bold + " doesn't exist in my database!");
				}
			}
		});
	}
});



// lastfm.request("user.getWeeklyArtistChart", {
// 	user: "fiveseven_",
// 	handlers: {
// 		success: function(data) {
// 			console.log(data.weeklyartistchart.artist[0].name);
// 		},
// 		error: function(error) {
// 			}
// 	}
// });