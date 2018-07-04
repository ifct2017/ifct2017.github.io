var SERVER_URL = 'https://ifct2017bot.glitch.me';
var PICTURES_DEF = 'https://i.imgur.com/PNZBH2d.png';
var PICTURES_URL = 'https://unpkg.com/@ifct2017/pictures@0.2.0/';
var EXCLUDE_DEF = new Set(['code', 'name', 'scie', 'lang', 'grup', 'regn', 'tags']);
var CHECKBOX_FMT = '&nbsp;&nbsp;<input type="checkbox" id="datatable_details" name="details" checked><label for="datatable_details">DETAILS</label>';

var datatable = null;
var highcharts = null;


function rowLang(txt) {
  txt = txt.replace(/\[.*?\]/g, '');
  txt = txt.replace(/\w+\.\s([\w\',\/\(\)\- ]+)[;\.]?/g, '$1, ');
  return Array.from(new Set(txt.split(', '))).join(', ');
};
function pictureUrl(cod) {
  return (cod[0]>='M' && cod[0]<='O') || cod[0]>='T'? PICTURES_DEF : PICTURES_URL+cod+'.jpeg';
};

function round(num) {
  return Math.round(num*1e+12)/1e+12;
};
function applyFactor(rows, k, fac) {
  var mul = 10**fac;
  for(var row of rows)
    row[k] = round(row[k]*mul);
};
function applyMeta(rows, meta) {
  var row = rows[0];
  if(row==null) return;
  for(var k in row) {
    var tk = k.replace(/_e$/, '');
    if(typeof row[k]==='string') continue;
    applyFactor(rows, k, meta[tk].factor);
  }
};
function tableColumns(rows, meta) {
  var cols = [{title: meta['name'].name, data: {_: 'name_t', sort: 'name'}}];
  for(var k in rows[0]) {
    if(k.endsWith('_e') || EXCLUDE_DEF.has(k)) continue;
    cols.push({title: meta[k].name, data: {_: k+'_t', sort: k}});
  }
  return cols;
};
function tableRows(rows, meta) {
  for(var row of rows) {
    for(var k in row) {
      if(k.endsWith('_e') || EXCLUDE_DEF.has(k)) continue;
      var v = row[k].toString(), ke = k+'_e';
      if(row[ke]) v += '±'+row[ke];
      if(meta[k].unit) v += ' '+meta[k].unit;
      row[k+'_t'] = v;
    }
    row['name_t'] = '<a target="_blank" href="/data/compositions?code='+row.code+'">'+
      '<img src="'+pictureUrl(row.code)+'" width="307"><br>'+
      row.name+(row.scie? ' <small>('+row.scie+')</small><br>':'')+
      '<div style="font-size: 1rem; width: 307px;">'+rowLang(row.lang)+'</div></a>';
  }
  return rows;
};
function cleanTable() {
  if(datatable==null) return;
  datatable.destroy();
  $('#datatable').empty();
  datatable = null;
};
function drawTable(rows, meta) {
  cleanTable();
  if(rows.length===0) return;
  var keys = Object.keys(rows[0]);
  var cols = tableColumns(rows, meta);
  var data = tableRows(rows, meta);
  datatable = $('#datatable').DataTable({
    columns: cols, data: data, aaSorting: [], scrollX: true, autoWidth: true,
    retrieve: true, fixedHeader: {header: true, footer: true}
  });
  $('#datatable_length > label').append(CHECKBOX_FMT);
  $('#datatable_details').click(function() {
    console.log('hello');
    if($(this).is(':checked')) $('html').removeClass('no-details');
    else $('html').addClass('no-details');
  });
  $('#datatable_wrapper thead').on('click', 'th', function () {
    var i = datatable.column(this).index();
    if(i>0) drawChart(rows, meta, keys[1], cols[i].data.sort);
  });
  setTimeout(function() { window.dispatchEvent(new Event('resize')); }, 0);
};

function chartValue(rows, x, y) {
  var data = [];
  for(var row of rows)
    data.push([row[x], row[y]]);
  return data;
};
function chartRange(rows, x, y) {
  var data = [], ye = y+'_e';
  if(rows[0][ye]==null) return null;
  for(var row of rows)
    data.push([row[x], round(row[y]-row[ye]), round(row[y]+row[ye])]);
  return data;
};
function cleanChart() {
  if(highcharts==null) return;
  highcharts.destroy();
  $('#highcharts').empty();
  highcharts = null;
};
function drawChart(rows, meta, x, y) {
  cleanChart();
  var metay = meta[y];
  var label = '{value}'+(metay.unit||'');
  var value = chartValue(rows, x, y);
  var range = chartRange(rows, x, y);
  console.log(range);
  highcharts = Highcharts.chart('highcharts', {
    chart: {style: {fontFamily: '\'Righteous\', cursive'}},
    title: {text: metay.name},
    xAxis: {labels: {enabled: true, formatter: function() { return value[Math.round(this.value)][0]; }}},
    yAxis: {title: {text: null}, labels: {format: label}},
    tooltip: {crosshairs: true, shared: true, valueSuffix: metay.unit},
    legend: {},
    series: [{
      name: metay.name, data: value, zIndex: 1,
      marker: {fillColor: 'white', lineWidth: 2, lineColor: Highcharts.getOptions().colors[0]}
    }, {
      name: 'Range', data: range, type: 'arearange', lineWidth: 0, linkedTo: ':previous',
      color: Highcharts.getOptions().colors[0], fillOpacity: 0.3, zIndex: 0, marker: {enabled: false}
    }]
  });
};

function onSubmit() {
  var txt = $('#search').val();
  $('#logo').addClass('active');
  $.getJSON(SERVER_URL+'/fn/english/'+txt, function(data) {
    $('#logo').removeClass('active');
    console.log('ENGLISH:', txt);
    $('html').attr('class', 'search');
    var rows = data.rows, meta = data.meta;
    if(rows.length===0) return;
    var keys = Object.keys(rows[0]||{});
    applyMeta(rows, meta);
    drawTable(rows, meta);
    if(keys.length>=6) drawChart(rows, meta, keys[1], keys[5]);
    console.log('SLANG:', data.slang);
  }).fail(function(e) {
    var err = e.responseJSON;
    $('#logo').removeClass('active');
    iziToast.error({
      title: err.message,
      message: '<b>SLANG:</b> '+err.slang+'<br><b>SQL:</b> '+err.sql,
      timeout: 20000
    });
  });
  return false;
};
function onReady() {
  $('form').submit(onSubmit);
};
$(document).ready(onReady);
