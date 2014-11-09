// get config files
var config = require("./config");
var channel = require("./channel");
var keys = require("./opendoors");

// get node modules
var fs = require("fs");
var url = require("url");
var request = require("request");
var cheerio = require("cheerio");
var factory = require("irc-factory"),
	api = new factory.Api();
var Entities = require("html-entities").AllHtmlEntities;
var twit = require("twit");
var LastFmNode = require("lastfm").LastFmNode;
var ig = require("instagram-node").instagram();
var google = require("googleapis");
var customsearch = google.customsearch("v1");
var urlshortener = google.urlshortener("v1");

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
var underline = "\u001f";

var t = new twit({
	consumer_key: keys.twitterConsumerKey,
	consumer_secret: keys.twitterConsumerSecret,
	access_token: keys.twitterAccessToken,
	access_token_secret: keys.twitterAccessTokenSecret
});

ig.use({
	client_id: keys.igClientId,
	client_secret: keys.igClientSecret
});

var lastfm = new LastFmNode({
	api_key: keys.lfmApiKey,
	secret: keys.lfmSecret
});
var lastfmdb = "./lastfmdb.json";
var hostsAndAccounts = {};
var hostNames = {};
var nicks = [];

fs.readFile(lastfmdb, "utf8", function(err, data) {
	if(err) throw err;
	hostsAndAccounts = JSON.parse(data);
	hostNames = Object.keys(hostsAndAccounts);
});

// greeting
api.hookEvent("orcatail", "privmsg", function(message) {
	if(message.message.indexOf("hi") > -1) {
		bot.irc.privmsg(message.target, "(⊙ ◡ ⊙)");
	}
});

// modules
api.hookEvent("orcatail", "privmsg", function(message) {
	switch(true) {
		// join
		case ((message.message).search("\.j") === 0 && message.hostname === "user/fiveseven-"):
			bot.irc.join(channel.channels);
			break;
		// help
		case (message.message === ".help" || (message.message).search(".help ") === 0):
			if(message.message === ".help") {
				bot.irc.privmsg(message.target, "Available commands: g, url, tw, ig, np, charts, addlastfm, compare, similar. Type \".help <command>\" for more information about a command!");
			} else if((message.message).search(".help ") === 0) {
				var text = (message.message).replace(".help ", "");
				switch(true) {
			  	case (text === "g"):
			    	bot.irc.privmsg(message.target, bold + "Help for " + text + ": " + reset + "Google search!" + bold + " Usage: " + reset + ".g <search term(s)> will return the top Google search result, as well as a shortlink to the remaining search results.");
			    	break;
		    	case (text === "url"):
		    		bot.irc.privmsg(message.target, bold + "Help for " + text + ": " + reset + "Link shortener!" + bold + " Usage: " + reset + ".url <valid link> will return a shortened link.");
		    		break;
		    	case (text === "tw"):
			    	bot.irc.privmsg(message.target, bold + "Help for " + text + ": " + reset + "Twitter module!" + bold + " Usage: " + reset + ".tw <username> will return the most recent tweet by <username>.");
			    	break;
		    	case (text === "ig"):
			    	bot.irc.privmsg(message.target, bold + "Help for " + text + ": " + reset + "Instagram module!" + bold + " Usage: " + reset + ".ig <username> will return the most recent photo/video by <username>, along with the caption and filter used (if applicable).");
			    	break;
		    	case (text === "np"):
		    		bot.irc.privmsg(message.target, bold + "Help for " + text + ": " + reset + "Last.fm module!" + bold + " Usage: " + reset + ".np (with no other parameters) returns your currently playing or most recently scrobbled track on last.fm (you must be in the bot's database for this function to work!). Entering .np <username> returns the currently playing or most recently scrobbled track for <username> on last.fm.");
		    		break;
	    		case (text === "charts"):
		    		bot.irc.privmsg(message.target, bold + "Help for " + text + ": " + reset + "Last.fm module!" + bold + " Usage: " + reset + ".charts (with no other parameters) returns your top five most played artists in the last seven days on last.fm (you must be in the bot's database for this function to work!). Entering .charts <username> returns the top five most played artists in the last seven days for <username> on last.fm.");
		    		break;
	    		case (text === "addlastfm"):
		    		bot.irc.privmsg(message.target, bold + "Help for " + text + ": " + reset + "Last.fm module!" + bold + " Usage: " + reset + ".addlastfm <username> stores your hostname and current IRC handle in the bot's database for usage with the .np, .charts, and .compare commands. You must be identified/authenticated on Snoonet for this feature to be of any significant usefulness.");
		    		break;
	    		case (text === "compare"):
		    		bot.irc.privmsg(message.target, bold + "Help for " + text + ": " + reset + "Last.fm module!" + bold + " Usage: " + reset + ".compare <username> calculates your musical compatibility with <username> using the last.fm tasteometer. .compare <username1> <username2> calculates the musical compatibility between <username1> and <username2> using the last.fm tasteometer.");
		    		break;
					case (text === "similar"):
			    		bot.irc.privmsg(message.target, bold + "Help for " + text + ": " + reset + "Last.fm module!" + bold + " Usage: " + reset + ".similar <artist> returns a list of similar artists and a percentage value of how closely the artists match, according to last.fm.");
		    		break;
	    		case (text === "live"):
			    		bot.irc.privmsg(message.target, bold + "Help for " + text + ": " + reset + "Twitch.tv module!" + bold + " Usage: " + reset + ".live returns a list of live streams that the channel follows. Entering .live:game returns a list of top streams for [game], sorted by viewer count.");
		    		break;
			  	default:
			    	bot.irc.privmsg(message.target, text + " is not a valid command!");
				}
			}
			break;
		// google custom search engine (cse)
		case ((message.message).search("\.g ") === 0):
			var text = (message.message).replace(".g ", "");
			customsearch.cse.list({cx: keys.googleCX, q: text, auth: keys.googleAPIKey}, function(err, resp) {
				if (err) {
					console.log(err);
					return;
				}
				if (resp.searchInformation.formattedTotalResults == 0) {
					bot.irc.privmsg(message.target, "No results found!");
				} else if (resp.items && resp.items.length > 0) {
					var searchResults = "https://www.google.com/?gws_rd=ssl#q=" + text.replace(/ /g, "+");
					var shortlink;
					// shorten search results url
					urlshortener.url.insert({ resource: { longUrl: searchResults } }, function(err, result) {
						if(err) {
							console.log(err);
							bot.irc.privmsg(message.target, entities.decode(resp.items[0].title).replace(/<(?:.|\n)*?>/gm, "").replace(/\s+/g, " ").trim() + darkBlue + bold + " | " + reset + entities.decode(resp.items[0].snippet).replace(/<(?:.|\n)*?>/gm, "").replace(/\s+/g, " ").trim() + darkBlue + bold + " | " + reset + resp.items[0].link + darkBlue + bold + " | " + reset + "more results: " + searchResults);
						} else {
							bot.irc.privmsg(message.target, entities.decode(resp.items[0].title).replace(/<(?:.|\n)*?>/gm, "").replace(/\s+/g, " ").trim() + darkBlue + bold + " | " + reset + entities.decode(resp.items[0].snippet).replace(/<(?:.|\n)*?>/gm, "").replace(/\s+/g, " ").trim() + darkBlue + bold + " | " + reset + resp.items[0].link + darkBlue + bold + " | " + reset + "more results: " + result.id);
						}
					});
				}
			});
			break;
		// link shortener
		case ((message.message).search("\.url ") === 0):
			var text = (message.message).replace(".url ", "").replace(/[^A-Za-z 0-9 \.,\?""!@#\$%\^&\*\(\)-_=\+;:<>\/\\\|\}\{\[\]`~]*/g, "");
			if(text.indexOf("01") === 0) {
				text = text.replace("01", "");
			}
			urlshortener.url.insert({ resource: { longUrl: text } }, function(err, result) {
				if(err) {
					bot.irc.privmsg(message.target, "There was an error in creating your shortlink!");
					console.log(err);
				} else {
					bot.irc.privmsg(message.target, "shortlink: " + result.id);
				}
			});
			break;
		// twitter
		case ((message.message).search("\.tw ") === 0):
			var text = (message.message).replace(".tw ", "");
			t.get("statuses/user_timeline", {screen_name: text, count: 1}, function (err, data, response) {
				if(data === undefined) {
					bot.irc.privmsg(message.target, "Twitter " + cyan + bold + "| " + reset + bold + text + reset + " is not a valid Twitter handle!");
				} else if(data[0] === undefined) {
					bot.irc.privmsg(message.target, "Twitter " + cyan + bold + "| " + reset + bold + text + reset + " hasn't tweeted yet!");
				} else {
					bot.irc.privmsg(message.target, "Twitter " + cyan + bold + "| " + bold + reset + "Most recent tweet by " + bold + data[0].user.name + bold + " "  + "(" + bold + "@" + data[0].user.screen_name + bold + ")" + bold + cyan + " | " + bold + reset + data[0].text + cyan + bold + " | " + bold + reset + data[0].created_at);
				}
			});
			break;
		// instagram
		case ((message.message).search("\.ig ") === 0):
			var text = (message.message).replace(".ig ", "");
			ig.user_search(text, {count: 1}, function(err, users, limit) {
				if(users.length > 0 && (users[0].username).toUpperCase() === text.toUpperCase()) {
					ig.user_media_recent(users[0].id, {count: 1}, function(err, medias, pagination, limit) {
						if(medias === undefined) {
							bot.irc.privmsg(message.target, "Instagram " + lightBlue + bold + "| " + reset + "User " + bold + users[0].username + reset + " has no photos to show or has a private account!");
						} else if(medias[0].caption !== null) {
							bot.irc.privmsg(message.target, "Instagram " + lightBlue + bold + "| " + reset + "Most recent post by " + bold + text + " (" + medias[0].user.full_name + ")" + lightBlue + " | " + reset + medias[0].caption.text + " " + (medias[0].link).replace("instagram.com", "instagr.am") + lightBlue + bold + " | " + reset + "Filter: " + medias[0].filter);
						} else {
							bot.irc.privmsg(message.target, "Instagram " + lightBlue + bold + "| " + reset + "Most recent post by " + bold + text + " (" + medias[0].user.full_name + ")" + lightBlue + " | " + reset + "No caption " + (medias[0].link).replace("instagram.com", "instagr.am") + lightBlue + bold + " | " + reset + "Filter: " + medias[0].filter);
						}
					});
				} else {
					bot.irc.privmsg(message.target, "Instagram " + lightBlue + bold + "| " + bold + reset + bold + text + bold + " is not a registered user on Instagram!");
				}
			});
			break;
		// .similar
		case ((message.message).search("\.similar ") === 0):
			var text = (message.message).replace(".similar ", "");
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
							for(i = 0; i < x; i++) {
								charts.push(data.similarartists.artist[i].name + " (" + (data.similarartists.artist[i].match*100).toFixed(2) + "% match" + ")");
							}
						bot.irc.privmsg(message.target, "Last.fm " + lightRed + bold + "| " + reset + "Artists similar to " + bold + text + lightRed + " | " + reset + charts.join(", "));
					},
					error: function(error) {
						bot.irc.privmsg(message.target, "Last.fm " + lightRed + bold + "| " + bold + reset + bold + text + bold + " is not a valid artist on Last.fm!");
					}
				}
			});
			break;
		// add to db
		case ((message.message).search(".addlastfm ") === 0):
			var text = (message.message).replace(".addlastfm ", "");
			lastfm.request("user.getInfo", {
				user: text,
				handlers: {
					success: function(data) {
						switch(true) {
							case (hostNames.indexOf(message.hostname) > -1 && (hostsAndAccounts[message.hostname].nicks).indexOf(message.nickname) > -1):
									bot.irc.privmsg(message.target, "Last.fm " + lightRed + bold + "| " + reset + bold + message.nickname + bold + " (" + message.hostname + ")" + " already has an associated Last.fm account (http://www.last.fm/user/" + Object.getOwnPropertyDescriptor(hostsAndAccounts[message.hostname], "lfm").value + reset + ")!");
									break;
							case (hostNames.indexOf(message.hostname) > -1 && (hostsAndAccounts[message.hostname].nicks).indexOf(message.nickname) === -1):
								nicks = (hostsAndAccounts[message.hostname].nicks);
								nicks.push(message.nickname);
								hostsAndAccounts[message.hostname] = {
									"lfm": text,
									"nicks": nicks
								};
								fs.writeFile(lastfmdb, JSON.stringify(hostsAndAccounts, null, 4), function (err) {
									if(err) throw err;
									hostNames = Object.keys(hostsAndAccounts);
								});
								bot.irc.privmsg(message.target, "Last.fm " + lightRed + bold + "| " + reset + "User " + bold + text + bold + reset + " is now associated with hostname " + bold + message.hostname + reset + " and nickname " + message.nickname);
								fs.readFile(lastfmdb, "utf8", function(err, data) {
									if(err) throw err;
									hostsAndAccounts = JSON.parse(data);
									hostNames = Object.keys(hostsAndAccounts);
								});
								nicks = [];
								break;
							default:
								nicks.push(message.nickname);
								hostsAndAccounts[message.hostname] = {
									"lfm": text,
									"nicks": nicks
								};
								fs.writeFile(lastfmdb, JSON.stringify(hostsAndAccounts, null, 4), function (err) {
									if(err) throw err;
									hostNames = Object.keys(hostsAndAccounts);
								});
								bot.irc.privmsg(message.target, "Last.fm " + lightRed + bold + "| " + reset + "User " + bold + text + bold + reset + " is now associated with hostname " + bold + message.hostname + reset + " and nickname " + message.nickname);
								fs.readFile(lastfmdb, "utf8", function(err, data) {
									if(err) throw err;
									hostsAndAccounts = JSON.parse(data);
									hostNames = Object.keys(hostsAndAccounts);
								});
								nicks = [];
								break;
						}
					},
					error: function(error) {
						bot.irc.privmsg(message.target, "Last.fm " + lightRed + bold + "| " + bold + reset + bold + text + bold + " is not a registered username on Last.fm!");
					}
				}
			});
			break;
		// now playing .np <self/user/registered handle>
		case ((message.message).search("\.np") === 0):
			var text;
			var hostess = JSON.stringify(hostsAndAccounts);
			function nowplaying(handle) {
				lastfm.request("user.getRecentTracks", {
					user: handle,
					handlers: {
						success: function(data) {
							if(data.recenttracks.track[0]["@attr"] === undefined) {
								if(data.recenttracks.track[0].album['#text'] !== "") {
									bot.irc.privmsg(message.target, "Last.fm " + lightRed + bold + "| " + reset + bold + handle + reset + " last listened to " + "\"" + data.recenttracks.track[0].name + "\"" + " by " + data.recenttracks.track[0].artist["#text"] + " from " + underline + data.recenttracks.track[0].album["#text"] + underline + lightRed + bold + " | " + reset + "http://www.last.fm/user/" + handle + "/now");
								} else {
									bot.irc.privmsg(message.target, "Last.fm " + lightRed + bold + "| " + reset + bold + handle + reset + " last listened to " + "\"" + data.recenttracks.track[0].name + "\"" + " by " + data.recenttracks.track[0].artist["#text"] + lightRed + bold + " | " + reset + "http://www.last.fm/user/" + handle + "/now");
								}
							} else if(data.recenttracks.track[0].album['#text'] !== "") {
								bot.irc.privmsg(message.target, "Last.fm " + lightRed + bold + "| " + reset + bold + handle + reset + " is listening to " + "\"" + data.recenttracks.track[0].name + "\"" + " by " + data.recenttracks.track[0].artist["#text"] + " from " + underline + data.recenttracks.track[0].album["#text"] + underline + lightRed + bold + " | " + reset + "http://www.last.fm/user/" + handle + "/now");
							} else {
								bot.irc.privmsg(message.target, "Last.fm " + lightRed + bold + "| " + reset + bold + handle + reset + " is listening to " + "\"" + data.recenttracks.track[0].name + "\"" + " by " + data.recenttracks.track[0].artist["#text"] + lightRed + bold + " | " + reset + "http://www.last.fm/user/" + handle + "/now");
							}
						},
						error: function(error) {
							bot.irc.privmsg(message.target, "Last.fm " + lightRed + bold + "| " + bold + reset + bold + handle + bold + " is not a registered username on Last.fm!");
						}
					}
				});
			}
			switch(true) {
				case((message.message).search(".np ") === 0):
					text = (message.message).replace(".np ", "");
					if(hostess.indexOf(text) > -1) {
						for(var i = 0; i < hostNames.length; i++) {
							if((JSON.stringify(hostsAndAccounts[hostNames[i]].nicks)).search(text) > -1) {
								text = hostsAndAccounts[hostNames[i]].lfm;
								break;
							}
						}
					}
					nowplaying(text);
					break;
				case(message.message === ".np"):
					if(hostNames.indexOf(message.hostname) > -1) {
						text = Object.getOwnPropertyDescriptor(hostsAndAccounts[message.hostname], "lfm").value;
						nowplaying(text);
					}  else {
						bot.irc.privmsg(message.target, "Last.fm " + lightRed + bold + "| " + reset + bold + message.nickname + bold + " doesn't exist in my database! Please use " + "\"" + ".addlastfm <last.fm username>" + "\"" + " to add yourself the db. You must be identified on " + config.server + ".");
					}
					break;
				default:
					break;
			}
			break;
		// weekly charts .charts <self/user/registered handle>
		case ((message.message).search(".charts") === 0):
			var text;
			var hostess = JSON.stringify(hostsAndAccounts);
			function getCharts(handle) {
				lastfm.request("user.getTopArtists", {
					user: handle,
					period: "7day",
					limit: 5,
					handlers: {
						success: function(data) {
							var charts = [];
							if((data.topartists.artist).length === undefined) {
								charts.push(data.topartists.artist.name + " (" + data.topartists.artist.playcount + ")");
							} else if((data.topartists.artist).length < 5) {
								var x = (data.topartists.artist).length;
							} else {
								x = 5;
							}
							for(i = 0; i < x; i++) {
								charts.push(data.topartists.artist[i].name + " (" + data.topartists.artist[i].playcount + ")");
							}
							bot.irc.privmsg(message.target, "Last.fm " + lightRed + bold + "| " + reset + "Weekly charts for " + bold + handle + lightRed + " | " + reset + charts.join(", "));
						},
						error: function(error) {
							bot.irc.privmsg(message.target, "Last.fm " + lightRed + bold + "| " + bold + reset + bold + handle + bold + " is not a registered username on Last.fm!");
						}
					}
				});
			}
			switch(true) {
				case((message.message).search(".charts ") === 0):
					text = (message.message).replace(".charts ", "");
					if(hostess.indexOf(text) > -1) {
						for(var i = 0; i < hostNames.length; i++) {
							if((JSON.stringify(hostsAndAccounts[hostNames[i]].nicks)).search(text) > -1) {
								text = hostsAndAccounts[hostNames[i]].lfm;
								break;
							}
						}
					}
					getCharts(text);
					break;
				case(message.message === ".charts"):
					if(hostNames.indexOf(message.hostname) > -1) {
						text = Object.getOwnPropertyDescriptor(hostsAndAccounts[message.hostname], "lfm").value;
						getCharts(text);
					} else {
						bot.irc.privmsg(message.target, "Last.fm " + lightRed + bold + "| " + reset + bold + message.nickname + bold + " doesn't exist in my database! Please use " + "\"" + ".addlastfm <last.fm username>" + "\"" + " to add yourself the db. You must be identified on " + config.server + ".");
					}
					break;
				default:
					break;
			}
			break;
		// compare musical compatibility .compare <user/registered handle>
		case ((message.message).search("\.compare ") === 0):
			var name1 = message.nickname;
			var name2 = (message.message).replace(".compare ", "");
			var myArray = (message.message).split(" ");
			myArray.splice(0, 1);
			var hostess = JSON.stringify(hostsAndAccounts);
			function compare(handle1, handle2) {
				lastfm.request("tasteometer.compare", {
					type1: "user",
					value1: handle1,
					type2: "user",
					value2: handle2,
					handlers: {
						success: function(data) {
							var score = (data.comparison.result.score * 100).toFixed(2);
							var adjective = "";
							switch(true) {
							  	case (score >= 90):
							    	adjective = lightRed + "SUPER" + reset;
							    	break;
						    	case (90 > score && score >= 70):
							    	adjective = orange + "VERY HIGH" + reset;
							    	break;
						    	case (70 > score && score >= 50):
							    	adjective = darkGreen + "HIGH" + reset;
							    	break;
						    	case (50 > score && score >= 30):
						    		adjective = magenta + "MEDIUM" + reset;
						    		break;
					    		case (30 > score && score >= 10):
						    		adjective = gray + "LOW" + reset;
						    		break;
							  	default:
							    	adjective = lightGray + "VERY LOW" + reset;
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
							bot.irc.privmsg(message.target, "Last.fm" + bold + lightRed + " | " + bold + reset + "Users " + bold + name1 + reset + " and " + bold + name2 + reset + " have " + bold + adjective + reset + " compatibility (similarity " + score + "%)" + darkRed + bold + " | " + reset + "Similar artists include: " + similarArtists.join(", "));
						},
						error: function(error) {
							bot.irc.privmsg(message.target, "Last.fm " + lightRed + bold + "| " + bold + reset + "Either " + bold + name1 + reset + " or " + bold + name2 + bold + " is not a registered username on Last.fm!");
						}
					}
				});
			}
			switch(true) {
				case (myArray.length != 2):
					if((hostess.toUpperCase()).search(name1.toUpperCase()) > -1 || (hostess.toUpperCase()).search(name2.toUpperCase()) > -1) {
						for(var i = 0; i < hostNames.length; i++) {
							if(((JSON.stringify(hostsAndAccounts[hostNames[i]].nicks)).toUpperCase()).search(name1.toUpperCase()) > -1) {
								name1 = hostsAndAccounts[hostNames[i]].lfm;
							}
							if(((JSON.stringify(hostsAndAccounts[hostNames[i]].nicks)).toUpperCase()).search(name2.toUpperCase()) > -1) {
								name2 = hostsAndAccounts[hostNames[i]].lfm;
							}
						}
					}
					compare(name1, name2);
					break;
				case (myArray.length === 2):
					name1 = myArray[0];
					name2 = myArray[1];
					if((hostess.toUpperCase()).search(name1.toUpperCase()) > -1 || (hostess.toUpperCase).search(name2.toUpperCase()) > -1) {
						for(var i = 0; i < hostNames.length; i++) {
							if((JSON.stringify(hostsAndAccounts[hostNames[i]].nicks)).toUpperCase().search(name1.toUpperCase()) > -1) {
								name1 = hostsAndAccounts[hostNames[i]].lfm;
							}
							if((JSON.stringify(hostsAndAccounts[hostNames[i]].nicks)).toUpperCase().search(name2.toUpperCase()) > -1) {
								name2 = hostsAndAccounts[hostNames[i]].lfm;
							}
						}
					}
					compare(name1, name2);
					break;
				default:
					break;
			}
			break;
		// get artist info <is truncated at ~440 characters
		case ((message.message).search(".getinfo ") === 0):
			text = (message.message).replace(".getinfo ", "");
			lastfm.request("artist.getInfo", {
				artist: text,
				autocorrect: 1,
				handlers: {
					success: function(data) {
						// strip html, strip whitespace, decode entities, trim
						var reply = entities.decode(data.artist.bio.summary);
						reply = reply.replace(/<(?:.|\n)*?>/gm, "").replace(/\s+/g, " ").trim();
						if(reply.length > 400) {
							reply = reply.substring(0, 400);
							console.log(reply);
							bot.irc.privmsg(message.target, "Last.fm " + lightRed + bold + "| " + reset + reply + "... Read more on Last.fm.");
						} else {
							console.log(reply);
							bot.irc.privmsg(message.target, "Last.fm " + lightRed + bold + "| " + reset + reply);
						}
					},
					error: function(error) {
						bot.irc.privmsg(message.target, "Last.fm " + lightRed + bold + "| " + bold + reset + bold + text + bold + " is not a valid artist on Last.fm!");
					}
				}
			});
			break;
		// bobby
		case ((message.message).search("\.bobby") === 0):
			bot.irc.privmsg(message.target, "http://aegyo.me/BOBBY");
			break;
		default:
			break;
	}
});

// url parser

api.hookEvent("orcatail", "privmsg", function(message) {
	var arr = (message.message).split(" ");
	var links = [];
	for(var i = 0; i < arr.length; i++) {
		if(url.parse(arr[i]).protocol !== null) {
			links.push(arr[i]);
		}
	}
	if(links.length > 0) {
		console.log(links);
		for(var i = 0; i < links.length; i++) {
			request(links[i], function(e, res, html) {
				if(!e && res.statusCode == 200) {
					var $ = cheerio.load(html, { lowerCaseTags: true, xmlMode: true });
					var pageTitle = $("title").text().trim().replace(/\r|\n/g, "").replace(/\s+/g, " ");
					bot.irc.privmsg(message.target, pageTitle);
				}
			});
		}
	}
});

// twitch.tv listener

// var streams = require("./streams");

// function twitch (game, num) {
// 	request("https://api.twitch.tv/kraken/streams/" + game[num].user, function (error, response, body) {
// 	  if (!error && response.statusCode === 200) {
// 	  	var parse = JSON.parse(body);
// 	  	if(parse.stream !== null) {
// 	  		game[num].isLive = 1;
// 	  		if(game[num].sentFlag === 0) {
// 	  			bot.irc.privmsg(channel.channels[0], "Twitch.tv" + magenta + " | " + reset + "\"" + parse.stream.channel.status + "\"" + magenta + " | " + reset  + bold + parse.stream.channel.display_name + reset + " is currently live and playing " + underline + parse.stream.channel.game + reset + " at " + parse.stream.channel.url);
// 	  			game[num].sentFlag = 1;
// 	  		}
// 	  		console.log(game[num].user + " live live live");
// 	  	} else {
// 	  		game[num].isLive = 0;
// 	  		game[num].sentFlag = 0;
// 	  		console.log(game[num].user + " not live");
// 	  	}
// 	  }
// 	});
// }

// var counter = 0;

// function timeout(game) {
// 	if(counter < game.length) {
// 		setTimeout(function () {
// 	    twitch(game, counter);
// 	    counter++;
// 	    timeout(game);
// 	  }, 1000);
// 	} else {
// 		counter = 0;
// 		setTimeout(function () {
// 			timeout(game);
// 		}, 30000);
// 	}
// }

// timeout(streams.csgo);

// ================================================================================================

var streams = require("./streams");

function twitch (game, num) {
	request("https://api.twitch.tv/kraken/streams/" + game[num].user, function (error, response, body) {
	  if (!error && response.statusCode === 200) {
	  	var parse = JSON.parse(body);
	  	if(parse.stream !== null) {
	  		game[num].isLive = 1;
	  		if(game[num].sentFlag === 0) {
	  			bot.irc.privmsg(channel.channels[0], "Twitch.tv" + magenta + " | " + reset + "\"" + parse.stream.channel.status + "\"" + magenta + " | " + reset  + bold + parse.stream.channel.display_name + reset + " is currently live and playing " + underline + parse.stream.channel.game + reset + " at " + parse.stream.channel.url);
	  			game[num].sentFlag = 1;
	  		}
	  		console.log(game[num].user + " live live live");
	  	} else {
	  		game[num].isLive = 0;
	  		game[num].sentFlag = 0;
	  		console.log(game[num].user + " not live");
	  	}
	  }
	});
}

var counter = 0;
var arrKeys = Object.keys(streams);
var arrCounter = 0;

function timeout() {
	if(counter < streams[arrKeys[arrCounter]].length) {
		setTimeout(function () {
			twitch(streams[arrKeys[arrCounter]], counter);
			counter++;
	    timeout(streams[arrKeys[arrCounter]]);
	  }, 1000);
	} else {
		counter = 0;
		arrCounter++;
		if(arrCounter < arrKeys.length) {
			timeout();
		} else {
			setTimeout(function () {
				arrCounter = 0;
				timeout();
			}, 30000);
		}
	}
}

timeout();

// .live

function listTop(game, target) {
	var list = "https://api.twitch.tv/kraken/search/streams?q=";
	var liveChans = [];
	list = list.concat(game);
	request(list, function (e, res, body) {
		var data = JSON.parse(body);
		for(var i = 0; i < data.streams.length; i++) {
			liveChans.push(data.streams[i].channel.url);
		}
		liveChans = liveChans.join(", ");
		bot.irc.privmsg(target, "Twitch.tv" + magenta + " | " + reset + "Live " + data.streams[0].channel.game + " streams: " + liveChans);
	});
}

api.hookEvent("orcatail", "privmsg", function(message) {
	var liveChans = [];
	if(message.message === "\.live") {
		for(var a = 0; a < arrKeys.length; a++) {
			for(var i = 0; i < streams[arrKeys[a]].length; i++) {
				if(streams[arrKeys[a]][i].isLive !== 0) {
					liveChans.push("http://twitch.tv/" +  streams[arrKeys[a]][i].user);
				}
			}
		}
		liveChans = liveChans.join(", ");
		if(liveChans.length !== 0) {
			bot.irc.privmsg(message.target, "Twitch.tv" + magenta + " | " + reset + "The following channels are live: " + liveChans);
		} else {
			bot.irc.privmsg(message.target, "Twitch.tv" + magenta + " | " + reset + "None of our followed channels are currently live!");
		}
	} else if(message.message === "\.live:sc2") {
		listTop("StarCraft II: Heart of the Swarm", message.target);
	} else if(message.message === "\.live:csgo") {
		listTop("Counter-Strike: Global Offensive", message.target);
	}
});