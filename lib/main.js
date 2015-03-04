var { ToggleButton } = require('sdk/ui/button/toggle');
var panels = require("sdk/panel");
var self = require("sdk/self");
var Request = require("sdk/request").Request;
var notifications = require("sdk/notifications");
var timers = require("sdk/timers");
require("sdk/preferences/service").set("extensions.sdk.console.logLevel", "info");
var comic_rocket = require('./comic-rocket');

var prefs = require('sdk/simple-prefs').prefs;
var extBase = 'extensions.comicrocket.';

// Set some panel widths / heights
var panelMaxWidth = 400;
var panelMaxHeight = 600;
var panelMessageWidth = 400;
var panelMessageHeight = 150;
var refreshOnClick = false;
var hiddenDivider = '|||';

var button = ToggleButton({
  id: "comic-rocket-link",
  label: "Comic Rocket Plugin",
  icon: {
    "16": self.data.url("img/icon-16.png"),
    "32": self.data.url("img/icon-32.png"),
    "64": self.data.url("img/icon-64.png"),
  },
  onChange: function(state) {
    if (state.checked) {
      if(refreshOnClick) {
        get_unread(false);
      }
      panel.show({
        position: button
      });
    }
  }
});

var panel = panels.Panel({
  width: panelMessageWidth,
  height: panelMessageHeight,
  contentURL: self.data.url("html/panel.html"),
  contentScriptFile: [
    self.data.url("js/panel.js"),
  ],
  contentStyleFile: [
    self.data.url("css/panel.css"),
    self.data.url("css/font.css"),
  ],
  onHide: function() {
    button.state('window', {checked: false});
  }
});

var handle_reading = function(matches) {
  var comic = matches[1];
  var number = matches[2];
  panel.port.emit('reading', comic, number);
  var comics = comic_rocket.get_comics();
  comics[comic].idx = number;
};

// Listen to page load for comic rocket and pass on if a comic's being read
require("sdk/tabs").on("ready", function(tab) {
  var matches = tab.url.match(/comic-rocket.com\/read\/([a-z-]+)\/(\d+)\?mark/);
  if(matches) return handle_reading(matches);
});

panel.on("hide", function() {
  panel.port.emit("hide");
});

panel.port.on("resize", function(amount) {
  var height = Math.min(amount.height, panelMaxHeight);
  panel.resize(panelMaxWidth, height);
});

panel.port.on('showing-comic', function(name) {
  var pref_name = extBase + 'hidden';
  var hidden = prefs[pref_name].split(hiddenDivider);
  var idx = hidden.indexOf(name);
  hidden.splice(idx, 1);
  prefs[pref_name] = hidden.join(hiddenDivider);
});

panel.port.on('hiding-comic', function(name) {
  var pref_name = extBase + 'hidden';
  var hidden = prefs[pref_name];
  var new_val = hidden == '' ? name : hiddenDivider + name;
  prefs[pref_name] += new_val;
});

panel.port.on('refresh', function() {
  refresh();
});

// Popup notification
var notify = function(number_new_entries) {
  var s = number_new_entries > 1 ? "s" : "";
  notifications.notify({
    title: "Comic Rocket",
    text: "You have " + number_new_entries + " unread comic" + s + ".",
    iconURL: self.data.url("img/icon-32.png")
  });
};

var timer;
var get_unread = function(notfy) {
  panel.port.emit('loading');
  var req = Request({
    url: prefs[extBase + 'url'] + prefs[extBase + 'api'] + 'marked',
    onComplete: function(response) {
      var comics = response.json;
      var hidden = prefs[extBase + 'hidden'].split(hiddenDivider);

      var unread = comic_rocket.get_unread(comics);
      var reading, not_reading, new_entries;

      if(typeof unread !== 'string') {
        reading = unread
          .filter(function(c) {
            return hidden.indexOf(c.name) < 0;
          });

        not_reading = unread
          .filter(function(c) {
            return hidden.indexOf(c.name) >= 0;
          });
        new_entries = comic_rocket.get_new(unread);
      } else {
        reading = unread;
      }

      if(!not_reading || !not_reading.length) {
        not_reading = 'You are reading all your comics!';
      }

      if(!reading || !reading.length) {
        reading = 'You have hidden all your comics!';
      }

      refreshOnClick = unread == 'not-logged-in';
      panel.port.emit('data', reading, not_reading);

      if(notfy && new_entries && new_entries.length > 0) {
        panel.port.emit('indicateNew', new_entries);
        notify(new_entries.length);
      }

      comic_rocket.set_comics(unread);

      timer = timers.setTimeout(function() {
        get_unread(true);
      }, prefs[extBase + 'timeout']*60000);
    }
  });
  req.get();
};

var refresh = function() {
  timers.clearTimeout(timer);
  get_unread(true);
};

get_unread(false);

require('sdk/simple-prefs').on('', function(name) {
  if(name.match(/timeout/) || name.match(/hidden/)) {
    refresh();
  }
});
