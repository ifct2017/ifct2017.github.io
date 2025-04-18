var ANNOTATION_CLR = ['rgba(200,255,200,0.5)', 'rgba(255,200,200,0.5)'];
var Table = null;
var Chart = null;
var rows = null;




// Destroy table.
function tableDestroy() {
  if(Table==null) return;
  Table.destroy();
  $('#table').empty();
  Table = null;
};

// Get table columns.
function tableColumns(rows) {
  var z = [{class: 'details-control', orderable: false, data: null, defaultContent: ''}];
  z.push({title: columnName('name'), data: {_: 'name_t', sort: 'name'}});
  for(var k in rows[0]||{}) {
    if(k.endsWith('_e') || k.endsWith('_t') || COLUMNS_TXT.has(k)) continue;
    var ks = k.replace(/\W/g, '_');
    z.push({title: columnName(k), data: {_: ks+'_t', sort: ks}});
  }
  return z;
};

// Get table rows.
function tableRows(rows) {
  // rows = rowsWithText(rows);
  for(var r of rows)
    r.name_t = '<a href="/data/compositions?code='+r.code+'">'+r.name_t+'</a>';;
  return rows;
};

// Get table child row.
function tableChild(r) {
  var z = document.getElementById('table_child').innerHTML;
  z = z.replace('${code}', r.code);
  z = z.replace('${picture}', 'src="'+pictureUrl(r.code)+'"');
  z = z.replace('${name}', r.name);
  z = z.replace('${scie}', r.scie);
  z = z.replace('${grup}', r.grup);
  z = z.replace('${lang}', langValues(r.lang));
  z = z.replace('${quantities}', '');
  return z;
};

// Hide all child rows.
function tableChildHideAll() {
  Table.rows().eq(0).each(function(i) {
    var row = Table.row(i);
    if(row.child.isShown()) row.child.remove();
  });
};

// Expand child row.
function tableChildToggle() {
  var tr = $(this).closest('tr');
  var row = Table.row(tr);
  var idx = $.inArray(tr.attr('id'), Table.children);
  if(row.child.isShown()) {
    tr.removeClass('details');
    row.child.hide();
    Table.children.splice(idx, 1);
  }
  else {
    tr.addClass('details');
    row.child(tableChild(row.data())).show();
    if(idx===-1) Table.children.push(tr.attr('id'));
  }
};

// Draw table child rows.
function tableChildDraw() {
  for(var id of Table.children||[])
    $('#'+id+' td.details-control').trigger('click');
};

// Draw table.
function tableDraw(rows) {
  tableDestroy();
  if(rows.length===0) return;
  var cols = tableColumns(rows);
  rows = rowsSimplifyKey(rows);
  var data = tableRows(rows);
  Table = $('#table').DataTable({
    columns: cols, data: data, aaSorting: [], scrollX: true, autoWidth: true,
    retrieve: true, fixedHeader: {header: true, footer: true}
  });
  Table.children = []; Table.on('draw', tableChildDraw);
  $('#table tbody').on('click', 'tr td.details-control', tableChildToggle);
  $('#table_length > label').append($('#table_expandt').html());
  $('#table_expand').click(function() {
    Table.rows(':not(.parent)').nodes().to$().find('td:first-child').trigger('click');
  });
  setTimeout(function() { window.dispatchEvent(new Event('resize')); }, 0);
};




// Destroy chart.
function chartDestroy() {
  if(Chart==null) return;
  Chart.destroy();
  $('#chart').empty();
  Chart = null;
};

// Get chart series for given y axes.
function chartSeries(rows, x, ys) {
  var z = [], colors = Highcharts.getOptions().colors;
  for(var i=0, I=ys.length; i<I; i++) {
    var y = ys[i], rng = rows[0][y+'_e']!=null;
    z.push({name: columnName(y), data: rowsPair(rows, x, y), zIndex: 2*i+1, _code: y,
      marker: {fillColor: 'white', lineWidth: 2, lineColor: colors[i]}, _type: columnType(y)
    });
    if(rng) z.push({name: 'Range', data: rowsPairRange(rows, x, y), type: 'arearange', lineWidth: 0,
      linkedTo: ':previous', color: colors[i], fillOpacity: 0.3, zIndex: 2*i, marker: {enabled: false}
    });
  }
  return z;
};

// Get chart title.
function chartTitle(cod) {
  var z = '';
  for(var k of cod)
    z += columnName(k)+', ';
  if(!z.length) return null;
  z = z.substring(0, z.length-2);
  z += ' per 100g';
  return z;
};

// Get chart subtitle.
function chartSubtitle(cod) {
  if(cod.size!==1) return null;
  var m = METHODS.get(setFirst(cod));
  if(m==null) return null;
  return m.method+'; '+m.reference;
};

// Get intake annotations.
function chartAnnotations(cod, siz) {
  var z = [], intake = INTAKES.get(cod);
  if(intake==null) return z;
  for(var i=0; i<2; i++) {
    var labels = [], shapes = [];
    var keys = i===0? INTAKES_REC:INTAKES_UL;
    for(var k of keys) {
      if(intake[k]==null) continue;
      var v = (intake[k]<0? -70:1)*intake[k];
      labels.push({point: {xAxis: 0, yAxis: 0, x: siz-1, y: v}, text: INTAKES_NAM.get(k)});
      shapes.push({type: 'path', points: [{xAxis: 0, yAxis: 0, x: 0, y: v},
        {xAxis: 0, yAxis: 0, x: siz-1, y: v}]});
    }
    if(labels.length>0) z.push({id: i, labels: labels, shapes: shapes,
      labelOptions: {backgroundColor: ANNOTATION_CLR[i], y: 5, borderColor: 'none'}});
  }
  return z;
};

// Update chart annotations.
function chartAnnotationsUpdate(cht, cods) {
  for(var i=0, I=(cht.annotations||[]).length; i<I; i++)
    cht.removeAnnotation(i);
  if(cods.size!==1 || !cht.rows) return;
  for(var a of chartAnnotations(setFirst(cods), cht.rows.length))
    cht.addAnnotation(a);
};

// Handle chart legend click.
function chartLegend() {
  this.yAxis.userOptions._ready = false;
};

// Get representation for chart axis.
function chartRepresentation(axis) {
  var series = axis.series;
  var types = new Set(), codes = new Set();
  for(var s of series) {
    if(!s.visible || s.name==='Range') continue;
    types.add(s.userOptions._type);
    codes.add(s.userOptions._code);
  }
  var type = types.size===1? setFirst(types):null;
  var factor = quantityFactor(type, axis.max);
  var unit = quantityUnit(type, factor);
  Object.assign(axis.userOptions, {_codes: codes, _type: type, _factor: factor, _unit: unit});
  return {type: type, factor: factor, unit: unit, codes: codes};
};

// Format chart yaxis.
function chartYaxis() {
  var o = this.axis.userOptions;
  if(!o._ready) {
    chartRepresentation(this.axis); o._ready = true;
    this.chart.setTitle({text: chartTitle(o._codes)});
    this.chart.setSubtitle({text: chartSubtitle(o._codes)});
    chartAnnotationsUpdate(this.chart, o._codes);
  }
  var type = o._type, factor = o._factor, unit = o._unit;
  return type? round(this.value*factor)+unit:this.value;
};

// Get quantites for chart tooltip.
function chartQuantities(pts) {
  var z = '';
  for(var i=0, I=pts.length; i<I; i++) {
    var p = pts[i], pn = pts[i+1];
    if(p.colorIndex==null) continue;
    var rng = pn && pn.colorIndex==null;
    var cod = p.series.userOptions._code;
    var f = columnFactor(cod), u = columnUnit(cod);
    z += '<tr><th>'+p.series.name+'</th>';
    z += '<td>'+round(p.y*f)+(u||'');
    if(rng) z += ' ('+round(pn.point.high*f)+' - '+round(pn.point.low*f)+')';
    z += '</td></tr>\n';
  }
  return z;
};

// Format chart tooltip.
function chartTooltip() {
  var r = Chart.rows[this.x];
  var fmt = document.getElementById('chart-tooltip').innerHTML;
  var z = fmt.replace('${picture}', 'src="'+pictureUrl(r.code)+'"');
  z = z.replace('${name}', r.name);
  z = z.replace('${scie}', r.scie? '('+r.scie+')':'');
  z = z.replace('${grup}', r.grup);
  z = z.replace('${quantities}', '<table>'+chartQuantities(this.points)+'</table>');
  return z;
};

// Draw the chart.
function chartDraw(rows, x, ys) {
  chartDestroy();
  var xv = rowsValue(rows, x);
  var series = chartSeries(rows, x, ys);
  var annotations = chartAnnotations(ys.length===1? ys[0]:null, rows.length);
  Chart = Highcharts.chart('chart', {
    chart: {style: {fontFamily: '"Righteous", cursive'}}, title: {text: null}, legend: {},
    xAxis: {labels: {enabled: true, formatter: function() { return xv[Math.round(this.value)]; }}},
    yAxis: {title: {text: null}, labels: {formatter: chartYaxis}}, annotations: annotations,
    tooltip: {crosshairs: true, shared: true, useHTML: true, formatter: chartTooltip},
    series: series, plotOptions: {series: {events: {legendItemClick: chartLegend}}}
  });
  Chart.rows = rows;
};




// Get query results and update chart & table.
function processQuery(txt) {
  console.log('processQuery()', txt);
  ajaxGetJson(SERVER_URL+'/api/english?text='+encodeURIComponent(txt), function(data) {
    console.log('Slang:', data.slang);
    console.log('SQL:', data.sql);
    var rows = data.rows;
    var meta = data.meta;
    if(rows.length===0) return;
    rows = rowsWithText(rows);
    var ys = rowQuantityColumns(rows[0]||{});
    tableDraw(rows, meta);
    if(ys.length>0) chartDraw(rows, 'name', ys);
    saveQuery(txt);
  }, function(e) {
    var err = e.responseJSON;
    console.log('processQuery().fail', err);
    iziToast.error({
      title: err.message,
      message: '<b>SLANG:</b> '+err.slang+'<br><b>SQL:</b> '+err.sql,
      timeout: 20000
    });
  }).fail(function(e) {
    if(!e.responseJSON) iziToast.warning({
      title: 'Server offline',
      message: 'Server will come up in 5s!',
      timeout: 20000
    });
  });
};

// Save query for suggestions.
function saveQuery(txt) {
  ajaxGetJson(SERVER_URL+'/api/query/save?text='+encodeURIComponent(txt), function (data) {
    console.log('Query saved: '+data[0].text+' ['+data[0].score+']');
  });
};

// Handle form submit.
function onSubmit(e) {
  var src = e.target.submitted;
  console.log('onSubmit()', src);
  var txt = document.getElementById('text').value;
  locationPathSet('/data/query?text='+txt);
  return false;
};

// Setup page by location.
function setupLocation() {
  var s = location.search;
  console.log('setupLocation()', s);
  if(s.length===0) return;
  var q = queryParse(s);
  if(!q.text) return;
  var txt = document.getElementById('text');
  txt.value = q.text;
  processQuery(q.text);
};

// Setup page.
function setup() {
  console.log('setup()');
  $('form').submit(onSubmit);
  setupForms();
  setupFooter();
  setupLocation();
  setupAutocomplete();
};
$(document).ready(setup);
