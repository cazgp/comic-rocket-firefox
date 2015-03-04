/* jshint browser: true, esnext: true */
/* global self,console */
var reading, not_reading;
var itemsShown = true;

self.port.on("loading", function() {
  document.getElementById('loading').classList.remove('hidden');
});

self.port.on("data", function(r, nr) {
  document.getElementById('loading').classList.add('hidden');
  reading = r;
  not_reading = nr;
  toggle_display(false);
});

self.port.on("hide", function() {
  var items = document.getElementsByTagName('li');
  for(let item of items) {
    item.classList.remove("new");
  }
});

self.port.on('indicateNew', function(new_entries) {
  var selectors = new_entries.map(function(title) {
    return 'li[data-title="' + title + '"]';
  });
  var elements = document.querySelectorAll(selectors);
  for(var i = 0; i < elements.length; elements++) {
    elements[i].classList.add('new');
  }
});

// If the user is on the comic rocket website and reading the comics, update plugin's progress
self.port.on('reading', function(comic, number) {
  var element = document.querySelector('li[data-title="' + comic + '"]');
  var progress = element.getElementsByClassName('progress')[0];
  var text = progress.firstChild.textContent;
  var split = text.split('/');
  split[0] = number;

  // If we're at the end of the comic, remove from screen
  if(split[0] == split[1]) {
    element.parentNode.removeChild(element);
    return;
  }

  var url = element.getElementsByTagName('a')[0];
  var num = parseInt(number) + 1;
  var href = url.href.replace(/(\d+)(\?mark)/, num + "$2");
  url.href = href;
  progress.firstChild.textContent = split.join('/');

  // Also remove the 'new' class from the item as clearly the user is aware it's new
  element.classList.remove('new');
});

var resize = function() {
  var header = document.getElementById('header');
  var message = document.getElementById('message');
  var r = document.getElementById('reading');
  var nr = document.getElementById('not-reading');

  var height = header.offsetHeight + 20 +
    Math.max(r.offsetHeight, nr.offsetHeight, message.offsetHeight);

  self.port.emit('resize', {height: height});
};

var clear_element = function(elem) {
  while(elem.firstChild) {
    elem.removeChild(elem.firstChild);
  }
};

var update_message = function(message) {
  var nr = document.getElementById('not-reading');
  var r = document.getElementById('reading');
  nr.classList.add('hidden');
  r.classList.add('hidden');

  var elem = document.getElementById('message');
  elem.textContent = message;
  elem.classList.remove('hidden');
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
  return message;
};

var get_html = function(comics, create_symbol, cb) {
  var entries = document.createElement('ul');
  comics.forEach(function(comic) {
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
    var symbol = create_symbol();
    symbol.onclick = function(event) {
      cb(event, comic.name);
    };

    a.onclick = function() {
      this.parentElement.classList.remove('new');
    };
    a.appendChild(clicker);
    a.appendChild(progress);
    li.appendChild(a);
    li.appendChild(symbol);
    entries.appendChild(li);
  });

  return entries;
};

var menu = document.getElementById('menu');
menu.onclick = function() { toggle_display(true) };

var refresh = document.getElementById('refresh');
refresh.onclick = function() {
  self.port.emit('refresh');
};

var update_display = function(config) {
  // Hide any messaeges
  var msg = document.getElementById('message');
  clear_element(msg);
  msg.classList.add('hidden');

  // Hide the other menu
  var toHide = document.getElementById(config.toHide);
  toHide.classList.add('hidden');

  // Grab the one to show
  var toShow = document.getElementById(config.toShow);
  toShow.classList.remove('hidden');

  var create_symbol = function() {
    // Generate the icon to display next to each comic item.
    // (Eye or cross depending on what screen we're on).
    var symbol = document.createElement('span');
    symbol.classList.add('icon-' + config.icon);

    var link = document.createElement('a');
    link.href = '#';
    link.classList.add(config.symb);
    link.appendChild(symbol);
    return link;
  };

  var html = get_html(config.data, create_symbol, function(event, name) {
    // If we're hiding
    if(config.icon === 'cancel') {
      self.port.emit('hiding-comic', name);
    } else {
      self.port.emit('showing-comic', name);
    }
  });

  clear_element(toShow);
  toShow.appendChild(html);
  resize();
};

// Updates what's on screen and also toggles if wanted.
var toggle_display = function(changeMode) {
  var config;
  // If changeMode is true, we want opposite of itemsShown.
  // Otherwise we want itemsShown.
  var toggler = changeMode ? itemsShown : !itemsShown;

  if(toggler) {
    config = {
      toHide: 'reading',
      toShow: 'not-reading',
      symb: 'show',
      icon: 'eye',
      data: not_reading
    };
  } else {
    config = {
      toHide: 'not-reading',
      toShow: 'reading',
      symb: 'hide',
      icon: 'cancel',
      data: reading
    };
  }

  if(changeMode) {
    itemsShown = !itemsShown;
    menu.classList.toggle('selected');
  }

  if(typeof config.data === 'string') {
    update_message(get_message(config.data));
  } else {
    update_display(config);
  }
  return false;
};
