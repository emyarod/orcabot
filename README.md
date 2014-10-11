#Orcabot

this is a simple IRC bot

##Modules

Available modules: Google search, Google URL shortener, Twitter, Instagram, Last.fm

###Google search

To use:

```
.g <username>
```

Will return the top Google search result, as well as a shortlink to the remaining search results.

###Google URL shortener

To use:

```
.url <link>
```

Will return a shortened goo.gl link.

###Twitter

To use:

```
.tw <username>
```

Will return the most recent tweet by `<username>`.

###Instagram

To use:

```
.ig <username>
```

Will return the most recent photo/video by `<username>`, along with the caption and filter used (if applicable).

###Last.fm

####Adding users to the bot's database

To use:

```
.addlastfm <username>
```

`.addlastfm <username>` stores the message sender's hostname and current IRC handle in the bot's database for usage with the `.np`, `.charts`, and `.compare` commands. User must be identified/authenticated on the server for this feature to be of any significant usefulness.

####Now playing

To use:

```
.np <username>
```

`.np` (with no other parameters) returns the message sender's currently playing or most recently scrobbled track on Last.fm (user must be in the bot's database for this function to work!). Entering `.np <username>` returns the currently playing or most recently scrobbled track for `<username>` on Last.fm.

####Weekly charts

To use:

```
.charts <username>
```

`.charts` (with no other parameters) returns the message sender's top five most played artists in the last seven days on Last.fm (user must be in the bot's database for this function to work!). Entering `.charts <username>` returns the top five most played artists in the last seven days for `<username>` on Last.fm.

####Compare users using Last.fm "Taste-o-Meter"

To use:

```
.compare <username>
```

`.compare <username>` calculates your musical compatibility with `<username>` using the Last.fm Taste-o-Meter. `.compare <username1> <username2>` calculates the musical compatibility between `<username1>` and `<username2>` using the Last.fm Taste-o-Meter.

####Fetch similar artists

To use:

```
.similar <username>
```

`.similar <artist>` returns a list of similar artists and a percentage value of how closely the artists match, according to Last.fm.