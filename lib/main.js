var { ToggleButton } = require('sdk/ui/button/toggle');
var panels = require("sdk/panel");
var self = require("sdk/self");
var Request = require("sdk/request").Request;
var notifications = require("sdk/notifications");
require("sdk/preferences/service").set("extensions.sdk.console.logLevel", "info");

var prefs = require('sdk/simple-prefs');
var url   = prefs.prefs['comicRocketUrl'];
var timeout = prefs.prefs['comicRocketTimeout'];

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
      panel.show({
        position: button
      });
    }
  }
});

var panel = panels.Panel({
  width: 400,
  height: 600,
  contentURL: self.data.url("html/panel.html"),
  contentScriptFile: [
    self.data.url("js/jquery-1.11.1.min.js"),
    self.data.url("js/panel.js"),
  ],
  contentStyleFile: self.data.url("css/panel.css"),
  onHide: function() {
    button.state('window', {checked: false});
  }
});

panel.port.emit("url", url);
panel.on("show", function(){
  panel.port.emit("show");
});
panel.port.on("unread_loaded", function(data) {
  setTimeout(get_unread, timeout*60000);
});

// Loop through new entries and create a notification
panel.port.on("notify", function(number_new_entries) {
  notifications.notify({
    title: "Jabberwocky",
    text: "'Twas brillig, and the slithy toves",
    data: "did gyre and gimble in the wabe",
    iconURL: self.data.url("img/icon-32.png"),
    onClick: function (data) {
      console.log(data);
      // console.log(this.data) would produce the same result.
    }
  });
});

var get_unread = function() {
  var req = Request({
    url: url,
    overrideMimeType: "text/plain; charset=latin1",
    onComplete: function (response) {
      panel.port.emit("data", response.text);
    }
  });
  req.get();
}

var comic_rocket = function() {
  setTimeout(get_unread, timeout*60000);
};
comic_rocket();
