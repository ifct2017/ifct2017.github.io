const fs = require('fs');
const os = require('os');

var code = fs.readFileSync('entities/columns-code.csv', 'utf8');
var lines = code.split(os.EOL), map = new Map();
for(var line of lines) {
  var wrds = line.split('","');
  var key = wrds.shift().substring(1);
  map.set(key, '"'+wrds.join('","'));
}
var name = fs.readFileSync('entities/columns-name.csv', 'utf8');
var lines = name.split(os.EOL), z = '';
for(var line of lines) {
  var wrds = line.split('","');
  if(wrds.length<2) continue;
  var name = wrds[0].substring(1), key = wrds[1].substring(0, wrds[1].length);
  z += `"${name}",${map.get(key)}${os.EOL}`;
}
fs.writeFileSync('out.txt', z);
