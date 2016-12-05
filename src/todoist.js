// -----------------------------------------------------------------------------
// Todoistに登録
// -----------------------------------------------------------------------------
function createTodoist(evt) {
  var TODOIST_TOKEN = PropertiesService.getScriptProperties().getProperty("TODOIST_TOKEN");

  var dayStart = moment(evt.getStartTime());
  var dayEnd   = moment(evt.getEndTime());
  var url = "https://todoist.com/API/v7/sync";
  var payload = {
    token : TODOIST_TOKEN,
    commands : '[{' +
      '"type":"item_add",' +
      '"uuid":"' +uuid()+ '",' +
      '"temp_id":"' +uuid()+ '",' +
      '"args":{' +
        '"content":"' +dayStart.format("HH:mm")+ '〜' +dayEnd.format("HH:mm")+ '　' +evt.getTitle()+ '",' +
        '"date_string":"' +dayStart.format("YYYY-MM-DD HH:mm")+ '"' +
      '}' +
    '}]'
  }
  var data = post(url, payload);
  var todoistId = data.temp_id_mapping[temp_id];
  return todoistId;
}


// -----------------------------------------------------------------------------
// Todoistの更新
// -----------------------------------------------------------------------------
function updateTodoist(evt, id) {
  var TODOIST_TOKEN = PropertiesService.getScriptProperties().getProperty("TODOIST_TOKEN");

  var dayStart = moment(evt.getStartTime());
  var dayEnd   = moment(evt.getEndTime());
  var url      = "https://todoist.com/API/v7/sync";
  var payload = {
    token : TODOIST_TOKEN,
    commands : '[{' +
      '"type":"item_update",' +
      '"uuid":"' +uuid()+ '",' +
      '"temp_id":"' +uuid()+ '",' +
      '"args":{' +
        '"id":"' +id+ '",' +
        '"content":"' +dayStart.format("HH:mm")+ '〜' +dayEnd.format("HH:mm")+ '　' +evt.getTitle()+ '",' +
        '"date_string":"' +dayStart.format("YYYY-MM-DD HH:mm")+ '"' +
      '}' +
    '}]'
  };
  var data = post(url, payload);
}


// -----------------------------------------------------------------------------
// Todoistから削除
// -----------------------------------------------------------------------------
function deleteTodoist(id) {
  var TODOIST_TOKEN = PropertiesService.getScriptProperties().getProperty("TODOIST_TOKEN");

  var url     = "https://todoist.com/API/v7/sync";
  var payload = {
    token : TODOIST_TOKEN,
    commands : '[{' +
      '"type":"item_delete",' +
      '"uuid":"' +uuid()+ '",' +
      '"temp_id":"' +uuid()+ '",' +
      '"args":{"ids":["' +id+ '"]}' +
    '}]'
  };
  var data = post(url, payload);
}


// -----------------------------------------------------------------------------
// postでデータ取ってくる
// -----------------------------------------------------------------------------
function post(url, payload) {
  var options = {
    method  : 'POST',
    payload : payload
  };
  var response = UrlFetchApp.fetch(url, options);
  return JSON.parse(response.getContentText());
}

// UUIDの生成
function uuid(myStrong) {
 var strong = 1000;
 if (myStrong) strong = myStrong;
 return new Date().getTime().toString(16)
          + Math.floor(strong*Math.random()).toString(16)
}
