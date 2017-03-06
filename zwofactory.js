
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
    if (!validateInput()) return;
    var xml = createXmlString();
    var blob = new Blob([xml], {type: "application/xml"});
    var fileName = document.getElementById('txtName').value.replace(/[^A-Z0-9]/ig, '_') + '.zwo';
    saveAs(blob, fileName);
});


document.getElementById('btnCreateLink').addEventListener('click', function() {
});


document.getElementById('divSegmentChart').addEventListener('change', function(e) {
    loadSegment(e.target.id);
});


function validateInput() {
    var msg = 'Correct following before saving a file:\r\n';
    var errors = [];
    var name = document.getElementById('txtName').value;
    if (!name) errors.push('Name is required.');

    if (errors.length == 0) return true;

    alert(msg + errors.join('\r\n'));
}


function createXmlString() {
    var name = document.getElementById('txtName').value;
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