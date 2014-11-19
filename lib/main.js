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
});

panel.port.emit("url", url);
panel.on("show", function(){
  panel.port.emit("show");
});
panel.on("hide", function() {
  panel.port.emit("hide");
});

panel.port.on("resize", function(amount) {
  var height = amount.height;
  var width  = amount.width;
  if(height == 'max') height = panelMaxHeight;
  if(width == 'max') width = panelMaxWidth;
  panel.resize(width, height);
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
  panel.port.emit("loading");
  var req = Request({
    url: url,
    overrideMimeType: "text/plain; charset=latin1",
    onComplete: function(response) {
      var comics = comic_rocket.parse_entries(response.text);

      refreshOnClick = comics == 'not-logged-in';
      panel.port.emit("data", comics);
      timers.setTimeout(function() {
        get_unread(true);
      }, timeout*60000);

      var new_entries = comic_rocket.get_new(comics);
      var number_new_entries = new_entries.length;
      if(notfy && number_new_entries > 0) {
        panel.port.emit("indicateNew", new_entries);
        notify(number_new_entries);
      }

      // Finally override old comics with new ones
      comic_rocket.set_comics(comics);
    }
  });
  req.get();
}

get_unread(false);
