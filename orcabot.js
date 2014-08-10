// configure bot
var config = require("./config");

// get node modules
var irc = require("irc");
var twit = require("twit");
var fs = require("fs");
var LastFmNode = require("lastfm").LastFmNode;
var ig = require("instagram-node").instagram();

//get modules

// bot name
var bot = new irc.Client(config.server, config.botName, {
	channels: config.channels,
	userName: config.botName,
	realName: config.realName,
	password: config.password
});

// greeting

bot.addListener("message", function(from, to, text) {
    if(text.indexOf("hi") > -1) {
    	bot.say(to, "(⊙ ◡ ⊙)");
	}
});

// google

bot.addListener("message", function(from, to, text) {
	if(text.search(".g ") > -1 && text.search(".g ") === 0) {
		text = text.replace(".g ", "");
		text = text.replace(/ /g, "+");
		var searchLink = "https://google.com/search?q=" + text;
		bot.say(to, searchLink);
	}
});

// bot response formatting

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

bot.addListener("message", function(from, to, text) {
	if(text.search(".tw ") > -1 && text.search(".tw ") === 0) {
		text = text.replace(".tw ", "");
		t.get("statuses/user_timeline", {screen_name: text, count: 1}, function (err, data, response) {
			if(data === undefined) {
				bot.say(to, "Twitter " + cyan + bold + "| " + reset + bold + text + reset + " is not a valid Twitter handle!");
			} else {
				bot.say(to, "Twitter " + cyan + bold + "| " + bold + reset + "Most recent tweet by " + bold + data[0].user.name + bold + " "  + "(" + bold + "@" + data[0].user.screen_name + bold + ")" + bold + cyan + " | " + bold + reset + data[0].text + cyan + bold + " | " + bold + reset + data[0].created_at);
			}
		});
	}
});

// last.fm

var lastfm = new LastFmNode({
	api_key: config.lfmApiKey,
	secret: config.lfmSecret
});

var lastfmdb = "./lastfmdb.json";
var hostsAndAccounts = {};
var hostNames = {};

fs.readFile(lastfmdb, "utf8", function(err, data) {
	if(err) throw err;
	hostsAndAccounts = JSON.parse(data);
	hostNames = Object.keys(hostsAndAccounts);
});

bot.addListener("message", function(from, to, text, message) {
	if(text.search(".addlastfm ") > -1 && text.search(".addlastfm ") === 0) {
		text = text.replace(".addlastfm ", "");
		lastfm.request("user.getInfo", {
			user: text,
			handlers: {
				success: function(data) {
						if(hostNames.indexOf(message.host) > -1) {
							bot.say(to, "Last.fm " + lightRed + bold + "| " + reset + bold + from + bold + " (" + message.host + ")" + " already has an associated Last.fm account (http://www.last.fm/user/" + Object.getOwnPropertyDescriptor(hostsAndAccounts[message.host], "lfm").value + reset + ")!");
						} else {
							hostsAndAccounts[message.host] = {"lfm": text};
							fs.writeFile(lastfmdb, JSON.stringify(hostsAndAccounts, null, 4), function (err) {
								if(err) throw err;
								hostNames = Object.keys(hostsAndAccounts);
							});
							bot.say(to, "Last.fm " + lightRed + bold + "| " + reset + "User " + bold + text + bold + reset + " is now associated with hostname " + bold + message.host);
						}
				},
				error: function(error) {
					bot.say(to, "Last.fm " + lightRed + bold + "| " + bold + reset + bold + text + bold + " is not a registered username on Last.fm!");
				}
			}
		});
	}
});

// now playing .np <self/user/registered handle>

bot.addListener("message", function(from, to, text, message) {
	if(text.search(".np ") > -1 && text.search(".np ") === 0) {
		text = text.replace(".np ", "");
		lastfm.request("user.getRecentTracks", {
			user: text,
			handlers: {
				success: function(data) {
					if(data.recenttracks.track[0]["@attr"] === undefined) {
						if(data.recenttracks.track[0].album['#text'] !== "") {
							bot.say(to, "Last.fm " + lightRed + bold + "| " + reset + bold + text + reset + " last listened to " + "\"" + data.recenttracks.track[0].name + "\"" + " by " + data.recenttracks.track[0].artist["#text"] + " from " + underline + data.recenttracks.track[0].album["#text"] + underline + lightRed + bold + " | " + reset + "http://www.last.fm/user/" + text + "/now");
						} else {
							bot.say(to, "Last.fm " + lightRed + bold + "| " + reset + bold + text + reset + " last listened to " + "\"" + data.recenttracks.track[0].name + "\"" + " by " + data.recenttracks.track[0].artist["#text"] + lightRed + bold + " | " + reset + "http://www.last.fm/user/" + text + "/now");
						}
					} else if(data.recenttracks.track[0].album['#text'] !== "") {
						bot.say(to, "Last.fm " + lightRed + bold + "| " + reset + bold + text + reset + " is listening to " + "\"" + data.recenttracks.track[0].name + "\"" + " by " + data.recenttracks.track[0].artist["#text"] + " from " + underline + data.recenttracks.track[0].album["#text"] + underline + lightRed + bold + " | " + reset + "http://www.last.fm/user/" + text + "/now");
					} else {
						bot.say(to, "Last.fm " + lightRed + bold + "| " + reset + bold + text + reset + " is listening to " + "\"" + data.recenttracks.track[0].name + "\"" + " by " + data.recenttracks.track[0].artist["#text"] + lightRed + bold + " | " + reset + "http://www.last.fm/user/" + text + "/now");
					}
				},
				error: function(error) {
					bot.say(to, "Last.fm " + lightRed + bold + "| " + bold + reset + bold + text + bold + " is not a registered username on Last.fm!");
				}
			}
		});
	} else if(text === ".np") {
		if(hostNames.indexOf(message.host) > -1) {
			var lfmAccount = Object.getOwnPropertyDescriptor(hostsAndAccounts[message.host], "lfm").value;
			lastfm.request("user.getRecentTracks", {
				user: lfmAccount,
				handlers: {
					success: function(data) {
						if(data.recenttracks.track[0]["@attr"] === undefined) {
							if(data.recenttracks.track[0].album['#text'] !== "") {
								bot.say(to, "Last.fm " + lightRed + bold + "| " + reset + bold + lfmAccount + reset + " last listened to " + "\"" + data.recenttracks.track[0].name + "\"" + " by " + data.recenttracks.track[0].artist["#text"] + " from " + underline + data.recenttracks.track[0].album["#text"] + underline + lightRed + bold + " | " + reset + "http://www.last.fm/user/" + lfmAccount + "/now");
							} else {
								bot.say(to, "Last.fm " + lightRed + bold + "| " + reset + bold + lfmAccount + reset + " last listened to " + "\"" + data.recenttracks.track[0].name + "\"" + " by " + data.recenttracks.track[0].artist["#text"] + lightRed + bold + " | " + reset + "http://www.last.fm/user/" + lfmAccount + "/now");
							}
						} else if(data.recenttracks.track[0].album['#text'] !== "") {
							bot.say(to, "Last.fm " + lightRed + bold + "| " + reset + bold + lfmAccount + reset + " is listening to " + "\"" + data.recenttracks.track[0].name + "\"" + " by " + data.recenttracks.track[0].artist["#text"] + " from " + underline + data.recenttracks.track[0].album["#text"] + underline + lightRed + bold + " | " + reset + "http://www.last.fm/user/" + lfmAccount + "/now");
						} else {
							bot.say(to, "Last.fm " + lightRed + bold + "| " + reset + bold + lfmAccount + reset + " is listening to " + "\"" + data.recenttracks.track[0].name + "\"" + " by " + data.recenttracks.track[0].artist["#text"] + lightRed + bold + " | " + reset + "http://www.last.fm/user/" + lfmAccount + "/now");
						}
				},
					error: function(error) {
						bot.say(to, "Last.fm " + lightRed + bold + "| " + bold + text + bold + " is not a registered username on Last.fm!");
					}
				}
			});
		} else {
			lfmAccount = from;
			bot.say(to, "Last.fm " + lightRed + bold + "| " + reset + bold + lfmAccount + bold + " doesn't exist in my database! Please use " + "\"" + ".addlastfm <last.fm username>" + "\"" + " to add yourself the db. You must be identified on " + config.server + ".");
		}
	}
});

// weekly charts .charts <self/user/registered handle>

bot.addListener("message", function(from, to, text, message) {
	if(text.search(".charts ") > -1 && text.search(".charts ") === 0) {
		text = text.replace(".charts ", "");
		lastfm.request("user.getWeeklyArtistChart", {
			user: text,
			handlers: {
				success: function(data) {
					var charts = [];
					for(i = 0; i < 5; i++) {
						charts.push(data.weeklyartistchart.artist[i].name + " (" + data.weeklyartistchart.artist[i].playcount + ")");
					}
					bot.say(to, "Last.fm weekly charts for " + bold + text + lightRed + " | " + reset + charts.join(", "));
				},
				error: function(error) {
					bot.say(to, "Last.fm " + lightRed + bold + "| " + bold + reset + bold + text + bold + " is not a registered username on Last.fm!");
				}
			}
		});
	} else if(text === ".charts") {
		if(hostNames.indexOf(message.host) > -1) {
			var lfmAccount = Object.getOwnPropertyDescriptor(hostsAndAccounts[message.host], "lfm").value;
			lastfm.request("user.getWeeklyArtistChart", {
				user: lfmAccount,
				handlers: {
					success: function(data) {
						var charts = [];
						for(i = 0; i < 5; i++) {
							charts.push(data.weeklyartistchart.artist[i].name + " (" + data.weeklyartistchart.artist[i].playcount + ")");
						}
						bot.say(to, "Last.fm weekly charts for " + bold + lfmAccount + lightRed + " | " + reset + charts.join(", "));
					},
					error: function(error) {
						bot.say(to, "Last.fm " + lightRed + bold + "| " + bold + reset + bold + lfmAccount + bold + " is not a registered username on Last.fm!");
					}
				}
			});
		} else {
			lfmAccount = from;
			bot.say(to, "Last.fm " + lightRed + bold + "| " + reset + bold + lfmAccount + bold + " doesn't exist in my database! Please use " + "\"" + ".addlastfm <last.fm username>" + "\"" + " to add yourself the db. You must be identified on " + config.server + ".");
		}
	}
});

// compare musical compatibility .compare <user/registered handle>

bot.addListener("message", function(from, to, text) {
	if(text.search(".compare ") > -1 && text.search(".compare ") === 0) {
		text = text.replace(".compare ", "");
		lastfm.request("tasteometer.compare", {
			type1: "user",
			value1: from,
			type2: "user",
			value2: text,
			handlers: {
				success: function(data) {
					var score = (data.comparison.result.score*100).toFixed(2);
					var adjective;
					switch(true) {
					  	case (score >= 90):
					    	adjective = "SUPER";
					    	break;
				    	case (90 > score >= 70):
					    	adjective = "VERY HIGH";
					    	break;
				    	case (70 > score >= 50):
					    	adjective = "HIGH";
					    	break;
				    	case (50 > score >= 30):
				    		adjective = "MEDIUM";
				    		break;
			    		case (30 > score >= 10):
				    		adjective = "LOW";
				    		break;
					  	default:
					    	adjective = "VERY LOW";
					}
					var similarArtists = [];
					for(i = 0; i < 5; i++) {
						similarArtists.push(data.comparison.result.artists.artist[i].name);
					}
					bot.say(to, "Last.fm" + bold + lightRed + " | " + bold + reset + "Users " + from + " and " + text + " have " + bold + adjective + reset + " compatibility (similarity " + score + "%)" + darkRed + bold + " | " + reset + "Similar artists include: " + similarArtists.join(", "));
				},
				error: function(error) {
					bot.say(to, "Last.fm " + lightRed + bold + "| " + bold + reset + bold + text + bold + " is not a registered username on Last.fm!");
				}
			}
		});
	}
});

// instagram

ig.use({
	client_id: config.igClientId,
	client_secret: config.igClientSecret
});

bot.addListener("message", function(from, to, text) {
	if(text.search(".ig ") > -1 && text.search(".ig ") === 0) {
		text = text.replace(".ig ", "");
		ig.user_search(text, {count: 1}, function(err, users, limit) {
			if(users.length > 0 && users[0].username === text) {
				ig.user_media_recent(users[0].id, {count: 1}, function(err, medias, pagination, limit) {
					if(medias[0].caption !== null) {
						bot.say(to, "Instagram " + lightBlue + bold + "| " + reset + "Most recent post by " + bold + text + " (" + medias[0].user.full_name + ")" + lightBlue + " | " + reset + medias[0].caption.text + " " + (medias[0].link).replace("instagram.com", "instagr.am") + lightBlue + bold + " | " + reset + "Filter: " + medias[0].filter);
					} else {
						bot.say(to, "Instagram " + lightBlue + bold + "| " + reset + "Most recent post by " + bold + text + " (" + medias[0].user.full_name + ")" + lightBlue + " | " + reset + "No caption " + (medias[0].link).replace("instagram.com", "instagr.am") + lightBlue + bold + " | " + reset + "Filter: " + medias[0].filter);
					}
				});
			} else {
				bot.say(to, "Instagram " + lightBlue + bold + "| " + bold + reset + bold + text + bold + " is not a registered user on Instagram!");
			}
		});
	}
});