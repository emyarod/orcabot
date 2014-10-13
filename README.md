#Orcabot
this is a simple node.js IRC bot :whale: :whale2:

##Setup & Installation

###Install [node.js](http://nodejs.org/) and [npm](https://npmjs.org/)

```
git clone https://github.com/joyent/node
cd node
./configure
make
make install
```

###Install dependencies
```
npm install orcabot
```

###Bot configuration

Rename `channel.example.js` to `channel.js`, rename `opendoors.example.js` to `opendoors.js`, and edit the files accordingly.

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
To use:
```
.g <search term(s)>
```
Will return the top Google search result, as well as a shortlink to the remaining search results.

###Google URL shortener
To use:
```
.url <link>
```
Will return a shortened http://goo.gl/ link.

###Twitter
To use:
```
.tw <twitter username>
```
Will return the most recent tweet by `<username>`.

###Instagram
To use:
```
.ig <instagram username>
```
Will return the most recent photo/video by `<username>`, along with the caption and filter used (if applicable).

###Last.fm
####Adding users to the bot's database
To use:
```
.addlastfm <last.fm username>
```
`.addlastfm <username>` stores the message sender's hostname and current IRC handle in the bot's database for usage with the `.np`, `.charts`, and `.compare` commands. User must be identified/authenticated on the server for this feature to be of any significant usefulness.

####Now playing
To use:
```
.np [IRC handle/last.fm username]
```
`.np` (with no other parameters) returns the message sender's currently playing or most recently scrobbled track on Last.fm (user must be in the bot's database for this function to work!).
`.np <username>` returns the currently playing or most recently scrobbled track for `<username>` on Last.fm.

####Weekly charts
To use:
```
.charts [IRC handle/last.fm username]
```
`.charts` (with no other parameters) returns the message sender's top five most played artists in the last seven days on Last.fm (user must be in the bot's database for this function to work!).
`.charts <username>` returns the top five most played artists in the last seven days for `<username>` on Last.fm.

####Compare users using Last.fm "Taste-o-Meter"
To use:
```
.compare <IRC handle/last.fm username>
```
`.compare <username>` calculates your musical compatibility with `<username>` using the Last.fm Taste-o-Meter.
`.compare <username1> <username2>` calculates the musical compatibility between `<username1>` and `<username2>` using the Last.fm Taste-o-Meter.

####Fetch similar artists
To use:
```
.similar <artist>
```
`.similar <artist>` returns a list of similar artists and a percentage value of how closely the artists match, according to Last.fm.