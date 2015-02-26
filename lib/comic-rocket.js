var old_comics;

exports.set_comics = function(new_comics) {
  old_comics = {};
  for(let comic of new_comics) {
    old_comics[comic.slug] = comic;
  }
};

exports.get_comics = function() {
  return old_comics;
};

exports.get_new = function(new_comics) {
  if(!old_comics) return [];

  // If something is in the old items, but not the new items we don't care
  // We only care if something is in new items that's not in old items
  var changed_items = [];
  for(let comic of new_comics) {
    let slug = comic.slug;
    let old_comic = old_comics[slug];
    if(!old_comic) {
      changed_items.push(slug);
      continue;
    }

    if(old_comic.idx < comic.idx) {
      changed_items.push(slug);
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
