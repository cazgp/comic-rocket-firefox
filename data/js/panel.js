var comic_rocket_url;
var old_items;

self.port.on("url", function(url) {
  comic_rocket_url = url;
});

self.port.on("loading", function() {
  document.getElementById('loading').classList.remove('hidden');
});

self.port.on("data", function(data) {
  document.getElementById('loading').classList.add('hidden');
  // If there are no unread comics, the person is a new user, or not logged in
  if(typeof(data) == "string") {
    update_message(get_message(data));
  } else {
    update_items(get_html(data));
  }
});

self.port.on("show", function() {
  var aspectRatio = 7.8;
  var height = $('body').width() * 0.75 / 7.8;
  var titles = $('.item');
  titles.height(height);
  titles.css('line-height', height + 'px');
});

var update_message = function(message) {
  var elem = document.getElementById('message');
  elem.innerHTML = message;
  elem.classList.remove('hidden');
  self.port.emit("resize", {height: 150, width: 'max'});
};

var update_items = function(items) {
  var msg = document.getElementById('message');
  msg.innerHTML = '';
  msg.classList.add('hidden');
  document.getElementById('items').innerHTML = items;
  self.port.emit("resize", {height: 'max', width: 'max'});
}

var get_message = function(message) {
  if(message == 'no-unread') {
    return "You have no unread comics.";
  }
  if(message == 'not-logged-in') {
    return "You are not currently logged into Comic Rocket. Please log in and try again.";
  }
  if(message == 'new-user') {
    return "You are not currently subscribed to any comics.";
  }
};

var get_html = function(items) {
  var entries = ['<ul>'];
  var sorted = Object.keys(items).sort();
  sorted.forEach(function(title) {
    var entry = items[title];
    if(!entry) return;

    entries.push('<li class="item"><a target="_blank" href="' + entry.url + '">');
    if(entry.img) {
      entries.push('<div class="img"><img src="' + comic_rocket_url + '/' + entry.img + '"/></div>');
    } else {
      entries.push('<span class="title">' + title + '</span>');
    }
    entries.push('<span class="progress">' + entry.progress + '</span>');
    entries.push('</a></li>');
  });
  entries.push('</ul>');
  return entries.join('');
};
