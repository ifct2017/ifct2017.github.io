var TABLE_COL = [{title: 'Nutrient'}, {title: 'Value'}];
var datatable = null;




function drawBuy(txt) {
  var txt = encodeURIComponent(txt.replace(/\W+/g, ' ').trim());
  $('#buy > a').each(function() {
    $(this).attr('href', $(this).attr('href').replace('${name}', txt));
  });
};

function tableRow(row, ccol, crep) {
  var z = [];
  for(var k in row) {
    if(k.endsWith('_e') || COLUMNS_TXT.has(k)) continue;
    var v = row[k].toString(), ke = k+'_e';
    if(row[ke]) v += '±'+row[ke];
    if(crep.get(k).unit) v += ' '+crep.get(k).unit;
    z.push([ccol.get(k).name, v]);
  }
  return z;
};
function drawTable(row, ccol, crep) {
  if(datatable!=null) { datatable.destroy(); $('#composition').empty(); }
  datatable = $('#composition').DataTable({
    columns: TABLE_COL, aaSorting: [], pageLength: 1000,
    // columns: TABLE_COL, data: tableRow(row, ccol, crep), aaSorting: [], pageLength: 25,
  });
  datatable.on('order.dt', function() {
    $('#composition').treetable('expandAll');
  });
  datatable.on('search.dt', function() {
    if(datatable.search()) $('#composition').treetable('expandAll');
    else $('#composition').treetable('collapseAll');
  });
  setTimeout(function() { window.dispatchEvent(new Event('resize')); }, 0);
};

function vtableRow(elm, row, k, p) {
  var col = ifct2017.columns;
  var hie = ifct2017.hierarchy;
  var rep = ifct2017.representations;
  var tr = document.createElement('tr');
  var ke = k+'_e', kt = k+'_t';
  tr.setAttribute('data-tt-id', k);
  if(p) tr.setAttribute('data-tt-parent-id', p);
  var td = document.createElement('td');
  td.setAttribute('tt', columnMethod(k)||'');
  td.setAttribute('data-search', columnName(k)+' '+columnTags(k)||'');
  td.textContent = (col.get(k)||{}).name;
  tr.appendChild(td);
  td = document.createElement('td');
  td.setAttribute('data-order', row[k]);
  td.textContent = row[kt];
  // td.textContent = row[k]+(row[ke]? '±'+row[ke]:'')+((rep.get(k)||{}).unit? ' '+(rep.get(k)||{}).unit:'');
  tr.appendChild(td);
  elm.appendChild(tr);
  var chd = (hie.get(k)||{}).children||'';
  if(!chd) return;
  for(var c of chd.split(' '))
    vtableRow(elm, row, c, k);
};

function vtableLog(row) {
  var hie = ifct2017.hierarchy;
  var frg = document.createDocumentFragment();
  for(var k in row) {
    if(k.endsWith('_e') || k.endsWith('_t') || COLUMNS_TXT.has(k)) continue;
    var pars = (hie.get(k)||{}).parents||'';
    if(!pars) vtableRow(frg, row, k, null);
  }
  var tbd = document.createElement('tbody');
  tbd.appendChild(frg);
  document.querySelector('#composition').appendChild(tbd);
  $('#composition').treetable({expandable: true, clickableNodeNames: true});
};

function onReady() {
  var qry = queryParse(location.search);
  var code = qry.code||'A001';
  $.getJSON(SERVER_URL+'/api/data?table=compositions&code='+code, function(data) {
    var rows = rowsWithText(data), row = rows[0]||{};
    $('#composition_caption').attr('style', '');
    $('#picture').attr('src', pictureUrl(row.code));
    $('#name').html(row.name+(row.scie? ' <small style="font-style: italic;">('+row.scie+')</small>':''));
    $('#grup').text(row.grup);
    $('#lang').text(langValues(row.lang));
    drawBuy(row.name);
    vtableLog(row);
    drawTable(row, ifct2017.columns, ifct2017.representations);
    $('#info').removeAttr('style');
  }); // fail?
};
$(document).ready(onReady);
