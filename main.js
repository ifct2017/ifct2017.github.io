// Global constants.
var SERVER_URL = 'https://ifct2017.deno.dev';
var PICTURES_DEF = 'https://i.imgur.com/PNZBH2d.png';
var PICTURES_URL = 'https://cdn.jsdelivr.net/npm/@ifct2017/pictures/assets/';
var COLUMNS_TXT = new Set(['code', 'name', 'scie', 'lang', 'grup', 'regn', 'tags']);
var COLUMNS = ifct2017.columns, HIERARCHY = ifct2017.hierarchy;
var INTAKES = ifct2017.intakes, METHODS = ifct2017.methods;
var NUTRIENTS = ifct2017.nutrients, REPRESENTATIONS = ifct2017.representations;
var INTAKES_REC = ['whorda', 'usear', 'usrdam', 'usrdaf', 'euprim', 'euprif'];
var INTAKES_UL = ['ulus', 'uleu', 'uljapan'];
var INTAKES_NAM = new Map([
  ['whorda', 'WHO Recommended Dietary Allowance'],
  ['usear', 'US Estimated Average Requirement'],
  ['usrdam', 'US Recommended Dietary Allowance (Male)'],
  ['usrdaf', 'US Recommended Dietary Allowance (Female)'],
  ['euprim', 'EU Population Reference Intake (Male)'],
  ['euprif', 'EU Population Reference Intake (Female)'],
  ['ulus', 'Tolerable intake Upper Level (US)'],
  ['uleu', 'Tolerable intake Upper Level (EU)'],
  ['uljapan', 'Tolerable intake Upper Level (Japan)']
]);
var COLUMNS_NAM = new Map([
  ['abbr', 'Abbreviation'],
  ['desc', 'Description'],
  ['kj', 'kJ'],
  ['kcal', 'kcal']
]);
var UNIT_NAM = new Map([
  [1, 'g'],
  [1e+3, 'mg'],
  [1e+6, 'ug'],
  [1e+9, 'ng']
]);


// Fix floating-point precision problem.
function round(num) {
  return Math.round(num*1e+6)/1e+6;
};

// Get unique values in array.
function arrayUnique(arr) {
  var z = [];
  for(var v of arr)
    if(z.indexOf(v)<0) z.push(v);
  return z;
};

// Get first value in set.
function setFirst(set) {
  for(var v of set)
    return v;
};

// Parse URL query to object.
function queryParse(txt) {
  var z = {}, txt = txt.startsWith('?')? txt.substring(1):txt;
  for(var exp of txt.split('&')) {
    var p = exp.split('=');
    z[decodeURIComponent(p[0])] = decodeURIComponent(p[1]||'');
  }
  return z;
};

// Get location path
function locationPath() {
  return location.pathname+location.search;
};

// Set location path
function locationPathSet(pth) {
  return location.href = location.origin+pth+location.hash;
};

// Get object from form elements.
function formGet(frm) {
  var E = frm.elements, z = {};
  for(var i=0, I=E.length; i<I; i++)
    if(E[i].name) z[E[i].name] = E[i].value;
  return z;
};

// Set form elements from object.
function formSet(frm, val) {
  var e = frm.elements;
  for(var i=0, I=e.length; i<I; i++)
    if(e[i].name && val[e[i].name]) e[i].value = val[e[i].name];
  return frm;
};

// Get column name.
function columnName(k) {
  if(k.indexOf('"')>=0) return k.replace(/\"(.*?)\"/g, function(m, p1) { return columnName(p1); });
  if(COLUMNS.has(k)) return COLUMNS.get(k).name;
  return COLUMNS_NAM.get(k)||k[0].toUpperCase()+k.substring(1);
};

// Get column tags.
function columnTags(k) {
  var z = '', m = null;
  if(k.indexOf('"')<0) return COLUMNS.has(k)? COLUMNS.get(k).tags:k;
  while((m=/\"(.*?)\"/g.exec())!=null)
    z += columnTags(m[1])+' ';
  return z.substring(0, z.length-1);
};

// Get column parents.
function columnParents(k) {
  return HIERARCHY.has(k)? HIERARCHY.get(k).parents:null;
};

// Get column ancestry.
function columnAncestry(k) {
  return HIERARCHY.has(k)? HIERARCHY.get(k).ancestry:null;
};

// Get column children.
function columnChildren(k) {
  return HIERARCHY.has(k)? HIERARCHY.get(k).children:null;
};

// Get column method.
function columnMethod(k) {
  var m = METHODS.get(k);
  if(m==null) return null;
  return m.method+(m.reference? '; '+m.reference:'');
};

// Get column type.
function columnType(k) {
  return REPRESENTATIONS.has(k)? REPRESENTATIONS.get(k).type:null;
};

// Get column factor.
function columnFactor(k) {
  return REPRESENTATIONS.has(k)? REPRESENTATIONS.get(k).factor:1;
};

// Get column unit.
function columnUnit(k) {
  return REPRESENTATIONS.has(k)? REPRESENTATIONS.get(k).unit:null;
};

// Get language values from "lang".
function langValues(txt) {
  txt = txt.replace(/\[.*?\]/g, '').replace(/\s*\.?$/, '');
  txt = txt.replace(/\w+\.\s([\w\',\/\(\)\- ]+)[;\.]?/g, '$1, ');
  var arr = txt.split(/,\s*/g);
  if(!arr[arr.length-1]) arr.pop();
  return arrayUnique(arr).join(', ');
};

// Get URL of picture from "code".
function pictureUrl(cod) {
  return cod[0]>='M' && cod[0]<='O'? PICTURES_DEF : PICTURES_URL+cod+'.jpeg';
};

// Get appropriate scaling factor for quantity.
function quantityFactor(typ, val) {
  if(typ!=='mass') return 1;
  var l3 = Math.log(val)/Math.log(1000);
  var e = -3*Math.round(l3-0.33);
  return Math.pow(10, Math.max(e, 0));
};

// Get unit for quantity.
function quantityUnit(typ, fac) {
  if(typ!=='mass') return 'kJ';
  return UNIT_NAM.get(fac);
};

// Get quantity columns in a row.
function rowQuantityColumns(row) {
  var z = [];
  for(var k in row) {
    if(k.endsWith('_e') || k.endsWith('_t')) continue;
    if(!COLUMNS_TXT.has(k)) z.push(k);
  }
  return z;
};

// Get value from rows.
function rowsValue(rows, x) {
  var z = [];
  for(var r of rows)
    z.push(r[x]);
  return z;
};

// Get x, y pairs from rows.
function rowsPair(rows, x, y) {
  var z = [];
  for(var r of rows)
    z.push([r[x], r[y]]);
  return z;
};

// Get x, y0, y1 pair ranges of rows.
function rowsPairRange(rows, x, y) {
  var z = [], ye = y+'_e';
  for(var r of rows)
    z.push([r[x], r[y]-(r[ye]||0), r[y]+(r[ye]||0)]);
  return z;
};

// Simplify keys of rows.
function rowsSimplifyKey(rows) {
  var z = [];
  for(var row of rows) {
    var zr = {};
    for(var k in row)
      zr[k.replace(/\W/g, '_')] = row[k];
    z.push(zr);
  }
  return z;
};

// Get scaled rows with text (_t).
function rowsWithText(rows) {
  var z = [], I = rows.length;
  for(var r of rows)
    z.push(Object.assign({}, r));
  for(var k in rows[0]||{}) {
    if(k.endsWith('_e')) continue;
    var u = columnUnit(k);
    var f = columnFactor(k);
    var ke = k+'_e', kt = k+'_t';
    for(var i=0; i<I; i++) {
      var rv = rows[i][k];
      var re = rows[i][ke]||0;
      if(u==null) z[i][kt] = rv;
      else z[i][kt] = round(rv*f)+u+' ± '+round(re*f);
    }
  }
  return z;
};




// Get JSON request with retries.
function ajaxGetJson(url, fres, frej, ret, del) {
  var ret = ret||4, del = del||1000;
  return $.getJSON(url, fres).fail(function(e) {
    if(!ret || e.responseJSON) return frej(e);
    setTimeout(function() { ajaxGetJson(url, fres, frej. ret-1, del*2); }, del);
  });
};




// Enable form multi submit
function setupForms() {
  console.log('setupForms()');
  var e = document.querySelectorAll('form [type=submit]');
  for(var i=0, I=e.length; i<I; i++)
    e[i].onclick = function() { this.form.submitted = this.name; };
};

// Make page footer sticky.
function setupFooter() {
  console.log('setupFooter()');
  var e = document.querySelector('footer');
  if(e.offsetTop+e.offsetHeight<innerHeight)
  { e.style.bottom = '0'; e.style.position = 'absolute'; }
  e.style.display = 'block';
};

// For triggering with empty autocomplete.
function triggerKeyup() {
  if ($(this).text()) return;
  $(this).triggerHandler(jQuery.Event('keyup', {keyCode: 65, which: 65}));
};

// Get suggestions.
function setupAutocomplete(en=false) {
  console.log('setupAutocomplete()');
  $('#text').easyAutocomplete({
    url: function (txt) { return SERVER_URL+'/api/query/search?text='+encodeURIComponent(txt); },
    getValue: function (row) { return row.text; },
    list: {onClickEvent: function () { $('form').submit(); }}
    // list: {showAnimation: {type: 'fade'}}
  }).click(triggerKeyup).change(triggerKeyup);
  if (en) triggerKeyup.call(document.querySelector('#text'));
};
