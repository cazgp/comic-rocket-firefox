var { Cc, Ci, Cu } = require('chrome');
var parser = Cc["@mozilla.org/xmlextras/domparser;1"].
             createInstance(Ci.nsIDOMParser);

var old_comics;
exports.parse_entries = function(html) {
  var items = {};
  var changed_items = 0;
  var dom = parser.parseFromString(html, "text/html");

  var comic_items = dom.getElementsByClassName('comics-item');
  if(!comic_items.length) return 'not-logged-in';
  for(let comic_item of comic_items) {
    var prev = comic_item.previousElementSibling;
    if(prev.tagName == 'P' && prev.innerHTML.match(/comics yet/)) return 'new-user';
    if(prev.tagName == 'H2' && prev.innerHTML == 'No New Pages Yet') break;

    var a = comic_item.getElementsByClassName('comics-item-image')[0];
    var url = a.href;
    var title = a.getElementsByTagName('span')[0].innerHTML;
    if(!title) continue;
    var img = a.getElementsByTagName('img')[0];
    if(img) img = img.src;
    var progress = comic_item.getElementsByClassName('progress-label')[0].innerHTML;
    var data_title = get_data_title(url);

    // Populate the items
    items[title] = {
      url: url,
      dt: data_title,
      progress: progress
    };
    if(img) items[title].img = img;
  };
  if(!Object.keys(items).length) return 'no-unread';
  return items;
};

var get_data_title = function(url) {
  return url.match(/read\/([a-z0-9-]+)\//)[1];
};

exports.set_comics = function(new_comics) {
  old_comics = new_comics;
};

exports.get_comics = function() {
  return old_comics;
};

exports.get_new = function(new_comics) {
  if(!old_comics) return [];

  var changed_items = [];

  // If something is in the old items, but not the new items we don't care
  // We only care if something is in new items that's not in old items
  for(let title in new_comics) {
    let new_item = new_comics[title];
    let old_item = old_comics[title];
    let dt = new_item.dt;
    if(!old_item) {
      changed_items.push(dt);
      continue;
    }
    let old_progress = old_item.progress.split('/')[1];
    let new_progress = new_item.progress.split('/')[1];
    if(old_progress < new_progress) {
      changed_items.push(dt);
      continue;
    }
  }

  return changed_items;
};
