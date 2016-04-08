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
var moment = require('moment');
var Entities = require('html-entities').AllHtmlEntities;
var twit = require('twit');
var LastFmNode = require('lastfm').LastFmNode;
var ig = require('instagram-node').instagram();
var google = require('googleapis');
var googleAPIKey = keys.googleAPIKey;

var customsearch = google.customsearch('v1');
var urlshortener = google.urlshortener('v1');
var youtube = google.youtube('v3');

var entities = new Entities();

// bot configuration
var bot = new irc.Client(config.server, config.nick, {
	userName: config.user,
	realName: config.realname,
	password: config.password,
	autoRejoin: true,
  channels: channels.default
});

var t = new twit({
	consumer_key: keys.twitterConsumerKey,
	consumer_secret: keys.twitterConsumerSecret,
	access_token: keys.twitterAccessToken,
	access_token_secret: keys.twitterAccessTokenSecret
});

ig.use({
	client_id: keys.igClientId,
	client_secret: keys.igClientSecret,
});

var lastfm = new LastFmNode({
	api_key: keys.lfmApiKey,
	secret: keys.lfmSecret
});

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

// get video details
function getYouTubeVideoInfo(to, videoID) {
	youtube.videos.list({
		auth: googleAPIKey,
		part: 'snippet, contentDetails, status, statistics',
		id: videoID
	}, function(err, data) {
		if (!err) {
			// top search result = data.items[0]
			var videoTitle = bold + data.items[0].snippet.title;
			var channelName = darkRed + bold + data.items[0].snippet.channelTitle;
			var viewCount = bold + data.items[0].statistics.viewCount.replace(/\B(?=(\d{3})+(?!\d))/g, ',') + reset + ' views'; // add commas to mark every third digit

			var duration = moment.duration(data.items[0].contentDetails.duration, moment.ISO_8601).asSeconds();
			var contentRating = '';
			// conversion because moment.js does not support conversion from duration to h:m:s format
			function getHours(timeInSeconds) {
				return Math.floor(timeInSeconds / 3600);
			}

			function getMinutes(timeInSeconds) {
				return Math.floor(timeInSeconds / 60);
			}

			// convert video duration from ISO-8601
			var hours = getHours(duration);
			if (hours >= 1) { // at least 1:00:00
				duration = duration - (hours * 3600);
				var minutes = getMinutes(duration);
				if (minutes >= 1) { // at least 1:01:00
					seconds = duration - (minutes * 60);
					duration = hours + 'h ' + minutes + 'm ' + seconds + 's';
				} else { // between 1:00:00 and 1:01:00
					duration = hours + 'h ' + duration + 's';
				}
			} else {
				var minutes = getMinutes(duration);
				if (minutes >= 1) { // between 1:00 and 1:00:00
					seconds = duration - (minutes * 60);
					duration = minutes + 'm ' + seconds + 's';
				} else { // below 1:00
					duration = duration + 's';
				}
			}

			// find if video is age restricted
			if (data.items[0].contentDetails.contentRating !== undefined) {
				contentRating = bold + darkRed + '**NSFW** | ' + reset;
			}

			bot.say(to, contentRating + videoTitle + darkRed + ' | ' + reset + 'uploaded by ' + channelName + ' | ' + reset + viewCount + bold + darkRed + ' | ' + reset + duration);
		} else {
			console.log('YOUTUBE -- ' + err);
			bot.say(to, err);
		}
	});
}

function announceLink(messageTarget, link) {
	request(link, function(e, res, html) {
		if (!e && res.statusCode == 200) {
			var $ = cheerio.load(html, { lowerCaseTags: true, xmlMode: true });
			var pageTitle = $('title').text().trim().replace(/\r|\n/g, '').replace(/\s+/g, ' ');
			bot.say(messageTarget, pageTitle);
		} else {
			console.log('URL PARSER -- ' + e);
		}
	});
}

// url parser
bot.addListener('message', function(from, to, text, message) {
	var arr = text.split(' ');
	var links = [];

	// filter URLs
	for(var i = 0; i < arr.length; i++) {
		if (url.parse(arr[i]).protocol !== null) {
			links.push(arr[i]);
		}
	}

	if (links.length > 0) {
		for (var i = 0; i < links.length; i++) {
			switch(true) {

				// youtube or youtu.be link
				case(links[i].search(/youtube\.com\//gi) > -1 || links[i].search(/youtu\.be\//gi) > -1):
					console.log('PARSING YOUTUBE LINK');
					// add yt link to ytLinks array while removing yt link from links array
					var ytLink = links.splice(i, 1).toString();
					var urlPath = url.parse(ytLink).path.toString();
					request(ytLink, function(e, res, html) {
						if (!e && res.statusCode == 200) {
							if (urlPath.search(/\/watch\?v\=/g) == 0) { // full youtube links
								// '/watch?v=videoID&asdf' => '/videoID&asdf' => '/videoID' => 'videoID'
								var videoID = urlPath.replace(/\/watch\?v\=/g, '/').match(/((?:\/[\w\.\-]+)+)/gi)[0].toString().slice(1);
								getYouTubeVideoInfo(to, videoID);
							} else if (urlPath.match(/((?:\/[\w\.\-]+)+)/gi)[0].toString()) { // shortened youtube links
								// '/videoID&asdf' => 'videoID'
								var videoID = urlPath.match(/((?:\/[\w\.\-]+)+)/gi)[0].toString().slice(1);
								getYouTubeVideoInfo(to, videoID);
							}
						} else {
							console.log('YOUTUBE -- ' + e);
							if (e !== null) {
								bot.say(to, e);
							}
						}
					});
					break;

				// twitter.com/username/status/tweetID links
				case(links[i].search(/(twitter\.com).*?\/.*?(\/)(status)(\/)(\d+)/gi) > -1):
					console.log('PARSING TWITTER LINK');
					var twitterLink = links.splice(i, 1).toString();
					var tweetID = twitterLink.match(/(status)(\/)(\d+)/gi)[0].toString().slice(7);
					request(twitterLink, function(e, res, html) {
						if (!e && res.statusCode == 200) {
							t.get('statuses/show/:id', {id: tweetID}, function(err, data, response) {
								if (err) {
									console.log('TWITTER -- ' + err);
									bot.say(to, err.message);
								} else {
									var username = data.user.name;
									var screenName = data.user.screen_name;
									var tweet = data.text;
									var date = data.created_at;
									bot.say(to, bold + username + ' '  + '(@' + screenName + ')' + cyan + ' | ' + reset + tweet + cyan + bold + ' | ' + reset + date);
								}
							});
						} else {
							console.log('TWITTER -- ' + e);
							bot.say(to, 'Not a valid tweet!');
							if (e !== null) {
								bot.say(to, e);
							}
						}
					});
					break;

				// instagram.com/p/mediaID links
				case(links[i].search(/(instagram\.com)(\/)(p)(\/)/gi) > -1):
					console.log('PARSING INSTAGRAM LINK');
					var instagramLink = links.splice(i, 1).toString();
					var mediaID = instagramLink.match(/.*?((?:\/[\w\.\-]+)+)/gi)[0].toString().slice(28);
					request(instagramLink, function(e, res, html) {
						if (!e && res.statusCode == 200) {
							var $ = cheerio.load(html, { lowerCaseTags: true, xmlMode: true });
							// find "id":"mediaID","caption" in <script> tag
							if ($('script').text().match(/("id")(:)(")(\d+)(")(,)("caption")/gi) == null) {
								var caption = '';
								if ($('script').text().match(/("id")(:)(")(\d+)(")(,)("date")/gi) == null) {
									bot.say(to, 'Something went wrong on this page!');
								} else{
									mediaID = $('script').text().match(/("id")(:)(")(\d+)(")(,)("date")/gi)[0].slice(6, -8);
								}
							} else {
								mediaID = $('script').text().match(/("id")(:)(")(\d+)(")(,)("caption")/gi)[0].slice(6, -11);
							}
							ig.media(mediaID, function(err, media, remaining, limit) {
								if (err) {
									console.log('INSTAGRAM -- ' + err);
								} else {
									var username = media.user.username;
									var filter = 'Filter: ' + media.filter;

									// full name
									if (media.user.full_name == '') {
										var fullname = media.user.full_name;
									} else {
										var fullname = ' (' + media.user.full_name + ')';
									}

									// image or video
									if (media.videos) {
										var introText = 'Video by ';
									} else {
										var introText = 'Image by ';
									}

									// caption handling
									if (media.caption !== null) {
										caption = media.caption.text + lightBlue + bold + ' | ' + reset;
									}

									// location handling
									if (media.location == null) {
										var location = '';
									} else {
										var location = 'Location: ' + media.location.name + lightBlue + bold + ' | ' + reset;
									}

									bot.say(to, introText + bold + username + fullname + lightBlue + ' | ' + reset + caption + location + filter);
								}
							});
						} else {
							console.log('INSTAGRAM -- ' + e);
							bot.say(to, 'Sorry, this page isn\'t available');
						}
					});
					break;
					
				// announce all other valid links
				default:
					console.log('PARSING OTHER LINK');
					announceLink(to, links[i]);
					break;
			}
		}
	}
});

bot.addListener('message', function(from, to, text, message) {
	if (text.indexOf('hi') > -1) {
		bot.say(to, '(⊙ ◡ ⊙)');
	}

	if (text.indexOf('flex') > -1) {
		bot.say(to, 'ＮＯ  ＦＬＥＸ  ＺＯＮＥ  ༼ᕗຈ ل͜ຈ༽ᕗ ᕙ( ͡° ͜ʖ ͡°)ᕗ༼ᕗຈ ل͜ຈ༽ᕗ  ＮＯ  ＦＬＥＸ  ＺＯＮＥ');
	}
});

var mstranslator = require('mstranslator');
// second parameter to constructor (true) indicates that the token should be auto-generated
var translator = new mstranslator({
  client_id: keys.clientID,
  client_secret: keys.msTranslatorKey
}, true);

function textTranslate(from, to, text, message) {
	// regex for '.tr text' to catch unicode
	var detectedLanguageToEnglish = /(\.)(tr)( )([\u0041-\u005A\u0061-\u007A\u00AA\u00B5\u00BA\u00C0-\u00D6\u00D8-\u00F6\u00F8-\u02C1\u02C6-\u02D1\u02E0-\u02E4\u02EC\u02EE\u0370-\u0374\u0376\u0377\u037A-\u037D\u0386\u0388-\u038A\u038C\u038E-\u03A1\u03A3-\u03F5\u03F7-\u0481\u048A-\u0527\u0531-\u0556\u0559\u0561-\u0587\u05D0-\u05EA\u05F0-\u05F2\u0620-\u064A\u066E\u066F\u0671-\u06D3\u06D5\u06E5\u06E6\u06EE\u06EF\u06FA-\u06FC\u06FF\u0710\u0712-\u072F\u074D-\u07A5\u07B1\u07CA-\u07EA\u07F4\u07F5\u07FA\u0800-\u0815\u081A\u0824\u0828\u0840-\u0858\u08A0\u08A2-\u08AC\u0904-\u0939\u093D\u0950\u0958-\u0961\u0971-\u0977\u0979-\u097F\u0985-\u098C\u098F\u0990\u0993-\u09A8\u09AA-\u09B0\u09B2\u09B6-\u09B9\u09BD\u09CE\u09DC\u09DD\u09DF-\u09E1\u09F0\u09F1\u0A05-\u0A0A\u0A0F\u0A10\u0A13-\u0A28\u0A2A-\u0A30\u0A32\u0A33\u0A35\u0A36\u0A38\u0A39\u0A59-\u0A5C\u0A5E\u0A72-\u0A74\u0A85-\u0A8D\u0A8F-\u0A91\u0A93-\u0AA8\u0AAA-\u0AB0\u0AB2\u0AB3\u0AB5-\u0AB9\u0ABD\u0AD0\u0AE0\u0AE1\u0B05-\u0B0C\u0B0F\u0B10\u0B13-\u0B28\u0B2A-\u0B30\u0B32\u0B33\u0B35-\u0B39\u0B3D\u0B5C\u0B5D\u0B5F-\u0B61\u0B71\u0B83\u0B85-\u0B8A\u0B8E-\u0B90\u0B92-\u0B95\u0B99\u0B9A\u0B9C\u0B9E\u0B9F\u0BA3\u0BA4\u0BA8-\u0BAA\u0BAE-\u0BB9\u0BD0\u0C05-\u0C0C\u0C0E-\u0C10\u0C12-\u0C28\u0C2A-\u0C33\u0C35-\u0C39\u0C3D\u0C58\u0C59\u0C60\u0C61\u0C85-\u0C8C\u0C8E-\u0C90\u0C92-\u0CA8\u0CAA-\u0CB3\u0CB5-\u0CB9\u0CBD\u0CDE\u0CE0\u0CE1\u0CF1\u0CF2\u0D05-\u0D0C\u0D0E-\u0D10\u0D12-\u0D3A\u0D3D\u0D4E\u0D60\u0D61\u0D7A-\u0D7F\u0D85-\u0D96\u0D9A-\u0DB1\u0DB3-\u0DBB\u0DBD\u0DC0-\u0DC6\u0E01-\u0E30\u0E32\u0E33\u0E40-\u0E46\u0E81\u0E82\u0E84\u0E87\u0E88\u0E8A\u0E8D\u0E94-\u0E97\u0E99-\u0E9F\u0EA1-\u0EA3\u0EA5\u0EA7\u0EAA\u0EAB\u0EAD-\u0EB0\u0EB2\u0EB3\u0EBD\u0EC0-\u0EC4\u0EC6\u0EDC-\u0EDF\u0F00\u0F40-\u0F47\u0F49-\u0F6C\u0F88-\u0F8C\u1000-\u102A\u103F\u1050-\u1055\u105A-\u105D\u1061\u1065\u1066\u106E-\u1070\u1075-\u1081\u108E\u10A0-\u10C5\u10C7\u10CD\u10D0-\u10FA\u10FC-\u1248\u124A-\u124D\u1250-\u1256\u1258\u125A-\u125D\u1260-\u1288\u128A-\u128D\u1290-\u12B0\u12B2-\u12B5\u12B8-\u12BE\u12C0\u12C2-\u12C5\u12C8-\u12D6\u12D8-\u1310\u1312-\u1315\u1318-\u135A\u1380-\u138F\u13A0-\u13F4\u1401-\u166C\u166F-\u167F\u1681-\u169A\u16A0-\u16EA\u1700-\u170C\u170E-\u1711\u1720-\u1731\u1740-\u1751\u1760-\u176C\u176E-\u1770\u1780-\u17B3\u17D7\u17DC\u1820-\u1877\u1880-\u18A8\u18AA\u18B0-\u18F5\u1900-\u191C\u1950-\u196D\u1970-\u1974\u1980-\u19AB\u19C1-\u19C7\u1A00-\u1A16\u1A20-\u1A54\u1AA7\u1B05-\u1B33\u1B45-\u1B4B\u1B83-\u1BA0\u1BAE\u1BAF\u1BBA-\u1BE5\u1C00-\u1C23\u1C4D-\u1C4F\u1C5A-\u1C7D\u1CE9-\u1CEC\u1CEE-\u1CF1\u1CF5\u1CF6\u1D00-\u1DBF\u1E00-\u1F15\u1F18-\u1F1D\u1F20-\u1F45\u1F48-\u1F4D\u1F50-\u1F57\u1F59\u1F5B\u1F5D\u1F5F-\u1F7D\u1F80-\u1FB4\u1FB6-\u1FBC\u1FBE\u1FC2-\u1FC4\u1FC6-\u1FCC\u1FD0-\u1FD3\u1FD6-\u1FDB\u1FE0-\u1FEC\u1FF2-\u1FF4\u1FF6-\u1FFC\u2071\u207F\u2090-\u209C\u2102\u2107\u210A-\u2113\u2115\u2119-\u211D\u2124\u2126\u2128\u212A-\u212D\u212F-\u2139\u213C-\u213F\u2145-\u2149\u214E\u2183\u2184\u2C00-\u2C2E\u2C30-\u2C5E\u2C60-\u2CE4\u2CEB-\u2CEE\u2CF2\u2CF3\u2D00-\u2D25\u2D27\u2D2D\u2D30-\u2D67\u2D6F\u2D80-\u2D96\u2DA0-\u2DA6\u2DA8-\u2DAE\u2DB0-\u2DB6\u2DB8-\u2DBE\u2DC0-\u2DC6\u2DC8-\u2DCE\u2DD0-\u2DD6\u2DD8-\u2DDE\u2E2F\u3005\u3006\u3031-\u3035\u303B\u303C\u3041-\u3096\u309D-\u309F\u30A1-\u30FA\u30FC-\u30FF\u3105-\u312D\u3131-\u318E\u31A0-\u31BA\u31F0-\u31FF\u3400-\u4DB5\u4E00-\u9FCC\uA000-\uA48C\uA4D0-\uA4FD\uA500-\uA60C\uA610-\uA61F\uA62A\uA62B\uA640-\uA66E\uA67F-\uA697\uA6A0-\uA6E5\uA717-\uA71F\uA722-\uA788\uA78B-\uA78E\uA790-\uA793\uA7A0-\uA7AA\uA7F8-\uA801\uA803-\uA805\uA807-\uA80A\uA80C-\uA822\uA840-\uA873\uA882-\uA8B3\uA8F2-\uA8F7\uA8FB\uA90A-\uA925\uA930-\uA946\uA960-\uA97C\uA984-\uA9B2\uA9CF\uAA00-\uAA28\uAA40-\uAA42\uAA44-\uAA4B\uAA60-\uAA76\uAA7A\uAA80-\uAAAF\uAAB1\uAAB5\uAAB6\uAAB9-\uAABD\uAAC0\uAAC2\uAADB-\uAADD\uAAE0-\uAAEA\uAAF2-\uAAF4\uAB01-\uAB06\uAB09-\uAB0E\uAB11-\uAB16\uAB20-\uAB26\uAB28-\uAB2E\uABC0-\uABE2\uAC00-\uD7A3\uD7B0-\uD7C6\uD7CB-\uD7FB\uF900-\uFA6D\uFA70-\uFAD9\uFB00-\uFB06\uFB13-\uFB17\uFB1D\uFB1F-\uFB28\uFB2A-\uFB36\uFB38-\uFB3C\uFB3E\uFB40\uFB41\uFB43\uFB44\uFB46-\uFBB1\uFBD3-\uFD3D\uFD50-\uFD8F\uFD92-\uFDC7\uFDF0-\uFDFB\uFE70-\uFE74\uFE76-\uFEFC\uFF21-\uFF3A\uFF41-\uFF5A\uFF66-\uFFBE\uFFC2-\uFFC7\uFFCA-\uFFCF\uFFD2-\uFFD7\uFFDA-\uFFDC]+)/g;
	var translateLanguageList;
	var speakLanguageList;

	translator.getLanguagesForTranslate(function(e, data) {
		if (!e) {
			translateLanguageList = data;
		} else {
			console.log('TRANSLATOR -- ' + e);
		}
	});

	translator.getLanguagesForSpeak(function(e, data) {
		if (!e) {
			speakLanguageList = data;
		} else {
			console.log('TRANSLATOR -- ' + e);
		}
	});

	var params = {
		locale: 'en',
		languageCodes: [],
	  text: '',
	  from: '',
	  to: '',
	  language: '',
	  format: 'audio/mp3'
	};

	switch (true) {
		// search for a colon after '.tr languagecode' in input command
		case (text.search(/^(\.)(tr)( ).*?(:)/g) === 0):
			// '.tr auto:languagecode '
			if (text.search(/^(\.)(tr)( )(auto)(:).*?( )/g) === 0) {
				var found = text.match(/^(\.)(tr)( )(auto)(:).*?( )/g);
				var str = found.toString().split(':'); // '.tr code', 'code '
				params.from = (str[0].split(' '))[1]; // auto
				params.to = str[1].trim();
				params.text = text.slice(found[0].length);
				// gets language code for input text
				translator.detect(params, function(e, detectedLanguage) {
					if (!e) {
						params.from = detectedLanguage;
						params.language = detectedLanguage;

						params.languageCodes = [];
						params.languageCodes.push(params.from, params.to);
						// converts language codes to language names
						translator.getLanguageNames(params, function(e, languageNames) {
							if (!e) {
								inputLanguage = languageNames[0];
								outputLanguage = languageNames[1];

								// output translation in English
								translator.translate(params, function(e, translatedText) {
									if (!e) {
										bot.say(to, translatedText + ' (' + inputLanguage + ' to ' + outputLanguage + ')');

										// stream spoken mp3 to uguu.se and provide link
										translator.speak(params, function(e, audiostream) {
											if (!e) {
												var req = request.post('https://uguu.se/api.php?d=upload-tool', function (err, resp, body) {
												  if (err) {
												    console.log('TRANSLATOR -- ' + err);
												    bot.say(to, 'There was an error with your translation.');
												  } else {
												    bot.say(to, 'Listen: ' + body);
												  }
												});
												var form = req.form();
												form.append('file', audiostream, {
												  filename: inputText + '_' + inputLanguage + '_to_' + outputLanguage + '.mp3',
												  contentType: params.format
												});
											} else {
												console.log('TRANSLATOR -- ' + e);
											}
										});

									} else {
										console.log('TRANSLATOR -- ' + e);
										bot.say(to, 'There was an error with your translation.');
									}
								});
							} else {
								console.log('TRANSLATOR -- ' + e);
								bot.say(to, 'There was an error with your translation.');
							}
						});
					} else {
						console.log('TRANSLATOR -- ' + e);
						bot.say(to, 'There was an error with your translation.');
					}	
				});
			} else if (text.search(/(\.)(tr)( ).*?(:).*?( )/g) === 0) {
			// '.tr languagecode:languagecode'
				var found = text.match(/(\.)(tr)( ).*?(:).*?( )/g);
				var str = found.toString().split(':'); // '.tr code', 'code '
				params.from = (str[0].split(' '))[1];
				params.to = str[1].trim();
				params.text = text.slice(found[0].length);

				params.languageCodes = [];
				params.languageCodes.push(params.from, params.to);
				// converts language codes to language names
				translator.getLanguageNames(params, function(e, languageNames) {
					if (!e) {
						inputLanguage = languageNames[0];
						outputLanguage = languageNames[1];

						// output translation in English
						translator.translate(params, function(e, translatedText) {
							if (!e) {
								bot.say(to, translatedText + ' (' + inputLanguage + ' to ' + outputLanguage + ')');
							} else {
								console.log('TRANSLATOR -- ' + e);
								bot.say(to, 'There was an error with your translation.');
							}
						});
					} else {
						console.log('TRANSLATOR -- ' + e);
						bot.say(to, 'There was an error with your translation.');
					}
				});
			}
			break;
		// ".tr word or sentence", defaults to English output
		case (text.search(detectedLanguageToEnglish) === 0):
			var found = text.match(detectedLanguageToEnglish);
			var inputText = text.substr(4).trim();

			params.to = 'en';
			params.text = inputText;

			// gets language code for input text
			translator.detect(params, function(e, detectedLanguage) {
				if (!e) {
					params.from = detectedLanguage;
					params.language = detectedLanguage;

					params.languageCodes = [];
					params.languageCodes.push(params.from, params.to);
					// converts language codes to language names
					translator.getLanguageNames(params, function(e, languageNames) {
						if (!e) {
							inputLanguage = languageNames[0];
							outputLanguage = languageNames[1];

							// output translation in English
							translator.translate(params, function(e, translatedText) {
								if (!e) {
									bot.say(to, translatedText + ' (' + inputLanguage + ' to ' + outputLanguage + ')');

									// stream spoken mp3 to uguu.se and provide link
									translator.speak(params, function(e, audiostream) {
										if (!e) {
											var req = request.post('https://uguu.se/api.php?d=upload-tool', function (err, resp, body) {
											  if (err) {
											    console.log('TRANSLATOR -- ' + err);
											    bot.say(to, 'There was an error with your translation.');
											  } else {
											    bot.say(to, 'Listen: ' + body);
											  }
											});
											var form = req.form();
											form.append('file', audiostream, {
											  filename: inputText + '_' + inputLanguage + '_to_' + outputLanguage + '.mp3',
											  contentType: params.format
											});
										} else {
											console.log('TRANSLATOR -- ' + e);
										}
									});

								} else {
									console.log('TRANSLATOR -- ' + e);
									bot.say(to, 'There was an error with your translation.');
								}
							});
						} else {
							console.log('TRANSLATOR -- ' + e);
							bot.say(to, 'There was an error with your translation.');
						}
					});
				} else {
					console.log('TRANSLATOR -- ' + e);
					bot.say(to, 'There was an error with your translation.');
				}	
			});
			break;
		default:
			break;
	}
}

bot.addListener('error', function(message) {
  console.log('error: ', message);
});

// modules

// join
function joinDefaultChannels() {
  for(var i = 0; i < channels.default.length; i++) {
  	bot.join(channels.default[i]);
  }
}

// help
function help(from, to, text, message) {
	if (text === '\.help') {
		bot.say(to, 'Available commands: g, url, tw, ig, yt, np, charts, addlastfm, compare, similar. Type \'.help <command>\' for more information about a command!');
	} else if (text.search('\.help ') === 0) {
		var text = text.replace('.help ', '');
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
    	case (text === 'yt'):
	    	bot.say(to, bold + 'Help for ' + text + ': ' + reset + 'YouTube module!' + bold + ' Usage: ' + reset + '.yt <query> will return the top search result for <query>, along with relevant video information and a link to more search results.');
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
	var text = text.replace('.g ', '');
	customsearch.cse.list({cx: keys.googleCX, q: text, auth: keys.googleAPIKey}, function(err, resp) {
		if (err) {
			console.log('GOOGLE SEARCH -- ' + err);
			return;
		}
		if (resp.searchInformation.formattedTotalResults == 0) {
			bot.say(to, 'No results found!');
		} else if (resp.items && resp.items.length > 0) {
			var searchResults = 'https://www.google.com/?gws_rd=ssl#q=' + text.replace(/ /g, '+');
			var shortlink;
			// shorten search results url
			urlshortener.url.insert({ resource: { longUrl: searchResults }, auth: googleAPIKey }, function(err, result) {
				if (err) {
					console.log('URL SHORTENER -- ' + err);
					bot.say(to, entities.decode(resp.items[0].title).replace(/<(?:.|\n)*?>/gm, '').replace(/\s+/g, ' ').trim() + darkBlue + bold + ' | ' + reset + entities.decode(resp.items[0].snippet).replace(/<(?:.|\n)*?>/gm, '').replace(/\s+/g, ' ').trim() + darkBlue + bold + ' | ' + reset + resp.items[0].link + darkBlue + bold + ' | ' + reset + 'more results: ' + searchResults);
				} else {
					bot.say(to, entities.decode(resp.items[0].title).replace(/<(?:.|\n)*?>/gm, '').replace(/\s+/g, ' ').trim() + darkBlue + bold + ' | ' + reset + entities.decode(resp.items[0].snippet).replace(/<(?:.|\n)*?>/gm, '').replace(/\s+/g, ' ').trim() + darkBlue + bold + ' | ' + reset + resp.items[0].link + darkBlue + bold + ' | ' + reset + 'more results: ' + result.id);
				}
			});
		}
	});
}

// link shortener
function shortenurl(from, to, text, message) {
	var text = text.replace('.url ', '');
	urlshortener.url.insert({ resource: { longUrl: text }, auth: googleAPIKey }, function(err, result) {
		if (err) {
			bot.say(to, 'There was an error in creating your shortlink! ' + err);
			console.log('URL SHORTENER -- ' + err);
		} else {
			bot.say(to, 'shortlink: ' + result.id);
		}
	});
}

// twitter
function getTwitterStatus(from, to, text, message) {
	var user = text.replace('.tw ', '');
	if (user.length > 0) {
		t.get('statuses/user_timeline', {screen_name: user, count: 1}, function(err, data, response) {
			if (err) {
				console.log('TWITTER -- ' + err);
				bot.say(to, err.message);
			} else if (data[0] === undefined) {
				bot.say(to, bold + user + reset + ' hasn\'t tweeted yet!');
			} else {
				var username = data[0].user.name;
				var screenName = data[0].user.screen_name;
				var tweet = data[0].text;
				var date = data[0].created_at;
				bot.say(to, 'Most recent tweet by ' + bold + username + ' (@' + screenName + ')' + cyan + ' | ' + reset + tweet + cyan + bold + ' | ' + reset + date);
			}
		});
	}
}

// instagram
function instagramquery(from, to, text, message) {
	var username = text.replace('.ig ', '');

	request('https://www.instagram.com/' + username, function(e, res, html) {
		if (!e && res.statusCode == 200) {
			if (username == '') {
				return;
			}
			var $ = cheerio.load(html, { lowerCaseTags: true, xmlMode: true });
			// find "id":"userID","biography" in <script> tag
			var userID = $('script').text().match(/("id")(:)(")(\d+)(")(,)("biography")/gi)[0].slice(6, -13);
			ig.user_media_recent(userID, {count: 1}, function(err, medias, pagination, limit) {
				if (err) {
					console.log('INSTAGRAM -- ' + err);
					if (err.toString().search('you cannot view this resource') > -1) {
						bot.say(to, 'This Instagram account is private!');
					}
				} else if (medias == '') {
					bot.say(to, 'This user has no posts yet!');
				} else {
					username = medias[0].user.username;
					if (medias[0].user.full_name == '') {
						var fullname = medias[0].user.full_name;
					} else {
						var fullname = ' (' + medias[0].user.full_name + ')';
					}
					
					var mediaLink = ' ' + medias[0].link + lightBlue + bold + ' | ' + reset;
					var filter = 'Filter: ' + medias[0].filter;

					if (medias[0].caption == null) { // media has no caption
						var caption = '';
					} else { // media has caption
						var caption = medias[0].caption.text;
					}

					bot.say(to, 'Most recent post by ' + bold + username + fullname + lightBlue + ' | ' + reset + caption + mediaLink + filter);
				}
			});
		} else {
			console.log('INSTAGRAM request -- ' + e);
			bot.say(to, 'This Instagram account cannot be found!');
		}
	});
}

// youtube
function searchYouTube(from, to, text, message) {
	var ytSearch = text.replace('.yt ', '');
	var searchResults;

	urlshortener.url.insert({ resource: { longUrl: 'https://www.youtube.com/results?search_query=' + ytSearch }, auth: googleAPIKey }, function(err, result) {
		if (err) {
			console.log('URL SHORTENER -- ' + err);
		} else {
			searchResults = reset + bold + 'More results: ' + reset + result.id;
		}
	});

	youtube.search.list({
		auth: googleAPIKey,
		part: 'snippet',
		q: ytSearch
	}, function(err, data) {
		if (!err) {
			switch(true) {
				// no results from query
				case(data.pageInfo.totalResults === 0):
					bot.say(to, 'No results found!');
				break;
				default:
					// top search result = data.items[0]
					var videoID = data.items[0].id.videoId;

					youtube.videos.list({
						auth: googleAPIKey,
						part: 'snippet, contentDetails, status, statistics',
						id: videoID
					}, function(err, data) {
						if (!err) {
							// top search result = data.items[0]
							var videoTitle = bold + data.items[0].snippet.title;
							var channelName = darkRed + bold + data.items[0].snippet.channelTitle;
							var viewCount = bold + data.items[0].statistics.viewCount.replace(/\B(?=(\d{3})+(?!\d))/g, ",") + reset + ' views'; // add commas to mark every third digit

							var duration = moment.duration(data.items[0].contentDetails.duration, moment.ISO_8601).asSeconds();
							var contentRating = '';
							// conversion because moment.js does not support conversion from duration to h:m:s format
							function getHours(timeInSeconds) {
								return Math.floor(timeInSeconds / 3600);
							}

							function getMinutes(timeInSeconds) {
								return Math.floor(timeInSeconds / 60);
							}

							// convert video duration from ISO-8601
							var hours = getHours(duration);
							if (hours >= 1) { // at least 1:00:00
								duration = duration - (hours * 3600);
								var minutes = getMinutes(duration);
								if (minutes >= 1) { // at least 1:01:00
									seconds = duration - (minutes * 60);
									duration = hours + 'h ' + minutes + 'm ' + seconds + 's';
								} else { // between 1:00:00 and 1:01:00
									duration = hours + 'h ' + duration + 's';
								}
							} else {
								var minutes = getMinutes(duration);
								if (minutes >= 1) { // between 1:00 and 1:00:00
									seconds = duration - (minutes * 60);
									duration = minutes + 'm ' + seconds + 's';
								} else { // below 1:00
									duration = duration + 's';
								}
							}

							// find if video is age restricted
							if (data.items[0].contentDetails.contentRating !== undefined) {
								contentRating = bold + darkRed + '**NSFW** | ' + reset;
							}

							bot.say(to, contentRating + videoTitle + darkRed + ' | ' + reset + 'uploaded by ' + channelName + ' | ' + reset + viewCount + bold + darkRed + ' | ' + reset + duration + bold + darkRed + ' | ' + reset + bold + 'https://youtu.be/' + videoID + darkRed + ' | ' + searchResults);
						} else {
							console.log('YOUTUBE -- ' + err);
							bot.say(to, err);
						}
					});
					break;
			}
		} else {
			console.log('YOUTUBE -- ' + err);
		}
	});
}

// last.fm
var lastfmdb = './lastfmdb.json';
var hostsAndAccounts = {};
var hostNames = {};
var IRCnicknames = [];

fs.readFile(lastfmdb, 'utf8', function(err, data) {
	if (err) throw err;
	hostsAndAccounts = JSON.parse(data);
	hostNames = Object.keys(hostsAndAccounts);
});

// .similar
function similarartists(from, to, text, message) {
	var artist = text.replace('.similar ', '');
	lastfm.request('artist.getSimilar', {
		artist: artist,
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
				bot.say(to, 'Last.fm ' + lightRed + bold + '| ' + reset + 'Artists similar to ' + bold + artist + lightRed + ' | ' + reset + charts.join(', '));
			},
			error: function(error) {
				bot.say(to, 'Last.fm' + lightRed + bold + ' | ' + reset + 'Artist not found!');
				console.log('LAST.FM -- ' + (error));
			}
		}
	});
}

// add to db
function addtodb(from, to, text, message) {
	var lfmUsername = text.replace('.addlastfm ', '');
	var hostname = message.host;
	var nickname = message.nick;
	lastfm.request('user.getInfo', {
		user: lfmUsername,
		handlers: {
			success: function(data) {
				switch(true) {
					// if hostname and IRC nick both found
					case (hostNames.indexOf(hostname) > -1 && (hostsAndAccounts[hostname].nicks).indexOf(nickname) > -1):
							bot.say(to, 'Last.fm ' + lightRed + bold + '| ' + reset + bold + nickname + bold + ' (' + hostname + ')' + ' already has an associated Last.fm account (http://www.last.fm/user/' + Object.getOwnPropertyDescriptor(hostsAndAccounts[hostname], 'lfm').value + reset + ')!');
							break;
					// if hostname found and nickname not found 
					case (hostNames.indexOf(hostname) > -1 && (hostsAndAccounts[hostname].nicks).indexOf(nickname) === -1):
						IRCnicknames = (hostsAndAccounts[hostname].nicks);
						IRCnicknames.push(nickname);
						hostsAndAccounts[hostname] = {
							'lfm': lfmUsername,
							'nicks': IRCnicknames
						};
						fs.writeFile(lastfmdb, JSON.stringify(hostsAndAccounts, null, 4), function(err) {
							if (err) throw err;
							hostNames = Object.keys(hostsAndAccounts);
						});
						bot.say(to, 'Last.fm ' + lightRed + bold + '| ' + reset + 'User ' + bold + lfmUsername + bold + reset + ' is now associated with hostname ' + bold + hostname + reset + ' and nickname ' + nickname);
						fs.readFile(lastfmdb, 'utf8', function(err, data) {
							if (err) throw err;
							hostsAndAccounts = JSON.parse(data);
							hostNames = Object.keys(hostsAndAccounts);
						});
						IRCnicknames = [];
						break;
					default:
						IRCnicknames.push(nickname);
						hostsAndAccounts[hostname] = {
							'lfm': lfmUsername,
							'nicks': IRCnicknames
						};
						fs.writeFile(lastfmdb, JSON.stringify(hostsAndAccounts, null, 4), function(err) {
							if (err) throw err;
							hostNames = Object.keys(hostsAndAccounts);
						});
						bot.say(to, 'Last.fm ' + lightRed + bold + '| ' + reset + 'User ' + bold + lfmUsername + bold + reset + ' is now associated with hostname ' + bold + hostname + reset + ' and nickname ' + nickname);
						fs.readFile(lastfmdb, 'utf8', function(err, data) {
							if (err) throw err;
							hostsAndAccounts = JSON.parse(data);
							hostNames = Object.keys(hostsAndAccounts);
						});
						IRCnicknames = [];
						break;
				}
			},
			error: function(error) {
				bot.say(to, 'Last.fm ' + lightRed + bold + '| ' + bold + reset + bold + lfmUsername + bold + ' is not a registered username on Last.fm!');
				console.log('LAST.FM -- ' + (error));
			}
		}
	});
}

// now playing .np <self/user/registered handle>
function lastfmnowplaying(from, to, text, message) {
	var lfmUsername;
	var hostess = JSON.stringify(hostsAndAccounts);
	function nowplaying(handle) {
		lastfm.request('user.getRecentTracks', {
			user: handle,
			handlers: {
				success: function(data) {
					if (data.recenttracks.track[0]['@attr'] === undefined) {
						if (data.recenttracks.track[0].album['#text'] !== '') {
							bot.say(to, 'Last.fm ' + lightRed + bold + '| ' + reset + bold + handle + reset + ' last listened to ' + '\'' + data.recenttracks.track[0].name + '\'' + ' by ' + data.recenttracks.track[0].artist['#text'] + ' from ' + underline + data.recenttracks.track[0].album['#text'] + underline + lightRed + bold + ' | ' + reset + 'http://www.last.fm/user/' + handle);
						} else {
							bot.say(to, 'Last.fm ' + lightRed + bold + '| ' + reset + bold + handle + reset + ' last listened to ' + '\'' + data.recenttracks.track[0].name + '\'' + ' by ' + data.recenttracks.track[0].artist['#text'] + lightRed + bold + ' | ' + reset + 'http://www.last.fm/user/' + handle);
						}
					} else if (data.recenttracks.track[0].album['#text'] !== '') {
						bot.say(to, 'Last.fm ' + lightRed + bold + '| ' + reset + bold + handle + reset + ' is listening to ' + '\'' + data.recenttracks.track[0].name + '\'' + ' by ' + data.recenttracks.track[0].artist['#text'] + ' from ' + underline + data.recenttracks.track[0].album['#text'] + underline + lightRed + bold + ' | ' + reset + 'http://www.last.fm/user/' + handle);
					} else {
						bot.say(to, 'Last.fm ' + lightRed + bold + '| ' + reset + bold + handle + reset + ' is listening to ' + '\'' + data.recenttracks.track[0].name + '\'' + ' by ' + data.recenttracks.track[0].artist['#text'] + lightRed + bold + ' | ' + reset + 'http://www.last.fm/user/' + handle);
					}
				},
				error: function(error) {
					bot.say(to, 'Last.fm ' + lightRed + bold + '| ' + bold + reset + bold + handle + bold + ' is not a registered username on Last.fm!');
					console.log('LAST.FM -- ' + (error));
				}
			}
		});
	}
	switch(true) {
		case(text.trim().search('.np ') === 0):
			lfmUsername = text.replace('.np ', '');
			if (hostess.indexOf(lfmUsername) > -1) {
				for(var i = 0; i < hostNames.length; i++) {
					console.log(JSON.stringify(hostsAndAccounts[hostNames[i]].nicks));
					if (JSON.stringify(hostsAndAccounts[hostNames[i]].nicks).search(lfmUsername) > -1) {
						if (lfmUsername == hostsAndAccounts[hostNames[i]].lfm) {
							lfmUsername = hostsAndAccounts[hostNames[i]].lfm;
						}
						break;
					}
				}
			}
			nowplaying(lfmUsername);
			break;
		case(text === '.np'):
			// if hostname found
			if (hostNames.indexOf(message.host) > -1) {
				lfmUsername = Object.getOwnPropertyDescriptor(hostsAndAccounts[message.host], 'lfm').value;
				nowplaying(lfmUsername);
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
	var lfmUsername;
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
					console.log('LAST.FM -- ' + (error));
				}
			}
		});
	}
	switch(true) {
		case(text.search('\\.charts ') === 0):
			lfmUsername = text.replace('.charts ', '');
			if (hostess.indexOf(lfmUsername) > -1) {
				for(var i = 0; i < hostNames.length; i++) {
					if ((JSON.stringify(hostsAndAccounts[hostNames[i]].nicks)).search(lfmUsername) > -1) {
						lfmUsername = hostsAndAccounts[hostNames[i]].lfm;
						break;
					}
				}
			}
			getCharts(lfmUsername);
			break;
		case(text === '.charts'):
			if (hostNames.indexOf(message.host) > -1) {
				lfmUsername = Object.getOwnPropertyDescriptor(hostsAndAccounts[message.host], 'lfm').value;
				getCharts(lfmUsername);
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
	artist = text.replace('.getinfo ', '');
	lastfm.request('artist.getInfo', {
		artist: artist,
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
				bot.say(to, 'Last.fm ' + lightRed + bold + '| ' + bold + reset + bold + artist + bold + ' is not a valid artist on Last.fm!');
				console.log('LAST.FM -- ' + error);	
			}
		}
	});
}

// twitch.tv listener
var streams = require('./streams');

function twitch(game, num) {
	request('https://api.twitch.tv/kraken/streams/' + game[num].user, function(error, response, body) {
	  if (!error && response.statusCode === 200) {
	  	var parse = JSON.parse(body);
	  	if (parse.stream !== null) {
	  		game[num].isLive = 1;
	  		if (game[num].sentFlag === 0) {
	  			bot.say(channels.twitch, '\"' + parse.stream.channel.status + '\"' + magenta + ' | ' + reset  + bold + parse.stream.channel.display_name + reset + ' is currently live and playing ' + underline + parse.stream.channel.game + reset + ' at ' + parse.stream.channel.url);
	  			game[num].sentFlag = 1;
	  		}
	  		console.log(game[num].user + ' live live live');
	  	} else {
	  		game[num].isLive = 0;
	  		game[num].sentFlag = 0;
	  		console.log(game[num].user + ' not live');
	  	}
	  }
	});
}

var counter = 0;
var arrKeys = Object.keys(streams);
var arrCounter = 0;

function timeout() {
	if (counter < streams[arrKeys[arrCounter]].length) {
		setTimeout(function() {
			twitch(streams[arrKeys[arrCounter]], counter);
			counter++;
	    timeout(streams[arrKeys[arrCounter]]);
	  }, 1000);
	} else {
		counter = 0;
		arrCounter++;
		if (arrCounter < arrKeys.length) {
			timeout();
		} else {
			setTimeout(function() {
				arrCounter = 0;
				timeout();
			}, 60000);
		}
	}
}

timeout();

// .live
function listTop(game, target) {
	var list = 'https://api.twitch.tv/kraken/search/streams?q=';
	var liveChans = [];
	list = list.concat(game);
	request(list, function(e, res, body) {
		var data = JSON.parse(body);
		for(var i = 0; i < data.streams.length; i++) {
			liveChans.push(data.streams[i].channel.url);
		}
		liveChans = liveChans.join(', ');
		bot.say(target, 'Twitch.tv' + magenta + ' | ' + reset + 'Live ' + data.streams[0].channel.game + ' streams: ' + liveChans);
	});
}

bot.addListener('message', function(from, to, text, message) {
	var liveChans = [];
	if (text === '\.live') {
		for(var a = 0; a < arrKeys.length; a++) {
			for(var i = 0; i < streams[arrKeys[a]].length; i++) {
				if (streams[arrKeys[a]][i].isLive !== 0) {
					liveChans.push('http://twitch.tv/' +  streams[arrKeys[a]][i].user);
				}
			}
		}
		liveChans = liveChans.join(', ');
		if (liveChans.length !== 0) {
			bot.say(to, 'Twitch.tv' + magenta + ' | ' + reset + 'The following channels are live: ' + liveChans);
		} else {
			bot.say(to, 'Twitch.tv' + magenta + ' | ' + reset + 'None of our followed channels are currently live!');
		}
	} else if (text === '\.live:sc2') {
		listTop('StarCraft II: Heart of the Swarm', to);
	} else if (text === '\.live:csgo') {
		listTop('Counter-Strike: Global Offensive', to);
	}
});

bot.addListener('message', function(from, to, text, message) {
	switch(true) {
		// join
		case (text.search(/^(\.j)/gi) === 0 && message.host === config.handlerHostname):
			if (text == '\.j') {
				joinDefaultChannels();
			} else if (text.search(/^(\.join #)/gi) == 0) {
				var channel = text.slice(6);
				bot.join(channel);
			}
			break;

		// part
		case (text.search(/^(\.part)/gi) === 0 && message.host === config.handlerHostname):
			var channel;
			if (text == '\.part') {
				channel = message.args[0];
			} else if (text.search(/^(\.part #)/gi === 0)) {
				channel = text.slice(6).trim();
			}
			bot.part(channel);
			break;

		// .say #channel-name message
		case (text.search(/(\.)(say)( )(#)/gi) === 0 && message.host === config.handlerHostname):
			var channel = text.split(' ')[1].trim();
			console.log(channel);
			var orcamessage = text.slice(text.split(' ')[1].length + 6);
			console.log(orcamessage);
			bot.say(channel, orcamessage);
			break;

		// help
		case (text === '\.help' || text.search(/^(\.help )/g) === 0):
			help(from, to, text, message);
			break;

		// google custom search engine (cse)
		case (text.search(/^(\.g )/gi) === 0):
			googlesearch(from, to, text, message);
			break;

		// url shortener
		case (text.search(/^(\.url )/gi) === 0):
			shortenurl(from, to, text, message);
			break;

		// translator
		case (text.search(/^(\.)(tr)( )/gi) === 0):
			textTranslate(from, to, text, message);
			break;

		// twitter
		case (text.search(/^(\.tw )/gi) === 0):
			getTwitterStatus(from, to, text, message);
			break;

		// instagram
		case (text.search(/^(\.ig )/gi) === 0):
			instagramquery(from, to, text, message);
			break;

		// youtube
		case (text.search(/^(\.yt )/gi) === 0 && text !== '.yt '):
			searchYouTube(from, to, text, message);
			break;


		// begin last.fm
		// .similar
		case (text.search(/^(\.similar )/gi) === 0):
			similarartists(from, to, text, message);
			break;

		// .addlastfm <last.fm username>
		case (text.search(/^(\.addlastfm )/gi) === 0):
			addtodb(from, to, text, message);
			break;

		// now playing .np <self/user/registered handle>
		case (text.search(/^(\.np)/gi) === 0):
			lastfmnowplaying(from, to, text, message);
			break;

		// weekly charts .charts <self/user/registered handle>
		case (text.search(/^(\.charts)/gi) === 0):
			getweeklycharts(from, to, text, message);
			break;

		// get artist info <is truncated at ~440 characters
		case (text.search(/^(\.getinfo )/gi) === 0):
			getartistinfo(from, to, text, message);
			break;

		// end last.fm

		// bobby
		case (text.search(/^(\.bobby)/gi) === 0):
			bot.say(to, 'http://aegyo.me/BOBBY');
			break;

		// default
		default:
			break;
	}
});