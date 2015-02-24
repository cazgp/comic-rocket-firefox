var old_comics;

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

exports.get_unread = function(comics) {
  if(!comics) {
    return 'not-logged-in';
  }

  if(!comics.length) {
    return 'new-user';
  }

  var unread = [];
  for(var comic of comics) {
    if(comic.idx < comic.max_idx) {
      unread.push(comic);
    }
  }
  if(!unread.length) {
    return 'no-unread';
  }
  return unread;
};
