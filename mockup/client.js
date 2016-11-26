$(function() {
  // DatePicker
  $('.date').datetimepicker({ locale: 'ja', format : 'YYYY/MM/DD' });

  // Checkboxの排他処理（toをチェックしたとき）
  $('input[name=chk-to]').click(function() {
    var checked = $(this).prop('checked');
    if (checked) {
      $('input[name=chk-to]').prop('checked', false);
      $(this).parents('tr').find('input[name=chk-from]').prop('checked', false);
    }
    $(this).prop('checked', checked);
  });

  // Checkboxの排他処理（fromをチェックしたとき）
  $('input[name=chk-from]').click(function() {
    var checked = $(this).prop('checked');
    if (checked) {
      $(this).parents('tr').find('input[name=chk-to]').prop('checked', false);
    }
    $(this).prop('checked', checked);
  });

  // Enableにした時、Disabledをはずす
  $('label#btn-enable').click(function() {
    $('form#settings-form').find('input').prop('disabled', false)
    $('form#settings-form').find('label.btn-interval').attr('disabled', false)
    $('input[name=automerge]').attr('checked', false);
    $(this).find('input[name=automerge]').attr('checked', !false);
  });

  // Disableにした時、Desabledをつける
  $('label#btn-disable').click(function() {
    $('form#settings-form').find('input').prop('disabled', true)
    $('form#settings-form').find('label.btn-interval').attr('disabled', true)
    $('input[name=automerge]').attr('checked', true);
    $(this).find('input[name=automerge]').attr('checked', !true);
  });

  // Check Intervalを触った時、Checkedをつけはずしする
  $('label.btn-interval').click(function() {
    $('input[name=interval]').attr('checked', false);
    $(this).find('input[name=interval]').attr('checked', true);
  });
});
