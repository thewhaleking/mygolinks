# My Go Links
Stupid-simple method of using `go {site}` for web shortcuts in Chrome

Think of this like a way of sharing bookmarks across a company/network, that can be easily reached via keywords.


## Installation
Run `server.py` however you see fit. It's a Python-Flask application, 
so you should probably run it through a WSGI, but it's up to you. Something like Gunicorn is ideal.
See [Flask: Deploying To Production](https://flask.palletsprojects.com/en/3.0.x/deploying/) for other options.

Because there's no authentication for this, it is highly recommended that you run this on an internal network 
(including one accessible by VPN, if that fits your use case).

Once it's running and you have a domain name (or IP address) for it, 
you simply need to add a custom search engine to Google Chrome:
1. Go to [Chrome Settings -> Search Engines](chrome://settings/searchEngines)
2. Beside "Site Search", click "Add"
3. Add the following:
    - Search engine: GoLinks
    - Shortcut: go
    - URL: your.domain.or.ip/%s
4. Click "Add"

Now, to start adding go links, type in your url/search bar in Chrome: 'go edit'

On this page, you will be able to add, edit, or delete links

Once you've added a link (e.g. 'fb', 'https://facebook.com/'), you can now just type 'go fb' in your search bar,
and you'll be redirected to the social media platform for the elderly.

Everyone on your network who adds this to their Chrome Settings will now have access to your Go Links,
with the ability to add/edit/remove them. 

## Concerns
Because there's no authentication (intentionally), this is intended for smaller businesses where people can
be reasonably trusted not to intentionally destroy anything. There's no logging (yet).

The links are all contained in single SQLite database file named 'links.db'. This will be automatically created when you
first run this program. You can back this up every so often, if you wish. 

## Something's not working
Open a [GitHub issue](https://github.com/thewhaleking/mygolinks/issues), and I'll take a look.
