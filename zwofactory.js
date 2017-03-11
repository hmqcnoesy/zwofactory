var horizSecondsPerPixel = 5;
var vertPixelsPerPower = 1;
var keyCodes = { 
    '1': 'btns', '2': 'btnz2', '3': 'btnz3', '4': 'btnz4', '5': 'btnz5', '6': 'btnz6', 
    '7': 'btnw', '8': 'btnc', '9': 'btnf', '0': 'btni',
    'ArrowRight': 'btnMoveRight', 'ArrowLeft': 'btnMoveLeft', 'Delete': 'btnDelete' 
};

document.addEventListener('DOMContentLoaded', function() {
    var qs = window.location.search;
    if (!qs) return;

    var params = qs.replace('?', '').split('&');
    for (var i = 0; i < params.length; i++) {
        if (params[i].substr(0, 1) == 'w') loadWorkout(params[i].substr(2));
        else if (params[i].substr(0, 1) == 't') document.getElementById('txtTags').value = decodeURIComponent(params[i].substr(2));
        else if (params[i].substr(0, 1) == 'a') document.getElementById('txtAuthor').value = decodeURIComponent(params[i].substr(2));
        else if (params[i].substr(0, 1) == 'n') document.getElementById('txtName').value = decodeURIComponent(params[i].substr(2));
        else if (params[i].substr(0, 1) == 'd') document.getElementById('txtDescription').value = decodeURIComponent(params[i].substr(2));
    }

    loadSegment(getSelectedSegment().getAttribute('data-id'));
});


document.addEventListener('keypress', function(e) {
    if (e.keyCode == 27) e.target.blur();
    if (e.target.tagName != 'BODY') return;
    console.log(e);
    if (!keyCodes.hasOwnProperty(e.key)) return;
    document.getElementById(keyCodes[e.key]).click();
});


document.getElementById('divControls').addEventListener('click', function(e) {
    if (e.target.tagName == 'BUTTON') addSegment(e.target);
});


document.getElementById('divSegmentChart').addEventListener('click', function(e) {
    if (e.target.tagName != 'INPUT') return;
    loadSegment(e.target.getAttribute('id'));
});


document.getElementById('divSegmentInputs').addEventListener('input', function(e) {
    if (e.target.tagName != 'INPUT') return;
    var target = e.target.getAttribute('data-target');
    var selectedSegment = getSelectedSegment();
    if (!selectedSegment) return;
    var label = selectedSegment.querySelector('label');
    label.setAttribute(target, e.target.value);
    redraw(label);
});


document.getElementById('btnMoveLeft').addEventListener('click', function(e) {
    var selectedSegment = getSelectedSegment();
    if (!selectedSegment) return;
    var previousBlock = selectedSegment.previousElementSibling;
    if (previousBlock) selectedSegment.parentNode.insertBefore(selectedSegment, previousBlock);
});


document.getElementById('btnMoveRight').addEventListener('click', function(e) {
    var selectedSegment = getSelectedSegment();
    if (!selectedSegment) return;
    var nextBlock = selectedSegment.nextElementSibling;
    if (nextBlock) selectedSegment.parentNode.insertBefore(nextBlock, selectedSegment);
});


document.getElementById('btnDelete').addEventListener('click', function(e) {
    var selectedSegment = getSelectedSegment();
    if (!selectedSegment) return;
    var previousBlock = selectedSegment.previousElementSibling;
    var nextBlock = selectedSegment.nextElementSibling;
    selectedSegment.parentNode.removeChild(selectedSegment);
    if (nextBlock) {
        nextBlock.querySelector('input[type=radio]').checked = true;
        loadSegment(nextBlock.getAttribute('data-id'));
    }
    else if (previousBlock) {
        previousBlock.querySelector('input[type=radio]').checked = true;
        loadSegment(previousBlock.getAttribute('data-id'));
    } else {
        loadNoSegment();
    }
});


document.getElementById('btnSaveZwoFile').addEventListener('click', function() {
    var xml = createXmlString();
    var blob = new Blob([xml], {type: "application/xml"});
    var fileName = getName().replace(/[^A-Z0-9]/ig, '_') + '.zwo';;
    saveAs(blob, fileName);
});


document.getElementById('btnCreateLink').addEventListener('click', function() {
    var qs = createQueryString();
    var url = [location.protocol, '//', location.host, location.pathname, qs].join('');
    var a = document.createElement('a');
    a.href = url;
    a.setAttribute('class', 'transparent');
    a.innerText = getName();
    var div = document.getElementById('divLinks');
    div.insertBefore(a, div.firstChild);
    window.setTimeout(function() { a.classList.add('opaque'); }, 15);
});


document.getElementById('divSegmentChart').addEventListener('change', function(e) {
    loadSegment(e.target.id);
});


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
     var name = document.getElementById('txtName').value;
     var now = new Date();
     if (!name) {
         name = 'New-Workout-' 
            + now.getFullYear() + '-' 
            + (1 + now.getMonth()) + '-' 
            + now.getDate() + '-' 
            + now.getHours() + '-' 
            + now.getMinutes() + '-' 
            + now.getSeconds();
     }
     return name;
}


function addSegment(sourceElement) {
    var id = 'x' + createGuid();
    var clone = sourceElement.querySelector('div').cloneNode(true);
    clone.setAttribute('data-id', id);
    clone.removeAttribute('style');

    var input = clone.querySelector('input');
    input.setAttribute('id', id);
    input.checked = true;

    var label = clone.querySelector('label');
    label.setAttribute('for', id);

    document.getElementById('divSegmentChart').appendChild(clone);
    clone.scrollIntoView();
    loadSegment(id);
    redraw(label);
}


function getSelectedSegment() {
    var selectedSegment = document.querySelector('#divSegmentChart input:checked');
    if (!selectedSegment) return null;
    return document.querySelector('div[data-id="' + selectedSegment.id + '"]');
}


function loadSegment(segmentId) {
    var txtR = document.querySelector('#txtR');
    var txtD1 = document.querySelector('#txtD1');
    var txtP1 = document.querySelector('#txtP1');
    var txtD2 = document.querySelector('#txtD2');
    var txtP2 = document.querySelector('#txtP2');
    var selectedSegment = document.querySelector('div[data-id="' + segmentId + '"] label');
    var repeat = selectedSegment.getAttribute('data-r');
    var duration1 = selectedSegment.getAttribute('data-d-1');
    var power1 = selectedSegment.getAttribute('data-p-1');
    var duration2 = selectedSegment.getAttribute('data-d-2');
    var power2 = selectedSegment.getAttribute('data-p-2');
    
    if (repeat) { txtR.value = repeat; txtR.removeAttribute('disabled'); } else { txtR.value = ''; txtR.setAttribute('disabled', true); }
    if (duration1) { txtD1.value = duration1; txtD1.removeAttribute('disabled'); } else { txtD1.value = ''; txtD1.setAttribute('disabled', true); }
    if (power1) { txtP1.value = power1; txtP1.removeAttribute('disabled'); } else { txtP1.value = ''; txtP1.setAttribute('disabled', true); }
    if (duration2) { txtD2.value = duration2; txtD2.removeAttribute('disabled'); } else { txtD2.value = ''; txtD2.setAttribute('disabled', true); }
    if (power2) { txtP2.value = power2; txtP2.removeAttribute('disabled'); } else { txtP2.value = ''; txtP2.setAttribute('disabled', true); }
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



function redraw(labelElement) {
    var t = labelElement.getAttribute('data-t');

    if (t == 'i') redrawIntervals(labelElement);
    else if (t == 'f') redrawFreeRide(labelElement);
    else redrawSinglePolygon(labelElement);
}


function redrawIntervals(labelElement) {
    var d1 = getIntOrDefault(labelElement.getAttribute('data-d-1'), 5);
    var d2 = getIntOrDefault(labelElement.getAttribute('data-d-2'), 5);
    var p1 = getIntOrDefault(labelElement.getAttribute('data-p-1'), 5);
    var p2 = getIntOrDefault(labelElement.getAttribute('data-p-2'), 5);
    var r = getIntOrDefault(labelElement.getAttribute('data-r'), 1);
    var width1 = Math.floor(d1/horizSecondsPerPixel);
    var width2 = Math.floor(d2/horizSecondsPerPixel);

    while (labelElement.querySelectorAll('svg').length > 2)
        labelElement.removeChild(labelElement.lastChild);

    var svg1 = labelElement.querySelector('svg:first-child');
    svg1.setAttribute('width', width1);
    redrawPath(svg1.querySelector('path'), 's', p1, p1, width1);
    var svg2 = labelElement.querySelector('svg:nth-child(2)');
    svg2.setAttribute('width', width2);
    redrawPath(svg2.querySelector('path'), 's', p2, p2, width2);

    for (var i = 1; i < r; i++) {
        labelElement.appendChild(svg1.cloneNode(true));
        labelElement.appendChild(svg2.cloneNode(true));
    }
}


function redrawFreeRide(labelElement) {
    var d1 = getIntOrDefault(labelElement.getAttribute('data-d-1'), 5);
    var width = Math.floor(d1/horizSecondsPerPixel);

    var svg = labelElement.querySelector('svg');
    svg.setAttribute('width', width);

    var path = svg.querySelector('path');
    path.setAttribute('d', 'M 1 220 C ' + (width/3) + ' 175, ' + (width/3*2) + ' 275, ' + width + ' 220 V 300 H 1 Z');
    path.setAttribute('class', 'z1');
}


function redrawSinglePolygon(labelElement) {
    var t = labelElement.getAttribute('data-t');
    var d1 = getIntOrDefault(labelElement.getAttribute('data-d-1'), 5);
    var width = Math.floor(d1/horizSecondsPerPixel);
    var p1 = getIntOrDefault(labelElement.getAttribute('data-p-1'), 5);
    var p2 = labelElement.getAttribute('data-p-2');
    if (!p2) p2 = p1;

    var svg = labelElement.querySelector('svg');
    svg.setAttribute('width', width);

    redrawPath(svg.querySelector('path'), t, p1, p2, width);
}


function redrawPath(pathElement, t, p1, p2, d) {
    pathElement.setAttribute('d', 'M 1 ' + (300 - p1) + ' L ' + d + ' ' + (300 - p2) + ' L ' + d + ' 300 L 1 300 Z');
    if (t == 'w' || t == 'c') {
        pathElement.setAttribute('class', 'z1');
        return;
    }

    if (p1 >= 125) pathElement.setAttribute('class', 'z6');
    else if (p1 >= 100) pathElement.setAttribute('class', 'z5');
    else if (p1 >= 95) pathElement.setAttribute('class', 'z4');
    else if (p1 >= 80) pathElement.setAttribute('class', 'z3');
    else if (p1 >= 65) pathElement.setAttribute('class', 'z2');
    else pathElement.setAttribute('class', 'z1');
}


function createGuid() {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
        var r = Math.random()*16|0, v = c == 'x' ? r : (r&0x3|0x8);
        return v.toString(16);
    });
}


function getIntOrDefault(toParse, minimumDefaultValue) {
    var parsed = parseInt(toParse);
    if (!parsed) return minimumDefaultValue;
    if (parsed < minimumDefaultValue) return minimumDefaultValue;
    return Math.max(parsed, minimumDefaultValue);
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
            return '<SteadyState Duration="' + segment.getAttribute('data-d-1') + '" Power="' + segment.getAttribute('data-p-1') + '"/>';
            break;
        case "w":
            return '<Warmup Duration="' + segment.getAttribute('data-d-1') + '" PowerLow="' + segment.getAttribute('data-p-1') + '" PowerHigh="' + segment.getAttribute('data-p-2') + '"/>';
            break;
        case "c":
            return '<Cooldown Duration="' + segment.getAttribute('data-d-1') + '" PowerLow="' + segment.getAttribute('data-p-1') + '" PowerHigh="' + segment.getAttribute('data-p-2') + '"/>';
            break;
        case "f":
            return '<FreeRide Duration="' + segment.getAttribute('data-d-1') + '" FlatRoad="1" />';
            break;
        case "i":
            return '<IntervalsT Repeat="' + segment.getAttribute('data-r') + '" OnDuration="' + segment.getAttribute('data-d-1') + '" OffDuration="' + segment.getAttribute('data-d-2') + '" OnPower="' + segment.getAttribute('data-p-1') + '" OffPower="' + segment.getAttribute('data-p-2') + '"/>';
            break;
        default:
            break;
    }
}