// get config files
var config = require("./config");
var channel = require("./channel");
var keys = require("./opendoors");

// get node modules
var fs = require("fs");
var http = require("http");
var factory = require("irc-factory"),
    api = new factory.Api();
var Entities = require('html-entities').AllHtmlEntities;
var twit = require("twit");
var LastFmNode = require("lastfm").LastFmNode;
var ig = require("instagram-node").instagram();

var entities = new Entities();

// bot name
var bot = api.createClient("orcatail", {
    nick: config.nick,
    user: config.user,
    realname: config.realname,
    server: config.server,
    password: config.password
});

api.hookEvent("orcatail", "registered", function(message) {
    bot.irc.join(channel.channels);
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

api.hookEvent("orcatail", "privmsg", function(message) {
	if(message.message === ".help") {
		bot.irc.privmsg(message.target, "Available commands: g, tw, ig, np, charts, addlastfm, compare, similar. Type \".help <command>\" for more information about a command");
	} else if((message.message).search(".help ") === 0) {
		var text = (message.message).replace(".help ", "");
	}
});

// greeting
api.hookEvent("orcatail", "privmsg", function(message) {
	if((message.message).indexOf("hi") > -1) {
		bot.irc.privmsg(message.target, "(⊙ ◡ ⊙)");
	}
});

// google
api.hookEvent("orcatail", "privmsg", function(message) {
	if((message.message).search(".g ") === 0) {
		var text = (message.message).replace(".g ", "").replace(/ /g, "+");
		var searchLink = "https://google.com/search?q=" + text;
		bot.irc.privmsg(message.target, searchLink);
	}
});

// twitter
var t = new twit({
	consumer_key: keys.twitterConsumerKey,
	consumer_secret: keys.twitterConsumerSecret,
	access_token: keys.twitterAccessToken,
	access_token_secret: keys.twitterAccessTokenSecret
});

api.hookEvent("orcatail", "privmsg", function(message) {
	if((message.message).search(".tw ") === 0) {
		var text = (message.message).replace(".tw ", "");
		t.get("statuses/user_timeline", {screen_name: text, count: 1}, function (err, data, response) {
			if(data === undefined) {
				bot.irc.privmsg(message.target, "Twitter " + cyan + bold + "| " + reset + bold + text + reset + " is not a valid Twitter handle!");
			} else {
				bot.irc.privmsg(message.target, "Twitter " + cyan + bold + "| " + bold + reset + "Most recent tweet by " + bold + data[0].user.name + bold + " "  + "(" + bold + "@" + data[0].user.screen_name + bold + ")" + bold + cyan + " | " + bold + reset + data[0].text + cyan + bold + " | " + bold + reset + data[0].created_at);
			}
		});
	}
});

// instagram
ig.use({
	client_id: keys.igClientId,
	client_secret: keys.igClientSecret
});

api.hookEvent("orcatail", "privmsg", function(message) {
	if((message.message).search(".ig ") === 0) {
		var text = (message.message).replace(".ig ", "");
		ig.user_search(text, {count: 1}, function(err, users, limit) {
			if(users.length > 0 && users[0].username === text) {
				ig.user_media_recent(users[0].id, {count: 1}, function(err, medias, pagination, limit) {
					if(medias[0].caption !== null) {
						bot.irc.privmsg(message.target, "Instagram " + lightBlue + bold + "| " + reset + "Most recent post by " + bold + text + " (" + medias[0].user.full_name + ")" + lightBlue + " | " + reset + medias[0].caption.text + " " + (medias[0].link).replace("instagram.com", "instagr.am") + lightBlue + bold + " | " + reset + "Filter: " + medias[0].filter);
					} else {
						bot.irc.privmsg(message.target, "Instagram " + lightBlue + bold + "| " + reset + "Most recent post by " + bold + text + " (" + medias[0].user.full_name + ")" + lightBlue + " | " + reset + "No caption " + (medias[0].link).replace("instagram.com", "instagr.am") + lightBlue + bold + " | " + reset + "Filter: " + medias[0].filter);
					}
				});
			} else {
				bot.irc.privmsg(message.target, "Instagram " + lightBlue + bold + "| " + bold + reset + bold + text + bold + " is not a registered user on Instagram!");
			}
		});
	}
});

// last.fm
var lastfm = new LastFmNode({
	api_key: keys.lfmApiKey,
	secret: keys.lfmSecret
});

var lastfmdb = "./lastfmdb.json";
var hostsAndAccounts = {};
var hostNames = {};

fs.readFile(lastfmdb, "utf8", function(err, data) {
	if(err) throw err;
	hostsAndAccounts = JSON.parse(data);
	hostNames = Object.keys(hostsAndAccounts);
});

api.hookEvent("orcatail", "privmsg", function(message) {
	if((message.message).search(".addlastfm ") === 0) {
		var text = (message.message).replace(".addlastfm ", "");
		lastfm.request("user.getInfo", {
			user: text,
			handlers: {
				success: function(data) {
						if(hostNames.indexOf(message.hostname) > -1) {
							bot.irc.privmsg(message.target, "Last.fm " + lightRed + bold + "| " + reset + bold + message.nickname + bold + " (" + message.hostname + ")" + " already has an associated Last.fm account (http://www.last.fm/user/" + Object.getOwnPropertyDescriptor(hostsAndAccounts[message.hostname], "lfm").value + reset + ")!");
						} else {
							hostsAndAccounts[message.hostname] = {"lfm": text};
							fs.writeFile(lastfmdb, JSON.stringify(hostsAndAccounts, null, 4), function (err) {
								if(err) throw err;
								hostNames = Object.keys(hostsAndAccounts);
							});
							bot.irc.privmsg(message.target, "Last.fm " + lightRed + bold + "| " + reset + "User " + bold + text + bold + reset + " is now associated with hostname " + bold + message.hostname);
						}
				},
				error: function(error) {
					bot.irc.privmsg(message.target, "Last.fm " + lightRed + bold + "| " + bold + reset + bold + text + bold + " is not a registered username on Last.fm!");
				}
			}
		});
	}
});

// now playing .np <self/user/registered handle>
api.hookEvent("orcatail", "privmsg", function(message) {
	if((message.message).search(".np ") === 0) {
		var text = (message.message).replace(".np ", "");
		lastfm.request("user.getRecentTracks", {
			user: text,
			handlers: {
				success: function(data) {
					if(data.recenttracks.track[0]["@attr"] === undefined) {
						if(data.recenttracks.track[0].album['#text'] !== "") {
							bot.irc.privmsg(message.target, "Last.fm " + lightRed + bold + "| " + reset + bold + text + reset + " last listened to " + "\"" + data.recenttracks.track[0].name + "\"" + " by " + data.recenttracks.track[0].artist["#text"] + " from " + underline + data.recenttracks.track[0].album["#text"] + underline + lightRed + bold + " | " + reset + "http://www.last.fm/user/" + text + "/now");
						} else {
							bot.irc.privmsg(message.target, "Last.fm " + lightRed + bold + "| " + reset + bold + text + reset + " last listened to " + "\"" + data.recenttracks.track[0].name + "\"" + " by " + data.recenttracks.track[0].artist["#text"] + lightRed + bold + " | " + reset + "http://www.last.fm/user/" + text + "/now");
						}
					} else if(data.recenttracks.track[0].album['#text'] !== "") {
						bot.irc.privmsg(message.target, "Last.fm " + lightRed + bold + "| " + reset + bold + text + reset + " is listening to " + "\"" + data.recenttracks.track[0].name + "\"" + " by " + data.recenttracks.track[0].artist["#text"] + " from " + underline + data.recenttracks.track[0].album["#text"] + underline + lightRed + bold + " | " + reset + "http://www.last.fm/user/" + text + "/now");
					} else {
						bot.irc.privmsg(message.target, "Last.fm " + lightRed + bold + "| " + reset + bold + text + reset + " is listening to " + "\"" + data.recenttracks.track[0].name + "\"" + " by " + data.recenttracks.track[0].artist["#text"] + lightRed + bold + " | " + reset + "http://www.last.fm/user/" + text + "/now");
					}
				},
				error: function(error) {
					bot.irc.privmsg(message.target, "Last.fm " + lightRed + bold + "| " + bold + reset + bold + text + bold + " is not a registered username on Last.fm!");
				}
			}
		});
	} else if(message.message === ".np") {
		if(hostNames.indexOf(message.hostname) > -1) {
			var lfmAccount = Object.getOwnPropertyDescriptor(hostsAndAccounts[message.hostname], "lfm").value;
			lastfm.request("user.getRecentTracks", {
				user: lfmAccount,
				handlers: {
					success: function(data) {
						if(data.recenttracks.track[0]["@attr"] === undefined) {
							if(data.recenttracks.track[0].album['#text'] !== "") {
								bot.irc.privmsg(message.target, "Last.fm " + lightRed + bold + "| " + reset + bold + lfmAccount + reset + " last listened to " + "\"" + data.recenttracks.track[0].name + "\"" + " by " + data.recenttracks.track[0].artist["#text"] + " from " + underline + data.recenttracks.track[0].album["#text"] + underline + lightRed + bold + " | " + reset + "http://www.last.fm/user/" + lfmAccount + "/now");
							} else {
								bot.irc.privmsg(message.target, "Last.fm " + lightRed + bold + "| " + reset + bold + lfmAccount + reset + " last listened to " + "\"" + data.recenttracks.track[0].name + "\"" + " by " + data.recenttracks.track[0].artist["#text"] + lightRed + bold + " | " + reset + "http://www.last.fm/user/" + lfmAccount + "/now");
							}
						} else if(data.recenttracks.track[0].album['#text'] !== "") {
							bot.irc.privmsg(message.target, "Last.fm " + lightRed + bold + "| " + reset + bold + lfmAccount + reset + " is listening to " + "\"" + data.recenttracks.track[0].name + "\"" + " by " + data.recenttracks.track[0].artist["#text"] + " from " + underline + data.recenttracks.track[0].album["#text"] + underline + lightRed + bold + " | " + reset + "http://www.last.fm/user/" + lfmAccount + "/now");
						} else {
							bot.irc.privmsg(message.target, "Last.fm " + lightRed + bold + "| " + reset + bold + lfmAccount + reset + " is listening to " + "\"" + data.recenttracks.track[0].name + "\"" + " by " + data.recenttracks.track[0].artist["#text"] + lightRed + bold + " | " + reset + "http://www.last.fm/user/" + lfmAccount + "/now");
						}
				},
					error: function(error) {
						bot.irc.privmsg(message.target, "Last.fm " + lightRed + bold + "| " + bold + text + bold + " is not a registered username on Last.fm!");
					}
				}
			});
		} else {
			lfmAccount = message.nickname;
			bot.irc.privmsg(message.target, "Last.fm " + lightRed + bold + "| " + reset + bold + lfmAccount + bold + " doesn't exist in my database! Please use " + "\"" + ".addlastfm <last.fm username>" + "\"" + " to add yourself the db. You must be identified on " + config.server + ".");
		}
	}
});

// weekly charts .charts <self/user/registered handle>
api.hookEvent("orcatail", "privmsg", function(message) {
	if((message.message).search(".charts ") === 0) {
		var text = (message.message).replace(".charts ", "");
		lastfm.request("user.getTopArtists", {
			user: text,
			period: "7day",
			limit: 5,
			handlers: {
				success: function(data) {
					var charts = [];
					if((data.topartists.artist).length < 5) {
						var x = (data.topartists.artist).length;
					} else {
						x = 5;
					}
					for(i = 0; i < x; i++) {
						charts.push(data.topartists.artist[i].name + " (" + data.topartists.artist[i].playcount + ")");
					}
					bot.irc.privmsg(message.target, "Last.fm " + lightRed + bold + "| " + reset + "Weekly charts for " + bold + text + lightRed + " | " + reset + charts.join(", "));
				},
				error: function(error) {
					bot.irc.privmsg(message.target, "Last.fm " + lightRed + bold + "| " + bold + reset + bold + text + bold + " is not a registered username on Last.fm!");
				}
			}
		});
	} else if((message.message) === ".charts") {
		if(hostNames.indexOf(message.hostname) > -1) {
			var lfmAccount = Object.getOwnPropertyDescriptor(hostsAndAccounts[message.hostname], "lfm").value;
			lastfm.request("user.getTopArtists", {
				user: lfmAccount,
				period: "7day",
				limit: 5,
				handlers: {
					success: function(data) {
						var charts = [];
						if((data.topartists.artist).length < 5) {
							var x = (data.topartists.artist).length;
						} else {
							x = 5;
						}
						for(i = 0; i < x; i++) {
							charts.push(data.topartists.artist[i].name + " (" + data.topartists.artist[i].playcount + ")");
						}
						bot.irc.privmsg(message.target, "Last.fm " + lightRed + bold + "| " + reset + "Weekly charts for " + bold + lfmAccount + lightRed + " | " + reset + charts.join(", "));
					},
					error: function(error) {
						bot.irc.privmsg(message.target, "Last.fm " + lightRed + bold + "| " + bold + reset + bold + lfmAccount + bold + " is not a registered username on Last.fm!");
					}
				}
			});
		} else {
			lfmAccount = message.nickname;
			bot.irc.privmsg(message.target, "Last.fm " + lightRed + bold + "| " + reset + bold + lfmAccount + bold + " doesn't exist in my database! Please use " + "\"" + ".addlastfm <last.fm username>" + "\"" + " to add yourself the db. You must be identified on " + config.server + ".");
		}
	}
});

// compare musical compatibility .compare <user/registered handle>
api.hookEvent("orcatail", "privmsg", function(message) {
	if((message.message).search(".compare ") === 0) {
		var text = (message.message).replace(".compare ", "");
		lastfm.request("tasteometer.compare", {
			type1: "user",
			value1: message.nickname,
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
					if((data.comparison.result.artists.artist).length < 5) {
							var x = (data.comparison.result.artists.artist).length;
						} else {
							x = 5;
						}
					var similarArtists = [];
					for(i = 0; i < x; i++) {
						similarArtists.push(data.comparison.result.artists.artist[i].name);
					}
					bot.irc.privmsg(message.target, "Last.fm" + bold + lightRed + " | " + bold + reset + "Users " + message.nickname + " and " + text + " have " + bold + adjective + reset + " compatibility (similarity " + score + "%)" + darkRed + bold + " | " + reset + "Similar artists include: " + similarArtists.join(", "));
				},
				error: function(error) {
					bot.irc.privmsg(message.target, "Last.fm " + lightRed + bold + "| " + bold + reset + "Either " + bold + message.nickname + reset + " or " + bold + text + bold + " is not a registered username on Last.fm!");
				}
			}
		});
	}
});

// get artist info <is truncated at ~440 characters
// api.hookEvent("orcatail", "privmsg", function(message) {
// 	if((message.message).search(".getinfo ") === 0) {
// 		text = (message.message).replace(".getinfo ", "");
// 		lastfm.request("artist.getInfo", {
// 			artist: text,
// 			autocorrect: 1,
// 			handlers: {
// 				success: function(data) {
// 					// strip html, strip whitespace, decode entities, trim
// 					var reply = entities.decode(data.artist.bio.summary);
// 					bot.irc.privmsg(message.target, "Last.fm " + lightRed + bold + "| " + reset + reply.replace(/<(?:.|\n)*?>/gm, "").replace(/\s+/g, " ").trim());
// 				},
// 				error: function(error) {
// 					bot.irc.privmsg(message.target, "Last.fm " + lightRed + bold + "| " + bold + reset + bold + text + bold + " is not a valid artist on Last.fm!");
// 				}
// 			}
// 		});
// 	}
// });

// .similar
api.hookEvent("orcatail", "privmsg", function(message) {
	if((message.message).search(".similar ") === 0) {
		text = (message.message).replace(".similar ", "");
		lastfm.request("artist.getSimilar", {
			artist: text,
			autocorrect: 1,
			limit: 5,
			handlers: {
				success: function(data) {
					if((data.similarartists).length < 5) {
							var x = (data.similarartists).length;
						} else {
							x = 5;
						}
					var charts = [];
						for(i = 0; i < 5; i++) {
							charts.push(data.similarartists.artist[i].name + " (" + (data.similarartists.artist[i].match*100).toFixed(2) + "% match" + ")");
						}
					bot.irc.privmsg(message.target, "Last.fm " + lightRed + bold + "| " + reset + "Artists similar to " + bold + text + lightRed + " | " + reset + charts.join(", "));
				},
				error: function(error) {
					bot.irc.privmsg(message.target, "Last.fm " + lightRed + bold + "| " + bold + reset + bold + text + bold + " is not a valid artist on Last.fm!");
				}
			}
		});
	}
});

// hitbox live updates

// var isLive = 0;
// var sentFlag = 0;

// function timer() {
// 	try{
// 		http.get("http://api.hitbox.tv/media/live/SchismLock", function(res) {
// 			res.setEncoding("utf8");
// 			res.on("data", function(chunk) {
// 				if(chunk === "no_media_found") {
// 					console.log("no media found");
// 					return;
// 				}
// 				chunk = JSON.parse(chunk);
// 				console.log("parsed");
// 				if(chunk.livestream[0].media_is_live === "1") {
// 					isLive = 1;
// 					console.log("live");
// 					if(sentFlag === 0) {
// 						console.log("lakdfjlasdkj");
// 						if(chunk.livestream[0].team_name == null) {
// 							api.hookEvent("orcatail", "registered", function(message) {
// 								bot.irc.privmsg(channel.channels, "hitbox.tv " + lightGreen + "| " + reset + "\"" + chunk.livestream[0].media_status + "\" " + lightGreen + "| " + reset  + bold + chunk.livestream[0].channel.user_name + reset + " is currently live and playing " + chunk.livestream[0].category_name + " at " + chunk.livestream[0].channel.channel_link);
// 								console.log("livelive");
// 							});
// 						} else {
// 							api.hookEvent("orcatail", "registered", function(message) {
// 								bot.irc.privmsg(channel.channels, "hitbox.tv " + lightGreen + "| " + reset + "\"" + chunk.livestream[0].media_status + "\" " + lightGreen + "| " + reset  + bold + chunk.livestream[0].channel.user_name + reset + " is currently live and playing " + chunk.livestream[0].category_name + " on " + chunk.livestream[0].team_name + " at " + chunk.livestream[0].channel.channel_link);
// 								console.log("livelivelive");
// 							});
// 						}
// 						sentFlag = 1;
// 						console.log("sentFlag = 1")
// 					}
// 				} else {
// 					sentFlag = 0;
// 					console.log("not live");
// 				}
// 			});
// 		}).on("error", function(error) {
// 			console.log("Got error: " + error.message);
// 		});
// 	} catch(e) {
// 		console.log(e);
// 		console.log("hitbox");
// 	}
// }

// timer();
// setInterval(function() {
// 	return timer();
// }, 60000);