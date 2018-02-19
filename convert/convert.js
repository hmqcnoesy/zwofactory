var fs = require('fs');
var path = require('path');
var DOMParser = require('xmldom').DOMParser;

var filedata = fs.readFileSync(path.join(__dirname, '/../js/zwofactory.js'), 'utf8');

eval(filedata);
var xml = fs.readFileSync(process.argv[2], 'utf8');
var workout = new Workout();
workout.loadFromXml(xml);
for(var i = 0; i < workout.segments.length; i++) {
    delete workout.segments[i].id;
}
console.log(JSON.stringify(workout));
