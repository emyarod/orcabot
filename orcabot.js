// get config files
var config = require('./config');
var channels = require('./channels');
var keys = require('./opendoors');

// get node modules
var fs = require('fs');
var url = require('url');
var irc = require('irc');
var request = require('request');
var cheerio = require('cheerio');
var Entities = require('html-entities').AllHtmlEntities;
var twit = require('twit');
var LastFmNode = require('lastfm').LastFmNode;
var ig = require('instagram-node').instagram();
var google = require('googleapis');
// var OAuth2 = google.auth.Oauth2;
// var oauth2Client = new OAuth2(keys.googleClientID, keys.googleClientSecret, keys.googleRedirectURL);
var customsearch = google.customsearch('v1');
var urlshortener = google.urlshortener('v1');
// var urlshortener = google.urlshortener({ version: 'v1', auth: oauth2Client });

var entities = new Entities();

// bot configuration
var bot = new irc.Client(config.server, config.nick, {
	userName: config.user,
	realName: config.realname,
	password: config.password,
	autoRejoin: true,
  channels: channels.test
});

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

var bt = require('./node_modules/bing-translate/lib/bing-translate.js').init({
	client_id: keys.clientID,
	client_secret: keys.msTranslatorKey
});

var lastfmdb = './lastfmdb.json';
var hostsAndAccounts = {};
var hostNames = {};
var nicks = [];

// bot response formatting
var white = '\u000300';
var black = '\u000301';
var darkBlue = '\u000302';
var darkGreen = '\u000303';
var lightRed = '\u000304';
var darkRed = '\u000305';
var magenta = '\u000306';
var orange = '\u000307';
var yellow = '\u000308';
var lightGreen = '\u000309';
var cyan = '\u000310';
var lightCyan = '\u000311';
var lightBlue = '\u000312';
var lightMagenta = '\u000313';
var gray = '\u000314';
var lightGray = '\u000315';
var reset = '\u000f';
var bold = '\u0002';
var underline = '\u001f';

bot.addListener('message', function(from, to, text, message) {
	if (text.indexOf('hi') > -1) {
		bot.say(to, "(⊙ ◡ ⊙)");
	}

	if (text.indexOf('flex') > -1) {
		bot.say(to, "ＮＯ  ＦＬＥＸ  ＺＯＮＥ  ༼ᕗຈ ل͜ຈ༽ᕗ ᕙ( ͡° ͜ʖ ͡°)ᕗ༼ᕗຈ ل͜ຈ༽ᕗ  ＮＯ  ＦＬＥＸ  ＺＯＮＥ");
	}
});

bot.addListener('error', function(message) {
    console.log('error: ', message);
});

fs.readFile(lastfmdb, "utf8", function(err, data) {
	if (err) throw err;
	hostsAndAccounts = JSON.parse(data);
	hostNames = Object.keys(hostsAndAccounts);
});

// modules

// join
function join(from, to, text, message) {
  for(var i = 0; i < channels.default.length; i++) {
  	bot.join(channels.default[i]);
  }
}

// help
function help(from, to, text, message) {
	if (text === '\.help') {
		bot.say(to, 'Available commands: g, url, tw, ig, np, charts, addlastfm, compare, similar. Type \'.help <command>\' for more information about a command!');
	} else if ((text).search('\.help ') === 0) {
		var text = (text).replace('.help ', '');
		switch(true) {
	  	case (text === 'g'):
	    	bot.say(to, bold + 'Help for ' + text + ': ' + reset + 'Google search!' + bold + ' Usage: ' + reset + '.g <search term(s)> will return the top Google search result, as well as a shortlink to the remaining search results.');
	    	break;
    	case (text === 'url'):
    		bot.say(to, bold + 'Help for ' + text + ': ' + reset + 'Link shortener!' + bold + ' Usage: ' + reset + '.url <valid link> will return a shortened link.');
    		break;
    	case (text === 'tw'):
	    	bot.say(to, bold + 'Help for ' + text + ': ' + reset + 'Twitter module!' + bold + ' Usage: ' + reset + '.tw <username> will return the most recent tweet by <username>.');
	    	break;
    	case (text === 'ig'):
	    	bot.say(to, bold + 'Help for ' + text + ': ' + reset + 'Instagram module!' + bold + ' Usage: ' + reset + '.ig <username> will return the most recent photo/video by <username>, along with the caption and filter used (if applicable).');
	    	break;
    	case (text === 'np'):
    		bot.say(to, bold + 'Help for ' + text + ': ' + reset + 'Last.fm module!' + bold + ' Usage: ' + reset + '.np (with no other parameters) returns your currently playing or most recently scrobbled track on last.fm (you must be in the bot\'s database for this function to work!). Entering .np <username> returns the currently playing or most recently scrobbled track for <username> on last.fm.');
    		break;
  		case (text === 'charts'):
    		bot.say(to, bold + 'Help for ' + text + ': ' + reset + 'Last.fm module!' + bold + ' Usage: ' + reset + '.charts (with no other parameters) returns your top five most played artists in the last seven days on last.fm (you must be in the bot\'s database for this function to work!). Entering .charts <username> returns the top five most played artists in the last seven days for <username> on last.fm.');
    		break;
  		case (text === 'addlastfm'):
    		bot.say(to, bold + 'Help for ' + text + ': ' + reset + 'Last.fm module!' + bold + ' Usage: ' + reset + '.addlastfm <username> stores your hostname and current IRC handle in the bot\'s database for usage with the .np and .charts commands. You must be identified/authenticated on Snoonet for this feature to be of any significant usefulness.');
    		break;
			case (text === 'similar'):
	    		bot.say(to, bold + 'Help for ' + text + ': ' + reset + 'Last.fm module!' + bold + ' Usage: ' + reset + '.similar <artist> returns a list of similar artists and a percentage value of how closely the artists match, according to last.fm.');
    		break;
  		case (text === 'live'):
	    		bot.say(to, bold + 'Help for ' + text + ': ' + reset + 'Twitch.tv module!' + bold + ' Usage: ' + reset + '.live returns a list of live streams that the channel follows. Entering .live:game returns a list of top streams for [game], sorted by viewer count.');
    		break;
  		case (text === 'tr'):
  				bot.say(to, bold + 'Help for ' + text + ': ' + reset + 'Translation module!' + bold + ' Usage: ' + reset + '.tr <input language>:<output language> <query> returns a translated version of <query> from <input language> to <output language>. For the full list of languages supported, see http://aegyo.me/xmS');
  			break;
	  	default:
	    	bot.say(to, text + ' is not a valid command!');
		}
	}
}

// google custom search engine (cse)
function googlesearch(from, to, text, message) {
	var text = (text).replace(".g ", "");
	customsearch.cse.list({cx: keys.googleCX, q: text, auth: keys.googleAPIKey}, function(err, resp) {
		if (err) {
			console.log(err);
			return;
		}
		if (resp.searchInformation.formattedTotalResults == 0) {
			bot.say(to, "No results found!");
		} else if (resp.items && resp.items.length > 0) {
			var searchResults = "https://www.google.com/?gws_rd=ssl#q=" + text.replace(/ /g, "+");
			var shortlink;
			// shorten search results url
			urlshortener.url.insert({ resource: { longUrl: searchResults } }, function(err, result) {
				if (err) {
					console.log(err);
					bot.say(to, entities.decode(resp.items[0].title).replace(/<(?:.|\n)*?>/gm, "").replace(/\s+/g, " ").trim() + darkBlue + bold + " | " + reset + entities.decode(resp.items[0].snippet).replace(/<(?:.|\n)*?>/gm, "").replace(/\s+/g, " ").trim() + darkBlue + bold + " | " + reset + resp.items[0].link + darkBlue + bold + " | " + reset + "more results: " + searchResults);
				} else {
					bot.say(to, entities.decode(resp.items[0].title).replace(/<(?:.|\n)*?>/gm, "").replace(/\s+/g, " ").trim() + darkBlue + bold + " | " + reset + entities.decode(resp.items[0].snippet).replace(/<(?:.|\n)*?>/gm, "").replace(/\s+/g, " ").trim() + darkBlue + bold + " | " + reset + resp.items[0].link + darkBlue + bold + " | " + reset + "more results: " + result.id);
				}
			});
		}
	});
}

// link shortener
function shortenurl(from, to, text, message) {
	var text = (text).replace('.url ', '').replace(/[^A-Za-z 0-9 \.,\?""!@#\$%\^&\*\(\)-_=\+;:<>\/\\\|\}\{\[\]`~]*/g, "");
	console.log(text);
	if (text.indexOf('01') === 0) {
		text = text.replace('01', '');
	}
	urlshortener.url.insert({ resource: { longUrl: text } }, function(err, result) {
		if (err) {
			bot.say(to, 'There was an error in creating your shortlink! ' + err);
			console.log(err);
		} else {
			bot.say(to, 'shortlink: ' + result.id);
		}
	});
}

// twitter
function twitterquery(from, to, text, message) {
	var text = (text).replace('.tw ', '');
	t.get('statuses/user_timeline', {screen_name: text, count: 1}, function(err, data, response) {
		if (err) {
			console.log(err);
		} else if (data === undefined) {
			bot.say(to, 'Twitter ' + cyan + bold + '| ' + reset + bold + text + reset + ' is not a valid Twitter handle!');
		} else if (data[0] === undefined) {
			bot.say(to, 'Twitter ' + cyan + bold + '| ' + reset + bold + text + reset + ' hasn\'t tweeted yet!');
		} else {
			bot.say(to, 'Twitter ' + cyan + bold + '| ' + bold + reset + 'Most recent tweet by ' + bold + data[0].user.name + bold + ' '  + '(' + bold + '@' + data[0].user.screen_name + bold + ')' + bold + cyan + ' | ' + bold + reset + data[0].text + cyan + bold + ' | ' + bold + reset + data[0].created_at);
		}
	});
}

// instagram
function instagramquery(from, to, text, message) {
	var text = (text).replace('.ig ', '');
	ig.user_search(text, {count: 1}, function(err, users, limit) {
		if (err) {
			console.log(err);
		} else if (users.length > 0 && (users[0].username).toUpperCase() === text.toUpperCase()) {
			ig.user_media_recent(users[0].id, {count: 1}, function(err, medias, pagination, limit) {
				if (medias === undefined) {
					bot.say(to, 'Instagram ' + lightBlue + bold + '| ' + reset + 'User ' + bold + users[0].username + reset + ' has no photos to show or has a private account!');
				} else if (medias[0].caption !== null) {
					bot.say(to, 'Instagram ' + lightBlue + bold + '| ' + reset + 'Most recent post by ' + bold + text + ' (' + medias[0].user.full_name + ')' + lightBlue + ' | ' + reset + medias[0].caption.text + ' ' + medias[0].link + lightBlue + bold + ' | ' + reset + 'Filter: ' + medias[0].filter);
				} else if (err) {
					console.log(err);
				} else {
					bot.say(to, 'Instagram ' + lightBlue + bold + '| ' + reset + 'Most recent post by ' + bold + text + ' (' + medias[0].user.full_name + ')' + lightBlue + ' | ' + reset + 'No caption ' + medias[0].link + lightBlue + bold + ' | ' + reset + 'Filter: ' + medias[0].filter);
				}
			});
		} else {
			bot.say(to, 'Instagram ' + lightBlue + bold + '| ' + bold + reset + bold + text + bold + ' is not a registered user on Instagram!');
		}
	});
}

// last.fm
// .similar
function similarartists(from, to, text, message) {
	var text = (text).replace('.similar ', '');
	lastfm.request('artist.getSimilar', {
		artist: text,
		autocorrect: 1,
		limit: 5,
		handlers: {
			success: function(data) {
				if ((data.similarartists).length < 5) {
						var x = (data.similarartists).length;
					} else {
						x = 5;
					}
				var charts = [];
					for(i = 0; i < x; i++) {
						charts.push(data.similarartists.artist[i].name + ' (' + (data.similarartists.artist[i].match*100).toFixed(2) + '% match' + ')');
					}
				bot.say(to, 'Last.fm ' + lightRed + bold + '| ' + reset + 'Artists similar to ' + bold + text + lightRed + ' | ' + reset + charts.join(', '));
			},
			error: function(error) {
				bot.say(to, 'Last.fm ' + lightRed + bold + '| ' + bold + reset + bold + text + bold + ' is not a valid artist on Last.fm!');
				console.log(error);
			}
		}
	});
}

// add to db
function addtodb(from, to, text, message) {
	var text = (text).replace('.addlastfm ', '');
	lastfm.request('user.getInfo', {
		user: text,
		handlers: {
			success: function(data) {
				switch(true) {
					case (hostNames.indexOf(message.host) > -1 && (hostsAndAccounts[message.host].nicks).indexOf(message.nick) > -1):
							bot.say(to, 'Last.fm ' + lightRed + bold + '| ' + reset + bold + message.nick + bold + ' (' + message.host + ')' + ' already has an associated Last.fm account (http://www.last.fm/user/' + Object.getOwnPropertyDescriptor(hostsAndAccounts[message.host], 'lfm').value + reset + ')!');
							break;
					case (hostNames.indexOf(message.host) > -1 && (hostsAndAccounts[message.host].nicks).indexOf(message.nick) === -1):
						nicks = (hostsAndAccounts[message.host].nicks);
						nicks.push(message.nick);
						hostsAndAccounts[message.host] = {
							'lfm': text,
							'nicks': nicks
						};
						fs.writeFile(lastfmdb, JSON.stringify(hostsAndAccounts, null, 4), function(err) {
							if (err) throw err;
							hostNames = Object.keys(hostsAndAccounts);
						});
						bot.say(to, 'Last.fm ' + lightRed + bold + '| ' + reset + 'User ' + bold + text + bold + reset + ' is now associated with hostname ' + bold + message.host + reset + ' and nickname ' + message.nick);
						fs.readFile(lastfmdb, 'utf8', function(err, data) {
							if (err) throw err;
							hostsAndAccounts = JSON.parse(data);
							hostNames = Object.keys(hostsAndAccounts);
						});
						nicks = [];
						break;
					default:
						nicks.push(message.nick);
						hostsAndAccounts[message.host] = {
							'lfm': text,
							'nicks': nicks
						};
						fs.writeFile(lastfmdb, JSON.stringify(hostsAndAccounts, null, 4), function(err) {
							if (err) throw err;
							hostNames = Object.keys(hostsAndAccounts);
						});
						bot.say(to, 'Last.fm ' + lightRed + bold + '| ' + reset + 'User ' + bold + text + bold + reset + ' is now associated with hostname ' + bold + message.host + reset + ' and nickname ' + message.nick);
						fs.readFile(lastfmdb, 'utf8', function(err, data) {
							if (err) throw err;
							hostsAndAccounts = JSON.parse(data);
							hostNames = Object.keys(hostsAndAccounts);
						});
						nicks = [];
						break;
				}
			},
			error: function(error) {
				bot.say(to, 'Last.fm ' + lightRed + bold + '| ' + bold + reset + bold + text + bold + ' is not a registered username on Last.fm!');
				console.log(error);
			}
		}
	});
}

// now playing .np <self/user/registered handle>
function lastfmnowplaying(from, to, text, message) {
	var text;
	var hostess = JSON.stringify(hostsAndAccounts);
	function nowplaying(handle) {
		lastfm.request('user.getRecentTracks', {
			user: handle,
			handlers: {
				success: function(data) {
					if (data.recenttracks.track[0]['@attr'] === undefined) {
						if (data.recenttracks.track[0].album['#text'] !== '') {
							bot.say(to, 'Last.fm ' + lightRed + bold + '| ' + reset + bold + handle + reset + ' last listened to ' + '\'' + data.recenttracks.track[0].name + '\'' + ' by ' + data.recenttracks.track[0].artist['#text'] + ' from ' + underline + data.recenttracks.track[0].album['#text'] + underline + lightRed + bold + ' | ' + reset + 'http://www.last.fm/user/' + handle + '/now');
						} else {
							bot.say(to, 'Last.fm ' + lightRed + bold + '| ' + reset + bold + handle + reset + ' last listened to ' + '\'' + data.recenttracks.track[0].name + '\'' + ' by ' + data.recenttracks.track[0].artist['#text'] + lightRed + bold + ' | ' + reset + 'http://www.last.fm/user/' + handle + '/now');
						}
					} else if (data.recenttracks.track[0].album['#text'] !== '') {
						bot.say(to, 'Last.fm ' + lightRed + bold + '| ' + reset + bold + handle + reset + ' is listening to ' + '\'' + data.recenttracks.track[0].name + '\'' + ' by ' + data.recenttracks.track[0].artist['#text'] + ' from ' + underline + data.recenttracks.track[0].album['#text'] + underline + lightRed + bold + ' | ' + reset + 'http://www.last.fm/user/' + handle + '/now');
					} else {
						bot.say(to, 'Last.fm ' + lightRed + bold + '| ' + reset + bold + handle + reset + ' is listening to ' + '\'' + data.recenttracks.track[0].name + '\'' + ' by ' + data.recenttracks.track[0].artist['#text'] + lightRed + bold + ' | ' + reset + 'http://www.last.fm/user/' + handle + '/now');
					}
				},
				error: function(error) {
					bot.say(to, 'Last.fm ' + lightRed + bold + '| ' + bold + reset + bold + handle + bold + ' is not a registered username on Last.fm!');
					console.log(error);
				}
			}
		});
	}
	switch(true) {
		case((text).search('.np ') === 0):
			text = (text).replace('.np ', '');
			if (hostess.indexOf(text) > -1) {
				for(var i = 0; i < hostNames.length; i++) {
					if ((JSON.stringify(hostsAndAccounts[hostNames[i]].nicks)).search(text) > -1) {
						text = hostsAndAccounts[hostNames[i]].lfm;
						break;
					}
				}
			}
			nowplaying(text);
			break;
		case(text === '.np'):
			if (hostNames.indexOf(message.host) > -1) {
				text = Object.getOwnPropertyDescriptor(hostsAndAccounts[message.host], 'lfm').value;
				nowplaying(text);
			}  else {
				bot.say(to, 'Last.fm ' + lightRed + bold + '| ' + reset + bold + message.nick + bold + ' doesn\'t exist in my database! Please use ' + '\'' + '.addlastfm <last.fm username>' + '\'' + ' to add yourself the db. You must be identified on ' + config.server + '.');
			}
			break;
		default:
			break;
	}
}

// weekly charts .charts <self/user/registered handle>
function getweeklycharts(from, to, text, message) {
	var text;
	var hostess = JSON.stringify(hostsAndAccounts);
	function getCharts(handle) {
		lastfm.request('user.getTopArtists', {
			user: handle,
			period: '7day',
			limit: 5,
			handlers: {
				success: function(data) {
					var charts = [];
					if ((data.topartists.artist).length === undefined) {
						charts.push(data.topartists.artist.name + ' (' + data.topartists.artist.playcount + ')');
					} else if ((data.topartists.artist).length < 5) {
						var x = (data.topartists.artist).length;
					} else {
						x = 5;
					}
					for(i = 0; i < x; i++) {
						charts.push(data.topartists.artist[i].name + ' (' + data.topartists.artist[i].playcount + ')');
					}
					bot.say(to, 'Last.fm ' + lightRed + bold + '| ' + reset + 'Weekly charts for ' + bold + handle + lightRed + ' | ' + reset + charts.join(', '));
				},
				error: function(error) {
					bot.say(to, 'Last.fm ' + lightRed + bold + '| ' + bold + reset + bold + handle + bold + ' is not a registered username on Last.fm!');
					console.log(error);
				}
			}
		});
	}
	switch(true) {
		case((text).search('\\.charts ') === 0):
			text = (text).replace('.charts ', '');
			if (hostess.indexOf(text) > -1) {
				for(var i = 0; i < hostNames.length; i++) {
					if ((JSON.stringify(hostsAndAccounts[hostNames[i]].nicks)).search(text) > -1) {
						text = hostsAndAccounts[hostNames[i]].lfm;
						break;
					}
				}
			}
			getCharts(text);
			break;
		case(text === '.charts'):
			if (hostNames.indexOf(message.host) > -1) {
				text = Object.getOwnPropertyDescriptor(hostsAndAccounts[message.host], 'lfm').value;
				getCharts(text);
			} else {
				bot.say(to, 'Last.fm ' + lightRed + bold + '| ' + reset + bold + message.nick + bold + ' doesn\'t exist in my database! Please use ' + '\'' + '.addlastfm <last.fm username>' + '\'' + ' to add yourself the db. You must be identified on ' + config.server + '.');
			}
			break;
		default:
			break;
	}
}

// get artist info <is truncated at ~440 characters
function getartistinfo(from, to, text, message) {
	text = (text).replace('.getinfo ', '');
	lastfm.request('artist.getInfo', {
		artist: text,
		autocorrect: 1,
		handlers: {
			success: function(data) {
				// strip html, strip whitespace, decode entities, trim
				var reply = entities.decode(data.artist.bio.summary);
				reply = reply.replace(/<(?:.|\n)*?>/gm, '').replace(/\s+/g, ' ').trim();
				if (reply.length > 380) {
					reply = reply.substring(0, 380);
					bot.say(to, 'Last.fm ' + lightRed + bold + '| ' + reset + reply + '... Read more on Last.fm.');
				} else {
					bot.say(to, 'Last.fm ' + lightRed + bold + '| ' + reset + reply);
				}
			},
			error: function(error) {
				bot.say(to, 'Last.fm ' + lightRed + bold + '| ' + bold + reset + bold + text + bold + ' is not a valid artist on Last.fm!');
				console.log(error);	
			}
		}
	});
}

bot.addListener('message', function(from, to, text, message) {
	switch(true) {
		// join
		case (text.search('\\.j') === 0 && message.host === config.handlerHostname):
			join(from, to, text, message);
			break;

		// help
		case (text === '\.help' || (text).search('\.help ') === 0):
			help(from, to, text, message);
			break;

		// google custom search engine (cse)
		case ((text).search("\\.g ") === 0):
			googlesearch(from, to, text, message);
			break;

		// url shortener
		case ((text).search("\\.url ") === 0):
			shortenurl(from, to, text, message);
			break;

		// twitter
		case ((text).search('\\.tw ') === 0):
			twitterquery(from, to, text, message);
			break;

		// instagram
		case ((text).search('\\.ig ') === 0):
			instagramquery(from, to, text, message);
			break;

		// .similar
		case ((text).search('\\.similar ') === 0):
			similarartists(from, to, text, message);
			break;

		// .addlastfm <last.fm username>
		case ((text).search('\\.addlastfm ') === 0):
			addtodb(from, to, text, message);
			break;

		// now playing .np <self/user/registered handle>
		case ((text).search('\\.np') === 0):
			lastfmnowplaying(from, to, text, message);
			break;

		// weekly charts .charts <self/user/registered handle>
		case ((text).search('\\.charts') === 0):
			getweeklycharts(from, to, text, message);
			break;

		// get artist info <is truncated at ~440 characters
		case ((text).search('\\.getinfo ') === 0):
			getartistinfo(from, to, text, message);
			break;

		// bobby
		case ((text).search('\\.bobby') === 0):
			bot.say(to, 'http://aegyo.me/BOBBY');
			break;

		// default
		default:
			break;
	}
});