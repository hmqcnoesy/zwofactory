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
});


document.getElementById('divControls').addEventListener('click', function(e) {
    if (e.target.tagName == 'BUTTON') addSegment(e.target);
});


document.getElementById('divSegmentChart').addEventListener('click', function(e) {
    if (e.target.tagName != 'INPUT') return;
    loadSegment(e.target.getAttribute('id'));
});


document.getElementById('divSegmentInputs').addEventListener('input', function() {
    redrawSelectedSegment();
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
    if (previousBlock && !nextBlock) {
        previousBlock.querySelector('input[type=radio]').checked = true;
        loadSegment(previousBlock.getAttribute('data-id'));
    }
    else if (nextBlock) {
        nextBlock.querySelector('input[type=radio]').checked = true;
        loadSegment(nextBlock.getAttribute('data-id'));
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
        var hiddenButton = document.getElementById('btnHidden' + pieces[0]);
        var div = hiddenButton.querySelector('div');
        switch(pieces[0]) {
            case "S":
                if (isNumeric(pieces[1])) div.setAttribute('data-ftp', parseFloat(pieces[1]));
                if (isNumeric(pieces[2])) div.setAttribute('data-duration', parseFloat(pieces[2]));
                hiddenButton.click();
                break;
            case "W":
            case "C":
                if (isNumeric(pieces[1])) div.setAttribute('data-ftp', parseFloat(pieces[1]));
                if (isNumeric(pieces[2])) div.setAttribute('data-duration', parseFloat(pieces[2]));
                if (isNumeric(pieces[3])) div.setAttribute('data-ftp-2', parseFloat(pieces[3]));
                hiddenButton.click();
                break;
            case "F":
                if (isNumeric(pieces[1])) div.setAttribute('data-duration', parseFloat(pieces[1]));
                hiddenButton.click();
                break;
            case "I":
                if (isNumeric(pieces[1])) div.setAttribute('data-ftp', parseFloat(pieces[1]));
                if (isNumeric(pieces[2])) div.setAttribute('data-duration', parseFloat(pieces[2]));
                if (isNumeric(pieces[3])) div.setAttribute('data-ftp-2', parseFloat(pieces[3]));
                if (isNumeric(pieces[4])) div.setAttribute('data-duration-2', parseFloat(pieces[4]));
                if (isNumeric(pieces[5])) div.setAttribute('data-repeat', parseInt(pieces[5]));
                hiddenButton.click();
                break;
        }
    }

    document.querySelector('#divSegmentChart > div:first-child > label').click();
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

function selectText(element) {
    if (document.body.createTextRange) {
        range = document.body.createTextRange();
        range.moveToElementText(element);
        range.select();
    } else if (window.getSelection) {
        selection = window.getSelection();        
        var range = document.createRange();
        range.selectNodeContents(element);
        selection.removeAllRanges();
        selection.addRange(range);
    }
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
        xml += '        ' + createWorkoutElement(segments[i]) + '\r\n';
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
        qs += segments[i].getAttribute('data-segment-type').charAt(0) + '-';
        qs += getQsParamAttributeIfExists(segments[i], 'data-ftp');
        qs += getQsParamAttributeIfExists(segments[i], 'data-duration');
        qs += getQsParamAttributeIfExists(segments[i], 'data-ftp-2');
        qs += getQsParamAttributeIfExists(segments[i], 'data-duration-2');
        qs += getQsParamAttributeIfExists(segments[i], 'data-repeat');
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
    switch(segment.getAttribute('data-segment-type')) {
        case "SteadyState":
            return '<SteadyState Duration="' + segment.getAttribute('data-duration') + '" Power="' + segment.getAttribute('data-ftp') + '"/>';
            break;
        case "Warmup":
            return '<Warmup Duration="' + segment.getAttribute('data-duration') + '" PowerLow="' + segment.getAttribute('data-ftp') + '" PowerHigh="' + segment.getAttribute('data-ftp-2') + '"/>';
            break;
        case "Cooldown":
            return '<Cooldown Duration="' + segment.getAttribute('data-duration') + '" PowerLow="' + segment.getAttribute('data-ftp') + '" PowerHigh="' + segment.getAttribute('data-ftp-2') + '"/>';
            break;
        case "FreeRide":
            return '<FreeRide Duration="' + segment.getAttribute('data-duration') + '" FlatRoad="1" />';
            break;
        case "IntervalsT":
            return '<IntervalsT Repeat="' + segment.getAttribute('data-repeat') + '" OnDuration="' + segment.getAttribute('data-duration') + '" OffDuration="' + segment.getAttribute('data-duration-2') + '" OnPower="' + segment.getAttribute('data-ftp') + '" OffPower="' + segment.getAttribute('data-ftp-2') + '"/>';
            break;
        default:
            break;
    }
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
    redrawSelectedSegment();
}


function getSelectedSegment() {
    var selectedSegment = document.querySelector('#divSegmentChart input:checked');
    if (!selectedSegment) return null;
    return document.querySelector('div[data-id="' + selectedSegment.id + '"]');
}


function loadSegment(segmentId) {
    var txtRepeat = document.querySelector('#txtRepeat');
    var txtDuration1 = document.querySelector('#txtDuration1');
    var txtFtp1 = document.querySelector('#txtFtp1');
    var txtDuration2 = document.querySelector('#txtDuration2');
    var txtFtp2 = document.querySelector('#txtFtp2');
    var selectedSegment = document.querySelector('div[data-id="' + segmentId + '"]');
    var inputsToEnable = selectedSegment.getAttribute('data-enable').split(' ');
    var repeat = selectedSegment.getAttribute('data-repeat');
    var duration1 = selectedSegment.getAttribute('data-duration');
    var ftp1 = selectedSegment.getAttribute('data-ftp');
    var duration2 = selectedSegment.getAttribute('data-duration-2');
    var ftp2 = selectedSegment.getAttribute('data-ftp-2');
    
    if (inputsToEnable.indexOf('txtRepeat') != -1) { txtRepeat.value = repeat; txtRepeat.removeAttribute('disabled'); } else { txtRepeat.value = ''; txtRepeat.setAttribute('disabled', true); }
    if (inputsToEnable.indexOf('txtDuration1') != -1) { txtDuration1.value = duration1; txtDuration1.removeAttribute('disabled'); } else { txtDuration1.value = ''; txtDuration1.setAttribute('disabled', true); }
    if (inputsToEnable.indexOf('txtFtp1') != -1) { txtFtp1.value = ftp1; txtFtp1.removeAttribute('disabled'); } else { txtFtp1.value = ''; txtFtp1.setAttribute('disabled', true); }
    if (inputsToEnable.indexOf('txtDuration2') != -1) { txtDuration2.value = duration2; txtDuration2.removeAttribute('disabled'); } else { txtDuration2.value = ''; txtDuration2.setAttribute('disabled', true); }
    if (inputsToEnable.indexOf('txtFtp2') != -1) { txtFtp2.value = ftp2; txtFtp2.removeAttribute('disabled'); } else { txtFtp2.value = ''; txtFtp2.setAttribute('disabled', true); }
}


function loadNoSegment() {
    var txtRepeat = document.querySelector('#txtRepeat');
    txtRepeat.value = ''; 
    txtRepeat.setAttribute('disabled', true);
    var txtDuration1 = document.querySelector('#txtDuration1');
    txtDuration1.value = ''; 
    txtDuration1.setAttribute('disabled', true);
    var txtFtp1 = document.querySelector('#txtFtp1');
    txtFtp1.value = ''; 
    txtFtp1.setAttribute('disabled', true);
    var txtDuration2 = document.querySelector('#txtDuration2');
    txtDuration2.value = ''; 
    txtDuration2.setAttribute('disabled', true);
    var txtFtp2 = document.querySelector('#txtFtp2');
    txtFtp2.value = ''; 
    txtFtp2.setAttribute('disabled', true);
}


function redrawSelectedSegment() {
    var selectedSegment = getSelectedSegment();

    switch (selectedSegment.getAttribute('data-segment-type')) {
        case "SteadyState":
            redrawSegmentSteadyState(selectedSegment);
            break;
        case "Warmup":
        case "Cooldown":
            redrawSegmentRamp(selectedSegment);
            break;
        case "FreeRide":
            redrawSegmentFreeRide(selectedSegment);
            break;
        case "IntervalsT":
            redrawSegmentIntervalsT(selectedSegment);
            break;
        default:
            break;
    }
}


function redrawSegmentSteadyState(segment) {
    var ftp1 = getNumericInput('txtFtp1', 5);
    var duration1 = getNumericInput('txtDuration1', 1); 

    segment.setAttribute('data-ftp', ftp1);
    segment.setAttribute('data-duration', duration1);

    var divToRedrawWidth = segment.querySelector('label > div > div');
    var newWidth = Math.max(Math.floor(duration1 / 6), 10);
    divToRedrawWidth.setAttribute('style', 'width: ' + newWidth + 'px;');
    reclassifyBlockZone(divToRedrawWidth, ftp1);

    var divToRepad = segment.querySelector('label > div');
    var newPadding = Math.max(Math.floor(300 - Math.min(ftp1, 300)), 0);
    divToRepad.setAttribute('style', 'padding-top: ' + newPadding + 'px');
}


function redrawSegmentRamp(segment) {
    var ftp1 = getNumericInput('txtFtp1', 5);
    var duration1 = getNumericInput('txtDuration1', 1);
    var ftp2 = getNumericInput('txtFtp2', 5);

    segment.setAttribute('data-ftp', ftp1);
    segment.setAttribute('data-duration', duration1);
    segment.setAttribute('data-ftp-2', ftp2);
    
    var divToRedrawWidth = segment.querySelector('label > div > div');
    var newWidth = Math.max(Math.floor(duration1 / 6), 10);
    divToRedrawWidth.setAttribute('style', 'width: ' + newWidth + 'px;');

    var divToRepad = segment.querySelector('label > div');
    var newPadding = Math.max(Math.floor(300 - Math.min(Math.max(ftp1, ftp2), 300)), 0);
    divToRepad.setAttribute('style', 'padding-top: ' + newPadding + 'px');
}


function redrawSegmentFreeRide(segment) {
    var duration1 = getNumericInput('txtDuration1', 1);

    segment.setAttribute('data-duration', duration1);
    
    var divToRedrawWidth = segment.querySelector('label > div > div');
    var newWidth = Math.max(Math.floor(duration1 / 6), 10);
    divToRedrawWidth.setAttribute('style', 'width: ' + newWidth + 'px;');

    var divToRepad = segment.querySelector('label > div');
    divToRepad.setAttribute('style', 'padding-top: 200px');
}


function redrawSegmentIntervalsT(segment) {
    var ftp1 = getNumericInput('txtFtp1', 5);
    var duration1 = getNumericInput('txtDuration1', 1);
    var ftp2 = getNumericInput('txtFtp2', 5);
    var duration2 = getNumericInput('txtDuration2', 1);
    var repeat = getNumericInput('txtRepeat', 1);

    segment.setAttribute('data-ftp', ftp1);
    segment.setAttribute('data-duration', duration1);
    segment.setAttribute('data-ftp-2', ftp2);
    segment.setAttribute('data-duration-2', duration2);
    segment.setAttribute('data-repeat', repeat);

    var divsToRedrawWidth1 = segment.querySelectorAll('label > div:nth-child(odd) > div');
    var divsToRedrawWidth2 = segment.querySelectorAll('label > div:nth-child(even) > div');
    var newWidth1 = Math.max(Math.floor(duration1 / 6), 10);
    var newWidth2 = Math.max(Math.floor(duration2 / 6), 10);
    for (var i = 0; i < divsToRedrawWidth1.length; i++) {
        divsToRedrawWidth1[i].setAttribute('style', 'width: ' + newWidth1 + 'px;');
    }

    for (var i = 0; i < divsToRedrawWidth2.length; i++) {
        divsToRedrawWidth2[i].setAttribute('style', 'width: ' + newWidth2 + 'px;');
    }

    var divsToRepad1 = segment.querySelectorAll('label > div:nth-child(odd)');
    var divsToRepad2 = segment.querySelectorAll('label > div:nth-child(even)');
    var newPadding1 = Math.max(Math.floor(300 - Math.min(ftp1, 300)), 0);
    var newPadding2 = Math.max(Math.floor(300 - Math.min(ftp2, 300)), 0);
    for (var i = 0; i < divsToRepad1.length; i++) {
        divsToRepad1[i].setAttribute('style', 'padding-top: ' + newPadding1 + 'px');
        reclassifyBlockZone(divsToRepad1[i].childNodes[0], ftp1);
    }
    for (var i = 0; i < divsToRepad2.length; i++) {
        divsToRepad2[i].setAttribute('style', 'padding-top: ' + newPadding2 + 'px');
        reclassifyBlockZone(divsToRepad2[i].childNodes[0], ftp2);
    }

    var displayedCount = segment.querySelectorAll('label > div').length / 2;
    var difference = displayedCount - repeat;
    if (difference === 0) return;

    var label = segment.querySelector('label');
    for (var i = 0; i < difference; i++) {
        label.removeChild(label.lastChild);
        label.removeChild(label.lastChild);
    }
    for (var i = 0; i > difference; i--) {
        label.appendChild(label.lastChild.previousSibling.cloneNode(true));
        label.appendChild(label.lastChild.previousSibling.cloneNode(true));
    }
    
}


function reclassifyBlockZone(element, ftp) {
    var newClass = 'z1';
    if (ftp >= 125) newClass = 'z6';
    else if (ftp >= 100) newClass = 'z5';
    else if (ftp >= 95) newClass = 'z4';
    else if (ftp >= 80) newClass = 'z3';
    else if (ftp >= 65) newClass = 'z2';

    element.classList = newClass;
}


function createGuid() {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
        var r = Math.random()*16|0, v = c == 'x' ? r : (r&0x3|0x8);
        return v.toString(16);
    });
}


function getNumericInput(elementId, minimumDefaultValue) {
    var strVal = document.getElementById(elementId).value;
    var intVal = parseInt(strVal);
    if (!intVal) return minimumDefaultValue;

    return Math.max(intVal, minimumDefaultValue);
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