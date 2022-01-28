var fs = require('fs');
var DOMParser = require('xmldom').DOMParser;

if (process.argv.length != 4) {
    console.log("To convert zwo to erg, pass the .zwo file as the first argument and your FTP as the second argument.");
    console.log("The .erg file contents are output to the console.  To put the contents into a file, use the '>' redirect operator followed by the filename.");
    console.log();
    return;
}

var ftp = parseFloat(process.argv[3]);

if (ftp == NaN) {
    console.log("Couldn't convert " + process.argv[3] + " to a numeric FTP value.");
    return;
}

var xml;

try {
    xml = fs.readFileSync(process.argv[2], 'utf8');
} catch (error) {
    console.log("Couldn't read .zwo file at " + process.argv[2] + ": " + error);
    return;
}

var workout;

try {
    workout = loadFromXml(xml);
} catch (error) {
    console.log("Couldn't load workout from .zwo file xml: " + error);
    return;
}

var erg;

try {
    erg = toErgText(workout, ftp);
} catch (error) {
    console.log("Couldn't convert to erg format: " + error);
    return;
}

console.log(erg);


function loadFromXml(xml) {
    var workout = {};
    parser = new DOMParser();
    xmlDoc = parser.parseFromString(xml, "text/xml");
    workout.name = getXmlElementValue(xmlDoc, 'name');
    workout.author = getXmlElementValue(xmlDoc, 'author');
    workout.description = getXmlElementValue(xmlDoc, 'description');
    workout.segments = [];
    var xmlSegments = xmlDoc.getElementsByTagName('workout')[0].childNodes;
    var segmentToAdd;
    
    for (var i = 0; i < xmlSegments.length; i++) {
        if (xmlSegments[i].nodeType != 1) continue;
        switch (xmlSegments[i].tagName.toLowerCase().charAt(0)) {
            case "s":
                var attrName = xmlSegments[i].hasAttribute('Power') ? 'Power' : 'PowerHigh';
                var p1 = getIntOrDefault(100*xmlSegments[i].getAttribute(attrName), 5);
                var d1 = getIntOrDefault(xmlSegments[i].getAttribute('Duration'), 5);
                segmentToAdd = new Segment('s', p1, d1, null, null, null);
                break;
            case "w":
            case "c":
            case "r":
                var p1 = getIntOrDefault(100*xmlSegments[i].getAttribute('PowerLow'), 5);
                var d1 = getIntOrDefault(xmlSegments[i].getAttribute('Duration'), 5);
                var p2 = getIntOrDefault(100*xmlSegments[i].getAttribute('PowerHigh'), 5);
                segmentToAdd = new Segment('r', p1, d1, p2, null, null);
                break;
            case "f":
                segmentToAdd = new Segment('f', null, getIntOrDefault(xmlSegments[i].getAttribute('Duration'), 5), null, null, null);
                break;
            case "i":
                var p1 = getIntOrDefault(100*xmlSegments[i].getAttribute('OnPower'), 5);
                var d1 = getIntOrDefault(xmlSegments[i].getAttribute('OnDuration'), 5);
                var p2 = getIntOrDefault(100*xmlSegments[i].getAttribute('OffPower'), 5);
                var d2 = getIntOrDefault(xmlSegments[i].getAttribute('OffDuration'), 5);
                var r = getIntOrDefault(xmlSegments[i].getAttribute('Repeat'), 1);
                segmentToAdd = new Segment('i', p1, d1, p2, d2, r);
                break;
        }
        if (xmlSegments[i].getAttribute('Cadence')) segmentToAdd.c1 = xmlSegments[i].getAttribute('Cadence');
        if (xmlSegments[i].getAttribute('CadenceResting')) segmentToAdd.c2 = xmlSegments[i].getAttribute('CadenceResting');
        if (xmlSegments[i].childNodes && xmlSegments[i].childNodes.length > 0) {
            for (var j = 0; j < xmlSegments[i].childNodes.length; j++) {
                if (xmlSegments[i].childNodes[j].nodeType != 1) continue;
                if (xmlSegments[i].childNodes[j].tagName.toLowerCase() != 'textevent') continue;
                segmentToAdd.textEvents.push({ text: xmlSegments[i].childNodes[j].getAttribute('message'), 
                    offset: getIntOrDefault(xmlSegments[i].childNodes[j].getAttribute('timeoffset'), 0)});
            }
        }
        if (xmlSegments[i].getAttribute('show_avg')) segmentToAdd.avg = xmlSegments[i].getAttribute('show_avg') == '1';
        if (xmlSegments[i].getAttribute('FlatRoad')) segmentToAdd.dfr = xmlSegments[i].getAttribute('FlatRoad') == '0';
        workout.segments.push(segmentToAdd);
    }

    return workout;
};


function getXmlElementValue(xmlDoc, tagName) {
    var node = xmlDoc.getElementsByTagName(tagName)[0];
    if (!node || !node.childNodes || !node.childNodes.length || node.childNodes.length == 0) return '';
    return node.childNodes[0].nodeValue;
}


function getIntOrDefault(toParse, minimumDefaultValue) {
    var parsed = parseFloat(toParse);
    if (!parsed) return minimumDefaultValue;
    if (parsed < minimumDefaultValue) return minimumDefaultValue;
    return Math.max(Math.round(parsed), minimumDefaultValue);
}


function isNumeric(value) {
    return !isNaN(parseFloat(value)) && isFinite(value);
}


function toErgText(workout, ftp) {
    var description = workout.description;
    if (description) description = description.replace('\r', ' ').replace('\n', ' ');
    else description = '';

    var text = '[COURSE HEADER]\r\n'
        + 'VERSION = 2\r\n'
        + 'UNITS = ENGLISH\r\n'
        + 'DESCRIPTION = ' + description + '\r\n'
        + 'FILE NAME = ' + workout.name + '\r\n'
        + 'FTP=' + ftp + '\r\n'
        + 'MINUTES WATTS\r\n'
        + '[END COURSE HEADER]\r\n'
        + '[COURSE DATA]\r\n';

    var elapsedMinutes = 0.0;
    var textCues = [];
        
    for (var i = 0; i < workout.segments.length; i++) {
        for (var t = 0; t < workout.segments[i].textEvents.length; t++) {
            textCues[textCues.length] = 
                { 
                    seconds : Number(workout.segments[i].textEvents[t].offset) + Math.round(elapsedMinutes * 60, 0),
                    message : workout.segments[i].textEvents[t].text
                };
        }

        if (workout.segments[i].t == 'r') {
            text += elapsedMinutes.toFixed(2) + '\t' + Math.round(workout.segments[i].p1 / 100 * ftp, 0) + '\r\n';
            elapsedMinutes += (workout.segments[i].d1 / 60);
            text += elapsedMinutes.toFixed(2) + '\t' + Math.round(workout.segments[i].p2 / 100 * ftp, 0) + '\r\n';
        } else if (workout.segments[i].t == 'i') {
            for (var j = 0; j < workout.segments[i].r; j++) {
                text += elapsedMinutes.toFixed(2) + '\t' + Math.round(workout.segments[i].p1 / 100 * ftp, 0) + '\r\n';
                elapsedMinutes += (workout.segments[i].d1 / 60);
                text += elapsedMinutes.toFixed(2) + '\t' + Math.round(workout.segments[i].p1 / 100 * ftp, 0) + '\r\n';
                text += elapsedMinutes.toFixed(2) + '\t' + Math.round(workout.segments[i].p2 / 100 * ftp, 0) + '\r\n';
                elapsedMinutes += (workout.segments[i].d2 / 60);
                text += elapsedMinutes.toFixed(2) + '\t' + Math.round(workout.segments[i].p2 / 100 * ftp, 0) + '\r\n';
            }
        } else {
            var pwr = workout.segments[i].t == 'f' ? Math.round(0.8 * ftp, 0) : Math.round(workout.segments[i].p1 / 100 * ftp, 0);
            text += elapsedMinutes.toFixed(2) + '\t' + pwr + '\r\n';
            elapsedMinutes += (workout.segments[i].d1 / 60);
            text += elapsedMinutes.toFixed(2) + '\t' + pwr + '\r\n';
        }
    }

    text += '[END COURSE DATA]\r\n';

    if (textCues.length > 0) {
        text += '[COURSE TEXT]\r\n';
        for (var i = 0; i < textCues.length; i++) {
            var cue = textCues[i];
            text += cue.seconds + '\t' + cue.message + '\t10\r\n';
        }

        text += '[END COURSE TEXT]\r\n';
    }

    return text;
}

function Segment(t, p1, d1, p2, d2, r) {
    this.t = t;
    if (isNumeric(p1)) this.p1 = p1;
    if (isNumeric(d1)) this.d1 = d1;
    if (isNumeric(p2)) this.p2 = p2;
    if (isNumeric(d2)) this.d2 = d2;
    if (isNumeric(r)) this.r = r;
    this.textEvents = [];
};
