#Orcabot
this is a simple node.js IRC bot :whale: :whale2:

##Setup & Installation

###Install [node.js](http://nodejs.org/) and [npm](https://npmjs.org/)

###Clone orcabot

###Install dependencies
```
cd orcabot
npm install
```

###Bot configuration

Rename `channels.example.js` to `channels.js`, rename `opendoors.example.js` to `opendoors.js`, and edit the files accordingly.

###Last.fm database setup

Rename `lastfmdb.example.json` to `lastfmdb.json`. For information on how to store handles and user info in the .JSON, refer to the relevant section [below](https://github.com/emyarod/orcabot#adding-users-to-the-bots-database)

###Twitch stream listener setup

Rename `streams.example.js` to `streams.js`. Edit the file accordingly to find out when your favorite streamers on [Twitch](http://twitch.tv) go online.

###Running the bot

Navigate to the orcabot directory.
```
$ node orcabot
```

##Usage

**Available modules:** Google search, Google URL shortener, Twitter, Instagram, Last.fm

###Google search
```
.g <search term(s)>
```
Returns the top Google search result, as well as a shortlink to the remaining search results.

###Google URL shortener
```
.url <link>
```
Returns a shortened http://goo.gl/ link.

###Twitter
```
.tw <twitter username>
```
Returns the most recent tweet by `<username>`.

###Instagram
```
.ig <instagram username>
```
Returns the most recent photo/video by `<username>`, along with the caption and filter used (if applicable).

###YouTube
```
.yt <query>
```
Return the top search result for <query>, along with relevant video information and a link to more search results.

###Last.fm
####Adding users to the bot's database
```
.addlastfm <last.fm username>
```
`.addlastfm <username>` stores the message sender's hostname and current IRC handle in the bot's database for usage with the `.np` and `.charts` commands. User must be identified/authenticated on the server for this feature to be of any significant usefulness.

####Now playing
```
.np [IRC handle/last.fm username]
```
`.np` (with no other parameters) returns the message sender's currently playing or most recently scrobbled track on Last.fm (user must be in the bot's database for this function to work!).
`.np <username>` returns the currently playing or most recently scrobbled track for `<username>` on Last.fm.

####Weekly charts
```
.charts [IRC handle/last.fm username]
```
`.charts` (with no other parameters) returns the message sender's top five most played artists in the last seven days on Last.fm (user must be in the bot's database for this function to work!).
`.charts <username>` returns the top five most played artists in the last seven days for `<username>` on Last.fm.

####Fetch similar artists
```
.similar <artist>
```
`.similar <artist>` returns a list of similar artists and a percentage value of how closely the artists match, according to Last.fm.

####Translate
```
`.tr <input language>:<output language> <query>`
```
`.tr <input language>:<output language> <query>` returns a translated version of <query> from <input language> to <output language>. For the full list of languages supported, see https://msdn.microsoft.com/en-us/library/hh456380.aspx