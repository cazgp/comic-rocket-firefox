var { ToggleButton } = require('sdk/ui/button/toggle');
var panels = require("sdk/panel");
var self = require("sdk/self");
var Request = require("sdk/request").Request;
var notifications = require("sdk/notifications");
var timers = require("sdk/timers");
require("sdk/preferences/service").set("extensions.sdk.console.logLevel", "info");
var comic_rocket = require('./comic-rocket');

var prefs = require('sdk/simple-prefs');
var url   = prefs.prefs['extensions.comicrocket.url'];
var api   = prefs.prefs['extensions.comicrocket.api-base'];
var timeout = prefs.prefs['extensions.comicrocket.timeout'];

// Set some panel widths / heights
var panelMaxWidth = 400;
var panelMaxHeight = 600;
var panelMessageWidth = 400;
var panelMessageHeight = 150;
var refreshOnClick = false;

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
  contentStyleFile: self.data.url("css/panel.css"),
  onHide: function() {
    button.state('window', {checked: false});
  }
});

// Listen to page load for comic rocket and pass on if a comic's being read
require("sdk/tabs").on("ready", function(tab) {
  var matches = tab.url.match(/comic-rocket.com\/read\/([a-z-]+)\/(\d+)\?mark/);
  if(!matches) return;
  var comic = matches[1];
  var number = matches[2];
  panel.port.emit("reading", comic, number);
  let comics = comic_rocket.get_comics();
  comics[comic].idx = number;
});

panel.port.emit("url", url);
panel.on("show", function(){
  panel.port.emit("show");
});
panel.on("hide", function() {
  panel.port.emit("hide");
});

panel.port.on("resize", function(amount) {
  var height = Math.min(amount.height, panelMaxHeight);
  panel.resize(panelMaxWidth, height);
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

var get_unread = function(notfy) {
  panel.port.emit('loading');
  var req = Request({
    url: api + 'marked',
    onComplete: function(response) {
      var comics = response.json;
      var unread = comic_rocket.get_unread(comics);
      panel.port.emit('data', unread);

      var new_entries = comic_rocket.get_new(unread);
      if(notfy && new_entries.length > 0) {
        panel.port.emit('indicateNew', new_entries);
        notify(new_entries.length);
      }

      comic_rocket.set_comics(unread);

      timers.setTimeout(function() {
        get_unread(true);
      }, timeout*60000);
    }
  });
  req.get();
};

get_unread(false);
