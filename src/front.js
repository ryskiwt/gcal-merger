// -----------------------------------------------------------------------------
// Client Pageの返却
// -----------------------------------------------------------------------------
function doGet() {
  // 設定を取得
  var sp = PropertiesService.getScriptProperties();
  var html = HtmlService.createTemplateFromFile('index');
  html.automerge    = sp.getProperty('AUTO_MERGE')      || 'off';
  html.interval     = sp.getProperty('INTERVAL')        || '10';
  html.durBefore    = sp.getProperty('DURATION_BEFORE') || '1';
  html.durAfter     = sp.getProperty('DURATION_AFTER')  || '1';
  html.todoistToken = sp.getProperty('TODOIST_TOKEN')   || '';
  html.toCalId      = sp.getProperty('TO_CALID')        || '';

  var fromCalIdsAll = sp.getProperty('FROM_CALIDs');
  html.fromCalIds = (fromCalIdsAll) ? fromCalIdsAll.split(';',-1) : [];
  html.calendars = [];
  CalendarApp.getAllCalendars().forEach(function(cal) {
    html.calendars.push({ name: cal.getName(), id: cal.getId() });
  });

  // 返却
  var output = html.evaluate().setSandboxMode(HtmlService.SandboxMode.IFRAME);
  output.addMetaTag('viewport', 'width=device-width, initial-scale=1, maximum-scale=1')
  return output;
}


// -----------------------------------------------------------------------------
// APPLY changes ボタン
// -----------------------------------------------------------------------------
function apply(params) {
  // パラメータを設定
  var sp = PropertiesService.getScriptProperties();
  sp.setProperties({
    AUTO_MERGE:      params.automerge,
    INTERVAL:        params.interval,
    DURATION_BEFORE: params.durBefore,
    DURATION_AFTER:  params.durAfter,
    FROM_CALIDs:     params.fromCalIds,
    TO_CALID:        params.toCalId,
    TODOIST_TOKEN:   params.todoistToken,
  });

  // トリガーを削除 -> 追加
  var triggers = ScriptApp.getProjectTriggers();
  triggers.forEach(function(trig) {　ScriptApp.deleteTrigger(trig); });
  if (params.automerge=='on') {
    ScriptApp.newTrigger('cron')
    .timeBased().everyMinutes(params.interval).create();
  }
}


// -----------------------------------------------------------------------------
// MERGE now ボタン
// -----------------------------------------------------------------------------
function merge(dateStart, dateEnd) {
  // 日付の変換
  var DATEFORMAT = 'YYYY/MM/DD'
  var dayStart = moment(dateStart, DATEFORMAT);
  var dayEnd   = moment(dateEnd,   DATEFORMAT).add(1, 'days');

  // main関数に移譲
  return main(dayStart, dayEnd);
}


// -----------------------------------------------------------------------------
// CLEAN merged events ボタン
// -----------------------------------------------------------------------------
function clean(dateStart, dateEnd) {
  // 日付の変換
  var DATEFORMAT = 'YYYY/MM/DD'
  var dayStart = moment(dateStart, DATEFORMAT);
  var dayEnd   = moment(dateEnd,   DATEFORMAT).add(1, 'days');

  // 設定の取得
  var sp = PropertiesService.getScriptProperties();
  var toCal_id = sp.getProperty('TO_CALID');

  // 転記先カレンダーの取得
  var toCal  = CalendarApp.getCalendarById(toCal_id);
  var toEvts = toCal.getEvents(dayStart.toDate(), dayEnd.toDate());

  // イベントの削除
  toEvts.forEach(function(evt) { evt.deleteEvent() });

  // 返却
  return {
    numAdded:   0,
    numChanged: 0,
    numDeleted: toEvts.length,
  };
}


// -----------------------------------------------------------------------------
// 定期実行する関数
// -----------------------------------------------------------------------------
function cron() {
  // 設定の取得
  var sp = PropertiesService.getScriptProperties();
  var durBefore = sp.getProperty('DURATION_BEFORE');
  var durAfter  = sp.getProperty('DURATION_AFTER');
  var dayStart  = moment().subtract(durBefore, 'months');
  var dayEnd    = moment().add(durAfter, 'months');

  // main関数へ移譲
  main(dayStart, dayEnd);
}
