var comic_rocket_url;
self.port.on("url", function(url) {
  comic_rocket_url = url;
});

self.port.on("data", function(data) {
  var ul = get_entries(data);
  self.port.emit("unread_loaded");
  var existing = $('#items').html();
  if(existing != data) {
    check_unread(existing, data);
  }
  $('#items').html(ul);
});

self.port.on("show", function() {
  var aspectRatio = 7.8;
  var height = $('body').width() * 0.75 / 7.8;
  var titles = $('.item');
  titles.height(height);
  titles.css('line-height', height + 'px');
  console.log($('body').html());
});

var get_entries = function(data) {
  var items = {};
  $(data).find('.row-fluid h2,.comics-item').each(function(i, item) {
    // The first h2 is irrelevant
    if(i == 0) return;
    // The next h2 delineates no new comics
    if(item.tagName == 'H2') return false;

    var $item = $(item);
    var $a    = $item.find('.comics-item-image');
    var url   = $a.attr('href');
    var title = $a.find('span').text();
    if(!title) return;

    var img   = $a.find('img');
    var progress = $item.find('.progress-label').text();

    items[title] = {};
    if(img.length) items[title].img    = img.attr('src');
    if(title && url) items[title].url  = url;
    if(progress) items[title].progress = progress;
  });

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

var check_unread = function(existing, updating) {
  // Loop through all the new entries
  // Notify which have new entries
  self.port.emit("notify", which);
}

// window.addEventListener('click', function(e) {
  // var t = e.target;
  // console.log(t);
// });

// console.log("jar");
// $.get(url).then(function(response) {
  // console.log(response);
// }, function(error, textStatus, errorThrown) {
  // console.log("ERROR");
  // console.log(textStatus, errorThrown);
// });

// // function getSummary(forecast) {
  // // return forecast.RegionalFcst.FcstPeriods.Period[0].Paragraph[0].$;
// // }
