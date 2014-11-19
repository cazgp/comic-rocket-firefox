var comic_rocket_url;

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
  var height = (document.documentElement.clientWidth * 0.75 / aspectRatio) + 'px';
  var titles = document.getElementsByClassName('item');
  for(let title of titles) {
    title.style.height = height;
    title.style.lineHeight = height;
  }
});

self.port.on("hide", function() {
  var items = document.getElementsByTagName('li');
  for(let item of items) {
    item.classList.remove("new");
  }
});

self.port.on("indicateNew", function(new_entries) {
  var items = get_elements();
  for(let item of items) {
    var dt = item.getAttribute("data-title");
    for(let t of new_entries) {
      if(dt == t) {
        item.classList.add("new");
        break;
      }
    }
  }
});

// If the user is on the comic rocket website and reading the comics, update plugin's progress
self.port.on("reading", function(comic, number) {
  var items = get_elements();
  for(let item of items) {
    var dt = item.getAttribute("data-title");
    if(dt == comic) {
      var progress = item.getElementsByClassName('progress')[0];
      var text = progress.firstChild.textContent;
      var split = text.split('/');
      split[0] = number;
      progress.firstChild.textContent = split.join('/');

      // Also remove the 'new' class from the item as clearly the user is aware it's new
      item.classList.remove('new');
      break;
    }
  }
});

var get_elements = function*() {
  var items = document.getElementsByTagName('li');
  for(let item of items) {
    yield item;
  }
};

var clear_element = function(elem) {
  while(elem.firstChild) {
    elem.removeChild(elem.firstChild);
  }
};

var update_message = function(message) {
  var elem = document.getElementById('message');
  elem.firstChild.nodeValue = message;
  elem.classList.remove('hidden');
  self.port.emit("resize", {height: 150, width: 'max'});
};

var update_items = function(items) {
  var msg = document.getElementById('message');
  clear_element(msg);
  msg.classList.add('hidden');
  var elem = document.getElementById('items');
  clear_element(elem);
  elem.appendChild(items);
  self.port.emit("resize", {height: 'max', width: 'max'});
};

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
  var entries = document.createElement('ul');
  var sorted = Object.keys(items).sort();
  sorted.forEach(function(title) {
    var entry = items[title];
    if(!entry) return;

    // Create the li to hold the item
    var li = document.createElement('li');
    li.classList.add("item");
    li.setAttribute("data-title", entry.dt);

    // Create the anchor link
    var a = document.createElement('a');
    a.href = entry.url;
    a.target = "_blank";

    var clicker;
    // If there's an image
    if(entry.img) {
      var img = document.createElement('img');
      img.src = comic_rocket_url + '/' + entry.img;

      // Wrap in a div
      clicker = document.createElement('div');
      clicker.classList.add('img');
      clicker.appendChild(img);
    } else {
      clicker = document.createElement('span');
      clicker.classList.add('title');
      clicker.appendChild(document.createTextNode(title));
    }

    var progress = document.createElement('span');
    progress.classList.add('progress');
    progress.appendChild(document.createTextNode(entry.progress));

    a.onclick = function() {
      this.parentElement.classList.remove('new');
    };
    a.appendChild(clicker);
    a.appendChild(progress);
    li.appendChild(a);
    entries.appendChild(li);
  });
  return entries;
};
