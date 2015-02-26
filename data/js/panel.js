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
    new_entries.forEach(function(entry) {
      if(dt == entry) {
        item.classList.add("new");
        return;
      }
    });
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

      // If we're at the end of the comic, remove from screen
      if(split[0] == split[1]) {
        item.parentNode.removeChild(item);
        return;
      }
      var url = item.getElementsByTagName('a')[0];
      var num = parseInt(number) + 1;
      var href = url.href.replace(/(\d+)(\?mark)/, num + "$2");
      url.href = href;
      progress.firstChild.textContent = split.join('/');

      // Also remove the 'new' class from the item as clearly the user is aware it's new
      item.classList.remove('new');
      break;
    }
  }
});

var resize = function() {
  var body = document.body;
  var html = document.documentElement;

  var height = Math.max( body.scrollHeight, body.offsetHeight,
                         html.clientHeight, html.scrollHeight, html.offsetHeight );
  self.port.emit('resize', {height: height});
};

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
  elem.textContent = message;
  elem.classList.remove('hidden');
  resize();
};

var update_items = function(items) {
  var msg = document.getElementById('message');
  clear_element(msg);
  msg.classList.add('hidden');
  var elem = document.getElementById('items');
  clear_element(elem);
  elem.appendChild(items);
  resize();
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

var get_html = function(comics) {
  var entries = document.createElement('ul');
  for(var comic of comics) {
    // Create the li to hold the item
    var li = document.createElement('li');
    li.classList.add('item');
    li.setAttribute("data-title", comic.slug);

    // Create the anchor link
    var a = document.createElement('a');
    a.href = 'http://comic-rocket.com/read/' + comic.slug + '/' + (comic.idx + 1) + '?mark';
    a.target = "_blank";

    var clicker;

    // If there's an image
    if(comic.banner_url) {
      var img = document.createElement('img');
      img.src = comic.banner_url;

      // Wrap in a div
      clicker = document.createElement('div');
      clicker.classList.add('img');
      clicker.appendChild(img);
    } else {
      clicker = document.createElement('span');
      clicker.classList.add('title');
      clicker.appendChild(document.createTextNode(comic.name));
    }

    var progress = document.createElement('span');
    progress.classList.add('progress');
    progress.appendChild(document.createTextNode(comic.idx + '/' + comic.max_idx));

    a.onclick = function() {
      this.parentElement.classList.remove('new');
    };
    a.appendChild(clicker);
    a.appendChild(progress);
    li.appendChild(a);
    entries.appendChild(li);
  }

  return entries;
};
