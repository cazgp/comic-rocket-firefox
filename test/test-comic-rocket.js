const {Cu} = require("chrome");
const {TextDecoder, OS} = Cu.import("resource://gre/modules/osfile.jsm");
var comic_rocket = require("./comic-rocket");
var comic_rocket_url = "http://comic-rocket.com/read/";

var decoder = new TextDecoder();

exports["test initialise check"] = function(assert) {
  let new_comics = {
    "test": {
      "url": "test",
      "img": "test",
      "progress": "2/3"
    }
  };
  let new_entries = comic_rocket.get_new(new_comics);
  assert.equal(new_entries, 0);
};

exports["test check no new"] = function(assert) {
  let new_comics = {
    "test": {
      "url": "test",
      "img": "test",
      "progress": "2/3"
    }
  };
  comic_rocket.set_comics(new_comics);
  let new_entries = comic_rocket.get_new(new_comics);
  assert.deepEqual(new_entries, []);
};

exports["test check new comic"] = function(assert) {
  let old_comics = {
    "test1": {
      "dt": "test1",
      "url": comic_rocket_url + "test1",
      "progress": "2/3"
    }
  };
  let new_comics = {
    "test2": {
      "dt": "test2",
      "url": comic_rocket_url + "test2",
      "progress": "2/3"
    }
  };
  comic_rocket.set_comics(old_comics);
  let new_entries = comic_rocket.get_new(new_comics);
  assert.deepEqual(["test2"], new_entries);
};

exports["test check new progress"] = function(assert) {
  let old_comics = {
    "test": {
      "dt": "test",
      "url": comic_rocket_url + "test",
      "progress": "2/3"
    }
  };
  let new_comics = {
    "test": {
      "dt": "test",
      "url": comic_rocket_url + "test",
      "progress": "2/5"
    }
  };
  comic_rocket.set_comics(old_comics);
  let new_entries = comic_rocket.get_new(new_comics);
  assert.deepEqual(["test"], new_entries);
};

exports["test check new mix"] = function(assert) {
  let old_comics = {
    "test": {
      "dt": "test",
      "url": comic_rocket_url + "test",
      "progress": "2/3"
    },
    "test1": {
      "dt": "test1",
      "url": comic_rocket_url + "test1",
      "progress": "89/100"
    },
    "test2": {
      "dt": "test2",
      "url": comic_rocket_url + "test2",
      "progress": "1/50"
    }
  };
  let new_comics = {
    "test": {
      "dt": "test",
      "url": comic_rocket_url + "test",
      "progress": "2/5"
    },
    "test1": {
      "dt": "test1",
      "url": comic_rocket_url + "test1",
      "progress": "95/100"
    },
    "test3": {
      "dt": "test3",
      "url": comic_rocket_url + "test3",
      "progress": "1/50"
    }
  };
  comic_rocket.set_comics(old_comics);
  let new_entries = comic_rocket.get_new(new_comics);
  assert.deepEqual(["test", "test3"], new_entries);
};

require("sdk/test").run(exports);
