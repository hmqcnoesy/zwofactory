function Workout (name, desc, auth, tagStr) {
    this.name = name;
    this.description = desc;
    this.author = auth;
    this.tags = [];
    if (tagStr) tags = tagStr.split(' ');
    this.segments = [];
};


Workout.prototype.reconstituteFromDeserialized = function(workout) {
    this.name = workout.name;
    this.description = workout.description;
    this.author = workout.author;
    this.tags = workout.tags;
    this.segments = [];
    for (var i = 0; i < workout.segments.length; i++) {
        var s = workout.segments[i];
        var segment = new Segment(s.t, s.p1, s.d1, s.p2, s.d2, s.r);
        if (s.c1) segment.c1 = s.c1;
        if (s.c2) segment.c2 = s.c2;
        if (s.textEvents) {
            for (var j = 0; j < s.textEvents.length; j++) {
                segment.textEvents.push({id: s.textEvents[j].id, text: s.textEvents[j].text, offset: s.textEvents[j].offset });
            }
        }
        if (s.avg) segment.avg = s.avg;
        if (s.dfr) segment.dfr = s.dfr;
        this.segments.push(segment);
    }
}


Workout.prototype.calculateDuration = function() {
    var totalSeconds = 0;
    for (var i = 0; i < this.segments.length; i++) {
        if (this.segments[i].t == 'i') {
            totalSeconds += Number(this.segments[i].r) * (Number(this.segments[i].d1) + Number(this.segments[i].d2));
        } else {
            totalSeconds += Number(this.segments[i].d1);
        }
    }
    var dt = new Date(null);
    dt.setSeconds(totalSeconds);
    var str = dt.toISOString().substr(11, 8);
    if (str.indexOf('0') == 0) str = str.substr(1);
    return str;
}


Workout.prototype.calculateScore = function() {
    var scoreSum = 0;
    
    for (var i = 0; i < this.segments.length; i++) {
        if (this.segments[i].t == 'i') {
            var pwr1 = Number(this.segments[i].p1) / 100;
            var pwr2 = Number(this.segments[i].p2) / 100;
            scoreSum += Number(this.segments[i].r) * pwr1 * pwr1 * (Number(this.segments[i].d1) / 36);
            scoreSum += Number(this.segments[i].r) * pwr2 * pwr2 * (Number(this.segments[i].d2) / 36);
        } else if (this.segments[i].t == 'r') {
            var avgPwr = ((Number(this.segments[i].p1) + Number(this.segments[i].p2)) / 2) / 100;
            scoreSum += avgPwr * avgPwr * (Number(this.segments[i].d1) / 36);
        } else if (this.segments[i].t == 'f') {
            scoreSum += 0.8 * 0.8 * (Number(this.segments[i].d1) / 36);
        } else {
            var pwr = Number(this.segments[i].p1) / 100;
            scoreSum += pwr * pwr * (Number(this.segments[i].d1) / 36);
        }
    }

    return Math.floor(scoreSum, 0);
}


Workout.prototype.calculateXp = function() {
    var xpSum = 0;
    
    for (var i = 0; i < this.segments.length; i++) {
        if (this.segments[i].t == 'i') {
            var segmentTime = this.segments[i].r * (this.segments[i].d1 + this.segments[i].d2);
            xpSum += Math.floor(segmentTime / 5.06);  // 1 xp every 5.06 seconds
        } else if (this.segments[i].t == 'r') {
            xpSum += Math.floor(this.segments[i].d1 / 10.9);  // 1 xp every 10.9 seconds
        } else if (this.segments[i].t == 'f') {
            xpSum += Math.floor((this.segments[i].d1 / 10.1666)); // 1 xp every 10.1666 seconds
        } else {
            xpSum += Math.floor(this.segments[i].d1 / 5.6);  // 1 xp every 5.6 seconds
        }
    }

    return xpSum;
}


Workout.prototype.setTags = function(tagStr) {
    this.tags = tagStr.split(' ');
};


Workout.prototype.addSegment = function(segment) {
    this.segments.push(segment);
};


Workout.prototype.toZwoXml = function() {
    var xml = '<workout_file>\r\n'
        + '    <author>' + escapeXml(this.author) + '</author>\r\n'
        + '    <name>' + escapeXml(this.name) + '</name>\r\n'
        + '    <description>' + escapeXml(this.description) + '</description>\r\n'
        + '    <sportType>bike</sportType>\r\n'
        + '    <tags>\r\n';

    for (var i = 0; i < this.tags.length; i++) {
        if (this.tags[i].trim() == '') continue;
        xml += '        <tag name="' + escapeXml(this.tags[i]) + '"/>\r\n';
    }
    xml += '    </tags>\r\n';
    xml += '    <workout>\r\n';

    for (var i = 0; i < this.segments.length; i++) {
        if (this.segments[i].t == 'r' && i == 0) this.segments[i].t = 'w';
        if (this.segments[i].t == 'w' && i != 0) this.segments[i].t = 'r';
        if (this.segments[i].t == 'r' && i == (this.segments.length - 1)) this.segments[i].t = 'c';
        if (this.segments[i].t == 'c' && i != (this.segments.length - 1)) this.segments[i].t = 'r';
        xml += this.segments[i].toZwoXmlElement();
    }

    xml += '    </workout>\r\n'
        + '</workout_file>\r\n';

    return xml;
};


Workout.prototype.toMrcText = function() {
    var description = this.description;
    if (description) description = description.replace('\r', ' ').replace('\n', ' ');
    else description = '';

    var text = '[COURSE HEADER]\r\n'
        + 'VERSION = 2\r\n'
        + 'UNITS = ENGLISH\r\n'
        + 'DESCRIPTION = ' + description + '\r\n'
        + 'FILE NAME = ' + this.name + '\r\n'
        + 'MINUTES PERCENT\r\n'
        + '[END COURSE HEADER]\r\n'
        + '[COURSE DATA]\r\n';

    var elapsedMinutes = 0.0;
    var textCues = [];
        
    for (var i = 0; i < this.segments.length; i++) {
        for (var t = 0; t < this.segments[i].textEvents.length; t++) {
            textCues[textCues.length] = 
                { 
                    seconds : Number(this.segments[i].textEvents[t].offset) + Math.round(elapsedMinutes * 60, 0),
                    message : this.segments[i].textEvents[t].text
                };
        }

        if (this.segments[i].t == 'r') {
            text += elapsedMinutes.toFixed(2) + '\t' + Math.round(this.segments[i].p1, 0) + '\r\n';
            elapsedMinutes += (this.segments[i].d1 / 60);
            text += elapsedMinutes.toFixed(2) + '\t' + Math.round(this.segments[i].p2, 0) + '\r\n';
        } else if (this.segments[i].t == 'i') {
            for (var j = 0; j < this.segments[i].r; j++) {
                text += elapsedMinutes.toFixed(2) + '\t' + Math.round(this.segments[i].p1, 0) + '\r\n';
                elapsedMinutes += (this.segments[i].d1 / 60);
                text += elapsedMinutes.toFixed(2) + '\t' + Math.round(this.segments[i].p1, 0) + '\r\n';
                text += elapsedMinutes.toFixed(2) + '\t' + Math.round(this.segments[i].p2, 0) + '\r\n';
                elapsedMinutes += (this.segments[i].d2 / 60);
                text += elapsedMinutes.toFixed(2) + '\t' + Math.round(this.segments[i].p2, 0) + '\r\n';
            }
        } else {
            var pwr = this.segments[i].t == 'f' ? 80 : Math.round(this.segments[i].p1, 0);
            text += elapsedMinutes.toFixed(2) + '\t' + pwr + '\r\n';
            elapsedMinutes += (this.segments[i].d1 / 60);
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


Workout.prototype.toErgText = function(ftp) {
    var description = this.description;
    if (description) description = description.replace('\r', ' ').replace('\n', ' ');
    else description = '';

    var text = '[COURSE HEADER]\r\n'
        + 'VERSION = 2\r\n'
        + 'UNITS = ENGLISH\r\n'
        + 'DESCRIPTION = ' + description + '\r\n'
        + 'FILE NAME = ' + this.name + '\r\n'
        + 'FTP=' + ftp + '\r\n'
        + 'MINUTES WATTS\r\n'
        + '[END COURSE HEADER]\r\n'
        + '[COURSE DATA]\r\n';

    var elapsedMinutes = 0.0;
    var textCues = [];
        
    for (var i = 0; i < this.segments.length; i++) {
        for (var t = 0; t < this.segments[i].textEvents.length; t++) {
            textCues[textCues.length] = 
                { 
                    seconds : Number(this.segments[i].textEvents[t].offset) + Math.round(elapsedMinutes * 60, 0),
                    message : this.segments[i].textEvents[t].text
                };
        }

        if (this.segments[i].t == 'r') {
            text += elapsedMinutes.toFixed(2) + '\t' + Math.round(this.segments[i].p1 / 100 * ftp, 0) + '\r\n';
            elapsedMinutes += (this.segments[i].d1 / 60);
            text += elapsedMinutes.toFixed(2) + '\t' + Math.round(this.segments[i].p2 / 100 * ftp, 0) + '\r\n';
        } else if (this.segments[i].t == 'i') {
            for (var j = 0; j < this.segments[i].r; j++) {
                text += elapsedMinutes.toFixed(2) + '\t' + Math.round(this.segments[i].p1 / 100 * ftp, 0) + '\r\n';
                elapsedMinutes += (this.segments[i].d1 / 60);
                text += elapsedMinutes.toFixed(2) + '\t' + Math.round(this.segments[i].p1 / 100 * ftp, 0) + '\r\n';
                text += elapsedMinutes.toFixed(2) + '\t' + Math.round(this.segments[i].p2 / 100 * ftp, 0) + '\r\n';
                elapsedMinutes += (this.segments[i].d2 / 60);
                text += elapsedMinutes.toFixed(2) + '\t' + Math.round(this.segments[i].p2 / 100 * ftp, 0) + '\r\n';
            }
        } else {
            var pwr = this.segments[i].t == 'f' ? Math.round(0.8 * ftp, 0) : Math.round(this.segments[i].p1 / 100 * ftp, 0);
            text += elapsedMinutes.toFixed(2) + '\t' + pwr + '\r\n';
            elapsedMinutes += (this.segments[i].d1 / 60);
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


Workout.prototype.toUrl = function() {
    var url = location.protocol + '//' + location.host + location.pathname
        + '?a=' + encodeURIComponent(this.author ? this.author : '') 
        + '&n=' + encodeURIComponent(this.name) 
        + '&d=' + encodeURIComponent(this.description ? this.description : '') 
        + '&t=';
    var encodedTags = [];

    for (var i = 0; i < this.tags.length; i++) {
        if (this.tags[i].trim() == '') continue;
        encodedTags.push(encodeURIComponent(this.tags[i]));
    }
    url += encodedTags.join('+');
    
    url += '&w=';

    for (var i = 0; i < this.segments.length; i++) {
        url += this.segments[i].toUriComponent();
    }

    return url;
};


Workout.prototype.loadFromXml = function(xml) {
    parser = new DOMParser();
    xmlDoc = parser.parseFromString(xml, "text/xml");
    this.name = getXmlElementValue(xmlDoc, 'name');
    this.author = getXmlElementValue(xmlDoc, 'author');
    this.description = getXmlElementValue(xmlDoc, 'description');
    var tags = xmlDoc.getElementsByTagName('tag');
    for (var i = 0; i < tags.length; i++) {
        if (tags[i].nodeType != 1) continue;
        this.tags.push(tags[i].getAttribute('name'));
    }

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
                segmentToAdd.textEvents.push({id: createGuid(), text: xmlSegments[i].childNodes[j].getAttribute('message'), 
                    offset: getIntOrDefault(xmlSegments[i].childNodes[j].getAttribute('timeoffset'), 0)});
            }
        }
        if (xmlSegments[i].getAttribute('show_avg')) segmentToAdd.avg = xmlSegments[i].getAttribute('show_avg') == '1';
        if (xmlSegments[i].getAttribute('FlatRoad')) segmentToAdd.dfr = xmlSegments[i].getAttribute('FlatRoad') == '0';
        this.segments.push(segmentToAdd);
    }
};


Workout.prototype.loadFromErgOrMrc = function(text) {
    text = text.replace(/(\r\n)|\n/g, '\r');
    var lines = text.split('\r');
    var lineCount = lines.length;
    var lineNumber = 0;
    var line = lines[lineNumber];
    var ftp = userSettings.userFtp;
    var isAbsolute = false;
    var startTime = null;
    var duration = 0;
    var startPowerPercent = 0;
    var endPowerPercent = 0;
    var importedSegments = [];
    var parsedLine = [];

    this.name = '';
    this.description = '';
    this.author = '';
    
    while (line != '[END COURSE HEADER]') {
        if (lineNumber >= lineCount) break;
        line = lines[lineNumber++];
        if (/^DESCRIPTION ?\=/i.test(line)) this.description = line.substr(line.indexOf('=')+1).trim();
        if (/^FILE ?NAME ?\=/i.test(line)) this.name = line.substr(line.indexOf('=')+1).trim();
        if (/^FTP ?\=/i.test(line)) ftp = parseFloat(line.substr(line.indexOf('=')+1).trim());
        if (/^NUMBER (PERCENT)|(WATTS)/i.test(line)) isAbsolute = "WATTS" == line.substr(8);
    }

    while (line != '[END COURSE DATA]') {
        if (lineNumber >= lineCount) break;
        line = lines[lineNumber++];
        if (!/^(\d{1,4}\.?\d{0,2})\s+(\d{1,4}\.?\d{0,2})$/i.test(line)) continue;
        parsedLine = line.match(/^(\d{1,4}\.?\d{0,2})\s+(\d{1,4}\.?\d{0,2})$/i);
        if (startTime == null) {
            startTime = parseFloat(parsedLine[1]);
            startPowerPercent = isAbsolute ? parseFloat(parsedLine[2]) * 100 / ftp : parseFloat(parsedLine[2]);
        } else {
            duration = Math.round((parseFloat(parsedLine[1]) - startTime) * 60, 0);
            endPowerPercent = isAbsolute ? parseFloat(parsedLine[2]) * 100 / ftp : parseFloat(parsedLine[2]);

            if (startPowerPercent == endPowerPercent)
                importedSegments.push(new Segment('s', Math.round(startPowerPercent, 0), duration, null, null, null));
            else
                importedSegments.push(new Segment('r', Math.round(startPowerPercent, 0), duration, Math.round(endPowerPercent, 0), null, null));

            startTime = null;
        }
    }

    while (line != '[END COURSE TEXT]') {
        if (lineNumber >= lineCount) break;
        line = lines[lineNumber++];
        if (!/^\d{1,5}\s+.+\s\d{1,2}$/i.test(line)) continue;

        parsedLine = line.match(/^(\d{1,5})\s+(.+)\s+(\d{1,2})$/i);
        startTime = parseInt(parsedLine[1]);
        message = parsedLine[2];
        var cumulativeSeconds = 0;
        for (var i = 0; i < importedSegments.length; i++) {
            if (startTime >= cumulativeSeconds && startTime < (cumulativeSeconds + importedSegments[i].d1))
                importedSegments[i].textEvents.push({ id: createGuid(), offset: (startTime - cumulativeSeconds), text: message });
            
            cumulativeSeconds += importedSegments[i].d1;
        }
    }

    for (var i = 0; i < importedSegments.length; i++) {
        this.segments.push(importedSegments[i]);
    }
};


Workout.prototype.loadFromUrl = function(queryString) {
    var qsValues = new URLSearchParams(queryString);
    this.name = qsValues.get('n');
    this.description = qsValues.get('d');
    this.author = qsValues.get('a');
    this.tags = qsValues.get('t').split(' ');
    var workoutString = qsValues.get('w');
    var regex = /(s|r|f|i)([0-9A-Z]+)([!*]{0,2})/g;
    var match = regex.exec(workoutString);

    while (match != null) {
        switch (match[1]) {
            case "s":
                var d1 = getIntOrDefault(decodeNumber(match[2].substr(0,3)), 5);
                var p1 = getIntOrDefault(decodeNumber(match[2].substr(3,2)), 5);
                segmentToAdd = new Segment('s', p1, d1, null, null, null);
                if (match[2].length == 7) segmentToAdd.c1 = getIntOrDefault(decodeNumber(match[2].substr(5,2)), 5);
                if (match[3].length == 1) segmentToAdd.avg = match[3] === '!';
                break;
            case "r":
                var d1 = getIntOrDefault(decodeNumber(match[2].substr(0,3)), 5);
                var p1 = getIntOrDefault(decodeNumber(match[2].substr(3,2)), 5);
                var p2 = getIntOrDefault(decodeNumber(match[2].substr(5,2)), 5);
                segmentToAdd = new Segment('r', p1, d1, p2, null, null);
                if (match[2].length == 9) segmentToAdd.c1 = getIntOrDefault(decodeNumber(match[2].substr(7,2)), 5);
                if (match[3].length == 1) segmentToAdd.avg = match[3] === '!';
                break;
            case "f":
                segmentToAdd = new Segment('f', null, getIntOrDefault(decodeNumber(match[2].substr(0,3)), 5), null, null, null);
                if (match[2].length == 5) segmentToAdd.c1 = getIntOrDefault(decodeNumber(match[2].substr(3,2)), 5);
                if (match[3].length == 2) {
                    segmentToAdd.avg = match[3].substr(0,1) === '!';
                    segmentToAdd.dfr = match[3].substr(1,1) === '!';
                }
                break;
            case "i":
                var r = getIntOrDefault(decodeNumber(match[2].substr(0,1)), 1);
                var d1 = getIntOrDefault(decodeNumber(match[2].substr(1,3)), 5);
                var d2 = getIntOrDefault(decodeNumber(match[2].substr(4,3)), 5);
                var p1 = getIntOrDefault(decodeNumber(match[2].substr(7,2)), 5);
                var p2 = getIntOrDefault(decodeNumber(match[2].substr(9,2)), 5);
                segmentToAdd = new Segment('i', p1, d1, p2, d2, r);
                if (match[2].length >= 12) segmentToAdd.c1 = getIntOrDefault(decodeNumber(match[2].substr(11,2)), 5);
                if (match[2].length == 15) segmentToAdd.c2 = getIntOrDefault(decodeNumber(match[2].substr(13,2)), 5);
                if (match[3].length == 1) segmentToAdd.avg = match[3] === '!';
                break;
        }
            
        this.segments.push(segmentToAdd);
        match = regex.exec(workoutString);
    }
};


function Segment(t, p1, d1, p2, d2, r) {
    this.id = createGuid();
    this.t = t;
    if (isNumeric(p1)) this.p1 = p1;
    if (isNumeric(d1)) this.d1 = d1;
    if (isNumeric(p2)) this.p2 = p2;
    if (isNumeric(d2)) this.d2 = d2;
    if (isNumeric(r)) this.r = r;
    this.textEvents = [];
};


Segment.prototype.duplicateFrom = function(segmentToClone) {
    this.id = createGuid();
    this.t = segmentToClone.t;
    if (isNumeric(segmentToClone.p1)) this.p1 = segmentToClone.p1;
    if (isNumeric(segmentToClone.d1)) this.d1 = segmentToClone.d1;
    if (isNumeric(segmentToClone.p2)) this.p2 = segmentToClone.p2;
    if (isNumeric(segmentToClone.d2)) this.d2 = segmentToClone.d2;
    if (isNumeric(segmentToClone.r)) this.r = segmentToClone.r;
    if (isNumeric(segmentToClone.c1)) this.c1 = segmentToClone.c1;
    if (isNumeric(segmentToClone.c2)) this.c2 = segmentToClone.c2;
    if (segmentToClone.avg) this.avg = segmentToClone.avg;
    if (segmentToClone.dfr) this.dfr = segmentToClone.dfr;

    if (userSettings.duplicateTextEvents) {
        for(var i = 0; i < segmentToClone.textEvents.length; i++) {
            this.textEvents.push({id: createGuid(), offset: segmentToClone.textEvents[i].offset, text: segmentToClone.textEvents[i].text });
        }
    }
}


Segment.prototype.addTextEvent = function(text, offset) {
    var id = createGuid();
    this.textEvents.push({id:id, text:text, offset:offset});
    return id;
};

Segment.prototype.addCadence = function(c1, c2) {
    if (isNumeric(c1)) this.c1 = c1;
    if (isNumeric(c2)) this.c2 = c2;
};


Segment.prototype.toSvgs = function(settings) {
    if (this.t == 'i') return this.toSvgIntervals(settings);
    else if (this.t == 'f') return [this.toSvgFreeRide(settings)];
    else return [this.toSvgSinglePolygon(settings)];
};


Segment.prototype.toSvgIntervals = function(settings) {
    var uri = 'http://www.w3.org/2000/svg';
    this.d1 = getIntOrDefault(this.d1, 5);
    this.d2 = getIntOrDefault(this.d2, 5);
    this.p1 = getIntOrDefault(this.p1, 5);
    this.p2 = getIntOrDefault(this.p2, 5);
    this.r = getIntOrDefault(this.r, 1);
    var width1 = Math.max(this.d1/settings.horizSecondsPerPixel, settings.minShapeWidth);
    var width2 = Math.max(this.d2/settings.horizSecondsPerPixel, settings.minShapeWidth);

    var svgs = [];
    var svg1 = document.createElementNS(uri, 'svg');
    svg1.setAttribute('width', width1);
    svg1.setAttribute('height', settings.shapeHeight);
    var path1 = this.createPolygonPath(settings, 's', this.p1, this.p1, width1);
    svg1.appendChild(path1);
    if (this.c1 && settings.showCadenceIndicator) svg1.appendChild(this.createCadencePath(settings));

    var svg2 = document.createElementNS(uri, 'svg');
    svg2.setAttribute('width', width2);
    svg2.setAttribute('height', settings.shapeHeight);
    var path2 = this.createPolygonPath(settings, 's', this.p2, this.p2, width2);
    svg2.appendChild(path2);
    if (this.c2 && settings.showCadenceIndicator) svg2.appendChild(this.createCadencePath(settings));

    for (var i = 0; i < this.r; i++) {
        svgs.push(svg1.cloneNode(true));
        svgs.push(svg2.cloneNode(true));
    }

    if (this.textEvents.length > 0 && settings.showTextEventIndicator) svgs[0].appendChild(this.createTextEventElement(settings, this.textEvents.length));
    if (this.avg && settings.showAvgPwrIndicator) svgs[0].appendChild(this.createAvgPwrPath(settings));
    
    return svgs;
};


Segment.prototype.toSvgFreeRide = function(settings) {
    var uri = 'http://www.w3.org/2000/svg';
    this.d1 = getIntOrDefault(this.d1, 5);
    var width = Math.max(this.d1/settings.horizSecondsPerPixel, settings.minShapeWidth);

    var svg = document.createElementNS(uri, 'svg');
    svg.setAttribute('width', width);
    svg.setAttribute('height', settings.shapeHeight);

    var path = document.createElementNS(uri, 'path');
    var y1 = settings.shapeHeight - (75/settings.verticalPercentsPerPixel);
    var y2 = y1 - (50/settings.verticalPercentsPerPixel);
    var y3 = y1 + (50/settings.verticalPercentsPerPixel);
    path.setAttribute('d', 'M 1 ' + y1 + ' C ' + (width/3) + ' ' + y2 + ', ' + (width/3*2) + ' ' + y3 + ', ' + width + ' ' + y1 + ' V ' + settings.shapeHeight + ' H 1 Z');
    path.setAttribute('class', 'z1');
    svg.appendChild(path);
    if (this.c1 && settings.showCadenceIndicator) svg.appendChild(this.createCadencePath(settings));
    if (this.textEvents.length > 0 && settings.showTextEventIndicator) svg.appendChild(this.createTextEventElement(settings, this.textEvents.length));
    if (this.avg && settings.showAvgPwrIndicator) svg.appendChild(this.createAvgPwrPath(settings));
    if (this.dfr && settings.showDisabledFlatRoadIndicator) svg.appendChild(this.createDisabledFlatRoadPath(settings));

    return svg;
};


Segment.prototype.toSvgSinglePolygon = function(settings) {
    var uri = 'http://www.w3.org/2000/svg';
    var d1 = getIntOrDefault(this.d1, 5);
    var width = Math.max(d1/settings.horizSecondsPerPixel, settings.minShapeWidth);
    var p1 = getIntOrDefault(this.p1, 5);

    var svg = document.createElementNS(uri, 'svg');
    svg.setAttribute('width', width);
    svg.setAttribute('height', settings.shapeHeight);
    var path = this.createPolygonPath(settings, this.t, this.p1, this.p2 ? this.p2 : this.p1, width);
    svg.appendChild(path);
    if (this.c1 && settings.showCadenceIndicator) svg.appendChild(this.createCadencePath(settings));
    if (this.textEvents.length > 0 && settings.showTextEventIndicator) svg.appendChild(this.createTextEventElement(settings, this.textEvents.length));
    if (this.avg && settings.showAvgPwrIndicator) svg.appendChild(this.createAvgPwrPath(settings));
    return svg;
}


Segment.prototype.createPolygonPath = function(settings, t, p1, p2, width) {
    var path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
    var y1 = settings.shapeHeight - (p1/settings.verticalPercentsPerPixel);
    var y2 = settings.shapeHeight - (p2/settings.verticalPercentsPerPixel);
    path.setAttribute('d', 'M 1 ' + y1 + ' L ' + width + ' ' + y2 + ' V ' + settings.shapeHeight + ' H 1 Z');
    if (t == 'r') {
        path.setAttribute('class', 'z1');
        return path;
    }

    if (p1 >= 119) path.setAttribute('class', 'z6');
    else if (p1 >= 105) path.setAttribute('class', 'z5');
    else if (p1 >= 90) path.setAttribute('class', 'z4');
    else if (p1 >= 76) path.setAttribute('class', 'z3');
    else if (p1 >= 60) path.setAttribute('class', 'z2');
    else path.setAttribute('class', 'z1');

    return path;
};


Segment.prototype.createCadencePath = function(settings) {
    var y1 = settings.shapeHeight - 8;
    var y2 = y1 + 3.5;
    var path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
    path.setAttribute('style', 'fill:none;');
    path.setAttribute('stroke', 'black');
    path.setAttribute('stroke-width', '1');
    path.setAttribute('d', 'M8,' + y1 + ' m-5,0 a 5,5 0 1,1 10,0 a 5,5 0 1,1 -10,0 M8,' + y1 + ' l-5.5,-5.5 M11.5,' + y2 + ' l1.75,1.75');
    return path;
};


Segment.prototype.createTextEventElement = function(settings, count) {
    var text = document.createElementNS('http://www.w3.org/2000/svg', 'text');
    text.setAttribute('x', 2);
    text.setAttribute('y', settings.shapeHeight - 18);
    text.setAttribute('style', 'font-family:Times New Roman,Times;font-size:12px;color:black;');
    text.innerHTML = 'T:' + count;
    return text;    
};


Segment.prototype.createAvgPwrPath = function(settings) {
    var y1 = settings.shapeHeight - 30;
    var path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
    path.setAttribute('style', 'fill:none;');
    path.setAttribute('stroke', 'black');
    path.setAttribute('stroke-width', '1');
    path.setAttribute('d', 'M4,' + y1 + ' l3,-9 l2,2 l4,-6 l-3,8.5 l-2,-1.5 z');
    return path;
};


Segment.prototype.createDisabledFlatRoadPath = function(settings) {
    var y1 = settings.shapeHeight - 46;
    var path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
    path.setAttribute('style', 'fill:none;');
    path.setAttribute('stroke', 'black');
    path.setAttribute('stroke-width', '1.5');
    path.setAttribute('d', 'M2,' + y1 + ' c2.98406,-6.0239 4.00398,-9.98805 4.9761,-7.01992c0.97211,2.96813 0.99602,11.95219 3.95219,8.89641c2.95618,-3.05578 1.9761,-1.95219 3.90438,-4.96414c1.92829,-3.01195 3.09562,0.05976 5.09163,0.05179');
    return path; 
};


Segment.prototype.toZwoXmlElement = function() {
    var xml = '        ';
    switch(this.t) {
        case "s":
            xml += '<SteadyState Duration="' + this.d1 + '" Power="' + (this.p1 / 100) + '"';
            break;
        case "w":
            xml += '<Warmup Duration="' + this.d1 + '" PowerLow="' + (this.p1 / 100) + '" PowerHigh="' + (this.p2 / 100) + '"';
            break;
        case "c":
            xml += '<Cooldown Duration="' + this.d1 + '" PowerLow="' + (this.p1 / 100) + '" PowerHigh="' + (this.p2 / 100) + '"';
            break;
        case "r":
            xml += '<Ramp Duration="' + this.d1 + '" PowerLow="' + (this.p1 / 100) + '" PowerHigh="' + (this.p2 / 100) + '"';
            break;
        case "f":
            xml += '<FreeRide Duration="' + this.d1 + '"';
            break;
        case "i":
            xml += '<IntervalsT Repeat="' + this.r + '" OnDuration="' + this.d1 + '" OffDuration="' + this.d2 + '" OnPower="' + (this.p1 / 100) + '" OffPower="' + (this.p2 / 100) + '"';
            break;
        default:
            break;
    }

    if (this.c1) xml += ' Cadence="' + this.c1 + '"';
    if (this.c2) xml += ' CadenceResting="' + this.c2 + '"';
    if (this.avg) xml += ' show_avg="1"';
    if (this.t == 'f') xml += ' FlatRoad="' + (this.dfr ? "0" : "1") + '"';
    var texts = this.textEventsToZwoElements();
    if (texts.length > 0) {
        xml += '>\r\n'
        xml += texts.join('\r\n');
        xml += '\r\n        </' + xml.trim().substr(1, xml.trim().indexOf(' ')-1) + '>\r\n';
    } else {
        xml += '/>\r\n';
    }
    return xml;
};


Segment.prototype.textEventsToZwoElements = function() {
    var xmlElements = [];
    if (!this.textEvents || !this.textEvents.length || this.textEvents.length == 0) return xmlElements;
    for (var i = 0; i < this.textEvents.length; i++) {
        xmlElements.push('            <textevent timeoffset="' + this.textEvents[i].offset + '" message="' + escapeXml(this.textEvents[i].text) + '"/>');
    }
    return xmlElements;
};


Segment.prototype.toUriComponent = function() {
    var url = '';
    switch(this.t) {
        case "s":
            url += 's' + encodeNumber(this.d1,3) + encodeNumber(this.p1,2);
            break;
        case "w":
        case "c":
        case "r":
            url += 'r' + encodeNumber(this.d1,3) + encodeNumber(this.p1,2) + encodeNumber(this.p2,2);
            break;
        case "f":
            url += 'f' + encodeNumber(this.d1,3);
            break;
        case "i":
            url += 'i' + encodeNumber(this.r,1) + encodeNumber(this.d1,3) + encodeNumber(this.d2,3) + encodeNumber(this.p1,2) + encodeNumber(this.p2,2);
            break;
        default:
            break;
    }

    if (this.c1) url += encodeNumber(this.c1,2);
    if (this.c2) url += encodeNumber(this.c2,2);
    if (this.t == 'f') {
        url += this.avg ? '!' : '*';
        url += this.dfr ? '!' : '*';
    } else {
        if (this.avg) url += '!';
    }
    
    return url;
};


function encodeNumber(num, digits) {
    if (!digits || digits > 3) digits = 3;
    if (digits < 1) digits = 1;

    if (digits == 3 && num > 46655) num = 46655;
    if (digits == 2 && num > 1295) num = 1295;
    if (digits == 1 && num > 35) num = 35;

    var result = Math.round(num, 0);
    var chars = ['0','1','2','3','4','5','6','7','8','9','A','B','C','D','E','F','G','H','I','J','K','L','M','N','O','P','Q','R','S','T','U','V','W','X','Y','Z',];
    var mod;
    var encoded = [];

    while(true) {
        mod = result % 36;
        result = Math.floor(result / 36);
        encoded.unshift(chars[mod]);
        if (result == 0) break;
    }

    while (encoded.length < digits)
        encoded.unshift('0');

    return encoded.join('');
}


function decodeNumber(num) {
    var chars = ['0','1','2','3','4','5','6','7','8','9','A','B','C','D','E','F','G','H','I','J','K','L','M','N','O','P','Q','R','S','T','U','V','W','X','Y','Z',];
    var mult = 1;
    var sum = 0;

    for (var i = num.length; i > 0; i--) {
        sum += mult * chars.indexOf(num[i-1]);
        mult *= 36;
    }

    return sum;
}


function isNumeric(value) {
    return !isNaN(parseFloat(value)) && isFinite(value);
}


function getName() {
     var now = new Date();
     var name = 'New-Workout-' 
            + now.getFullYear() + '-' 
            + (1 + now.getMonth()) + '-' 
            + now.getDate() + '-' 
            + now.getHours() + '-' 
            + now.getMinutes() + '-' 
            + now.getSeconds();
     return name;
}


function createGuid() {
    return 'zxxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
        var r = Math.random()*16|0, v = c == 'x' ? r : (r&0x3|0x8);
        return v.toString(16);
    });
}


function getIntOrDefault(toParse, minimumDefaultValue) {
    var parsed = parseFloat(toParse);
    if (!parsed) return minimumDefaultValue;
    if (parsed < minimumDefaultValue) return minimumDefaultValue;
    return Math.max(Math.round(parsed), minimumDefaultValue);
}


function escapeXml(unsafe) {
    if (!unsafe) return '';
    return unsafe.replace(/[<>&'"]/g, function (c) {
        switch (c) {
            case '<': return '&lt;';
            case '>': return '&gt;';
            case '&': return '&amp;';
            case '\'': return '&apos;';
            case '"': return '&quot;';
        }
    });
}


function getXmlElementValue(xmlDoc, tagName) {
    var node = xmlDoc.getElementsByTagName(tagName)[0];
    if (!node.childNodes || !node.childNodes.length || node.childNodes.length == 0) return '';
    return node.childNodes[0].nodeValue;
}
