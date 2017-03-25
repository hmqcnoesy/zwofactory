var Workout = function(name, desc, auth, tagStr) {
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
        this.segments.push(segment);
    }
}


Workout.prototype.setTags = function(tagStr) {
    this.tags = tagStr.split(' ');
};


Workout.prototype.addSegment = function(segment) {
    this.segments.push(segment);
};


var Segment = function(t, p1, d1, p2, d2, r) {
    this.id = createGuid();
    this.t = t;
    if (isNumeric(p1)) this.p1 = p1;
    if (isNumeric(d1)) this.d1 = d1;
    if (isNumeric(p2)) this.p2 = p2;
    if (isNumeric(d2)) this.d2 = d2;
    if (isNumeric(r)) this.r = r;
    this.textEvents = [];
};


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
    var y2 = y1 - 2;
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
}


function loadLinks() {
    var linksElement = document.getElementById('divLinks');
    for (var i = 0; i < userSettings.links.length; i++) {
        var link = document.createElement('a');
        link.setAttribute('href', userSettings.links[i].href);
        link.appendChild(document.createTextNode(userSettings.links[i].name));
        linksElement.appendChild(link);
    }
}


function loadWorkout(workoutString) {
    var segments = workoutString.split('!');
    for (var i = 0; i < segments.length; i++) {
        if (!segments[i]) continue;

        var pieces = segments[i].split('-');
        var btn = document.getElementById('btn' + pieces[0]);
        btn.click();
        var label = getSelectedSegment().querySelector('label');
        switch(pieces[0].toLowerCase()) {
            case "s":
                if (isNumeric(pieces[1])) label.setAttribute('data-p-1', parseFloat(pieces[1]));
                if (isNumeric(pieces[2])) label.setAttribute('data-d-1', parseFloat(pieces[2]));
                break;
            case "w":
            case "c":
            case "r":
                if (isNumeric(pieces[1])) label.setAttribute('data-p-1', parseFloat(pieces[1]));
                if (isNumeric(pieces[2])) label.setAttribute('data-d-1', parseFloat(pieces[2]));
                if (isNumeric(pieces[3])) label.setAttribute('data-p-2', parseFloat(pieces[3]));
                break;
            case "f":
                if (isNumeric(pieces[1])) label.setAttribute('data-d-1', parseFloat(pieces[1]));
                break;
            case "i":
                if (isNumeric(pieces[1])) label.setAttribute('data-p-1', parseFloat(pieces[1]));
                if (isNumeric(pieces[2])) label.setAttribute('data-d-1', parseFloat(pieces[2]));
                if (isNumeric(pieces[3])) label.setAttribute('data-p-2', parseFloat(pieces[3]));
                if (isNumeric(pieces[4])) label.setAttribute('data-d-2', parseFloat(pieces[4]));
                if (isNumeric(pieces[5])) label.setAttribute('data-r', parseInt(pieces[5]));
                break;
        }
        redraw(label);
    }
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


function getSelectedSegment() {
    var selectedSegment = document.querySelector('#divSegmentChart input:checked');
    if (!selectedSegment) return null;
    return document.querySelector('div[data-id="' + selectedSegment.id + '"]');
}


function loadNoSegment() {
    var txtR = document.querySelector('#txtR');
    txtR.value = ''; 
    txtR.setAttribute('disabled', true);
    var txtD1 = document.querySelector('#txtD1');
    txtD1.value = ''; 
    txtD1.setAttribute('disabled', true);
    var txtP1 = document.querySelector('#txtP1');
    txtP1.value = ''; 
    txtP1.setAttribute('disabled', true);
    var txtD2 = document.querySelector('#txtD2');
    txtD2.value = ''; 
    txtD2.setAttribute('disabled', true);
    var txtP2 = document.querySelector('#txtP2');
    txtP2.value = ''; 
    txtP2.setAttribute('disabled', true);
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


function createXmlString() {
    var name = getName();
    var author = document.getElementById('txtAuthor').value;
    var description = document.getElementById('txtDescription').value;
    var tags = document.getElementById('txtTags').value.split(' ');
    var segments = document.querySelectorAll('#divSegmentChart > div');
    var xml = '<workout_file>\r\n'
        + '    <author>' + escapeXml(author) + '</author>\r\n'
        + '    <name>' + escapeXml(name) + '</name>\r\n'
        + '    <description>' + escapeXml(description) + '</description>\r\n'
        + '    <sportType>bike</sportType>\r\n'
        + '    <tags>\r\n';

    for (var i = 0; i < tags.length; i++) {
        if (!tags[i] || tags[i].trim() == '') continue;
        xml += '        <tag name="' + escapeXml(tags[i]) + '"/>\r\n';
    }
    xml += '    </tags>\r\n';
    xml += '    <workout>\r\n';

    for (var i = 0; i < segments.length; i++) {
        xml += '        ' + createWorkoutElement(segments[i].querySelector('label')) + '\r\n';
    }

    xml += '    </workout>\r\n'
        + '</workout_file>';

    return xml;
}


function createQueryString() {
    var name = getName();
    var author = document.getElementById('txtAuthor').value.trim();
    var description = document.getElementById('txtDescription').value.trim();
    var tags = document.getElementById('txtTags').value.trim();
    var segments = document.querySelectorAll('#divSegmentChart > div');
    var qs = '?w=';
    for (var i = 0; i < segments.length; i++) {
        var label = segments[i].querySelector('label');
        qs += label.getAttribute('data-t').charAt(0) + '-';
        qs += getQsParamAttributeIfExists(label, 'data-p-1');
        qs += getQsParamAttributeIfExists(label, 'data-d-1');
        qs += getQsParamAttributeIfExists(label, 'data-p-2');
        qs += getQsParamAttributeIfExists(label, 'data-d-2');
        qs += getQsParamAttributeIfExists(label, 'data-r');
        qs = qs.substr(0, qs.length-1) + '!';
    }

    qs += '&t=' + encodeURIComponent(tags);
    qs += '&a=' + encodeURIComponent(author);
    qs += '&n=' + encodeURIComponent(name);
    qs += '&d=' + encodeURIComponent(description);

    return qs;
}


function getQsParamAttributeIfExists(segment, attrName) {
    var attr = segment.getAttribute(attrName);
    if (attr) return attr + '-';
    else return '';
}


function createWorkoutElement(segment) {
    switch(segment.getAttribute('data-t').toLowerCase()) {
        case "s":
            return '<SteadyState Duration="' + segment.getAttribute('data-d-1') + '" Power="' + (segment.getAttribute('data-p-1') / 100) + '"/>';
            break;
        case "w":
            return '<Warmup Duration="' + segment.getAttribute('data-d-1') + '" PowerLow="' + (segment.getAttribute('data-p-1') / 100) + '" PowerHigh="' + (segment.getAttribute('data-p-2') / 100) + '"/>';
            break;
        case "c":
            return '<Cooldown Duration="' + segment.getAttribute('data-d-1') + '" PowerLow="' + (segment.getAttribute('data-p-1') / 100) + '" PowerHigh="' + (segment.getAttribute('data-p-2') / 100) + '"/>';
            break;
        case "r":
            return '<Ramp Duration="' + segment.getAttribute('data-d-1') + '" PowerLow="' + (segment.getAttribute('data-p-1') / 100) + '" PowerHigh="' + (segment.getAttribute('data-p-2') / 100) + '"/>';
            break;
        case "f":
            return '<FreeRide Duration="' + segment.getAttribute('data-d-1') + '" FlatRoad="1" />';
            break;
        case "i":
            return '<IntervalsT Repeat="' + segment.getAttribute('data-r') + '" OnDuration="' + segment.getAttribute('data-d-1') + '" OffDuration="' + segment.getAttribute('data-d-2') + '" OnPower="' + (segment.getAttribute('data-p-1') / 100) + '" OffPower="' + (segment.getAttribute('data-p-2') / 100) + '"/>';
            break;
        default:
            break;
    }
}