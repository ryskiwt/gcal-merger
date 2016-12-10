// -----------------------------------------------------------------------------
// main関数
// -----------------------------------------------------------------------------
function main(dayStart, dayEnd){
  // 設定の取得
  var sp = PropertiesService.getScriptProperties();
  var fromCal_ids = sp.getProperty('FROM_CALIDs').split(';',-1);
  var toCal_id    = sp.getProperty('TO_CALID');

  // 転記先カレンダーの取得
  var toCal    = CalendarApp.getCalendarById(toCal_id);
  var toEvts   = toCal.getEvents(dayStart.toDate(), dayEnd.toDate());
  var toEvtIds = toEvts.map(function(evt) {
    return evt.getTag('EVENT_ID');
    // return getRecurringEvtId(evt, evt.getTag('EVENT_ID'));
    // TODO: 繰り返しイベントの取扱いが適当な点を要修正
  });
  var toEvtLastUpdateds = toEvts.map(function(evt) {
    return moment(evt.getTag('LAST_UPDATED'));
  });

  // カレンダーごとにループ
  var fromEvtIdsAll = [];
  var numAdded   = 0;
  var numChanged = 0;
  fromCal_ids.forEach(function(fromCal_id) {
    // 転記元カレンダーの取得
    var fromCal  = CalendarApp.getCalendarById(fromCal_id);
    var fromEvts = fromCal.getEvents(dayStart.toDate(), dayEnd.toDate());
    numAdded   += addEvents(fromCal, toCal, fromEvts, toEvts, toEvtIds);
    numChanged += changeEvents(fromCal, fromEvts, toEvts, toEvtIds);

    // EventIDを保持しておく（後続の削除処理で使用）
    Array.prototype.push.apply(
      fromEvtIdsAll,
      fromEvts.map(function(evt){ return getRecurringEvtId(evt, evt.getId()) })
    );
  });

  var numDeleted = deleteEvents(toEvts, fromEvtIdsAll);

  return {
    numAdded:   numAdded,
    numChanged: numChanged,
    numDeleted: numDeleted,
  };
}


// -----------------------------------------------------------------------------
// 繰り返しイベント用のID生成
// -----------------------------------------------------------------------------
// TODO: 繰り返しイベントの取扱いが適当な点を要修正
function getRecurringEvtId(evt, evtId) {
  if (evt.isRecurringEvent()) {
    evtId += moment(evt.getStartTime()).format('YYYY-MM-DD');
  }
  return evtId;
}


// -----------------------------------------------------------------------------
// 追加処理（転記先にないイベント）
// -----------------------------------------------------------------------------
function addEvents(fromCal, toCal, fromEvts, toEvts, toEvtIds) {
  // １．追加対象取得
  var evtsToAdd   = fromEvts.filter(function(fromEvt) {
    var fromEvtId = getRecurringEvtId(fromEvt, fromEvt.getId());
    return toEvtIds.indexOf(fromEvtId) == -1;
  });

  // ２．追加処理
  evtsToAdd.forEach(function(fromEvt) {
    // イベント作成、Todoistタスク作成
    var createdEvt = createEvent(fromCal, toCal, fromEvt);
    var todoistId  = createTodoist(createdEvt);

    // カスタムタグ設定
    var fromEvtLastUpdated = moment(fromEvt.getLastUpdated());
    createdEvt.setTag('LAST_UPDATED', fromEvtLastUpdated.format());
    createdEvt.setTag('TODOIST_ID',   todoistId);
    createdEvt.setTag('EVENT_ID',     getRecurringEvtId(fromEvt, fromEvt.getId()));
    // createdEvt.setTag('EVENT_ID', fromEvt.getId());
    // TODO: 繰り返しイベントの取扱いが適当な点を要修正
  });

  // ３．追加件数
  return evtsToAdd.length;
}


// -----------------------------------------------------------------------------
// 変更処理（転記先にあり、変更されているイベント）
// -----------------------------------------------------------------------------
function changeEvents(fromCal, fromEvts, toEvts, toEvtIds) {
  // １．変更対象取得
  var evtsToChange = fromEvts.filter(function(fromEvt) {
    var fromEvtId = getRecurringEvtId(fromEvt, fromEvt.getId());
    var index     = toEvtIds.indexOf(fromEvtId);

    // 転記先にないなら対象外（false）
    if (index == -1) return false;
    var toEvt = toEvts[index];

    // 繰り返しイベントでない場合、
    // 更新時刻で比較して、更新されていれば対象（true）
    if (!fromEvt.isRecurringEvent()) {
      var toEvtLastUpdated = moment(toEvt.getTag('LAST_UPDATED'));
      var fromEvtLastUpdated = moment(fromEvt.getLastUpdated());
      return fromEvtLastUpdated.diff(toEvtLastUpdated, 'seconds') > 0;
    }

    // 繰り返しイベントの場合、
    // 終日かどうかが変更されていれば対象（true）
    if (fromEvt.isAllDayEvent() != toEvt.isAllDayEvent()) {
      return true;
    }

    // 終日かどうか一致している場合、文字列結合で比較する
    var fromString = fromEvt.getTitle() + ' [' +fromCal.getName()+ ']' +
      fromEvt.getStartTime() +
      fromEvt.getLocation() + fromEvt.getDescription();
    var toString = toEvt.getTitle() +
      toEvt.getStartTime() +
      toEvt.getLocation() + toEvt.getDescription();

    // 終日イベントでない場合は終了時刻も結合する
    if (!fromEvt.isAllDayEvent()) {
      fromString += fromEvt.getEndTime();
      toString += toEvt.getEndTime();
    }

    // 結合した文字列が変更されていれば対象(true)
    return fromString != toString;
  });

  // ２．更新処理
  evtsToChange.forEach(function(fromEvt) {
    // イベント内容更新
    var fromEvtId = getRecurringEvtId(fromEvt, fromEvt.getId());
    var index = toEvtIds.indexOf(fromEvtId);
    var toEvt = toEvts[index];
    toEvt.setTime(fromEvt.getStartTime(), fromEvt.getEndTime());
    toEvt.setDescription(fromEvt.getDescription());
    toEvt.setLocation(fromEvt.getLocation());
    var fromEvtLastUpdated = moment(fromEvt.getLastUpdated());
    toEvt.setTag('LAST_UPDATED', fromEvtLastUpdated.format());

    // Todoistタスクを更新
    var todoistId = toEvt.getTag('TODOIST_ID');
    updateTodoist(toEvt, todoistId);
  });

  // ３．変更件数取得
  return evtsToChange.length;
}


// -----------------------------------------------------------------------------
// 削除処理（転記元にないイベント）
// -----------------------------------------------------------------------------
function deleteEvents(toEvts, fromEvtIds) {
  // １．削除対象取得
  var evtsToDelete = toEvts.filter(function(toEvt) {
    var toEvtId = toEvt.getTag('EVENT_ID');
    return fromEvtIds.indexOf(toEvtId) == -1;
  })

  // ２．削除処理
  evtsToDelete.forEach(function(toEvt) {
    toEvt.deleteEvent();
    deleteTodoist(toEvt.getTag('TODOIST_ID'));
  });

  // ３．削除件数
  return evtsToDelete.length;
}


// -----------------------------------------------------------------------------
// イベントの作成
// -----------------------------------------------------------------------------
function createEvent(fromCal, toCal, evt) {
  // タイトルを変換
  var title = evt.getTitle() + ' [' +fromCal.getName()+ ']';
  // イベント新規作成
  var createdEvt = (evt.isAllDayEvent())
    ? toCal.createAllDayEvent( // 終日イベント
      title, evt.getStartTime(),
      {description: evt.getDescription(),
       location: evt.getLocation()})
    : toCal.createEvent( //  Not 終日イベント
      title, evt.getStartTime(), evt.getEndTime(),
      {description: evt.getDescription(),
       location: evt.getLocation()});
  return createdEvt;
}
