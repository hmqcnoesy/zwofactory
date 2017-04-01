(function() {
    var userSettings = new UserSettings();

    document.addEventListener('DOMContentLoaded', function() {
        var workouts = getWorkoutTemplates(function(workouts) {
            var divWorkoutTemplates = document.getElementById('divWorkoutTemplates');
            var divToClone = document.getElementById('divToClone');
            for (var i = 0; i < workouts.length; i++) {
                var cloned = divToClone.cloneNode(true);
                cloned.removeAttribute('id');
                cloned.classList.remove('invisible');
                var a = cloned.querySelector('a');
                a.setAttribute('data-path', workouts[i].path);
                a.appendChild(document.createTextNode(workouts[i].path));
                divWorkoutTemplates.appendChild(cloned);
            }     
        }, function() {
            alert('Error retrieving workout templates');
        });   
    });


    document.getElementById('divMyWorkouts').addEventListener('click', function(e) {
        if (e.target.hasAttribute('data-toggle')) toggleVisibility(e.target);

        var workoutName = e.target.parentNode.parentNode.parentNode.querySelector('a').getAttribute('data-name');
        if (e.target.hasAttribute('data-edit')) editWorkout(workoutName);
        if (e.target.hasAttribute('data-download')) downloadWorkout(workoutName);
        if (e.target.hasAttribute('data-delete')) deleteWorkout(workoutName);
    }, true);


    function drawWorkout(targetElement, workout) {
        var w = new Workout();
        var settings = {
            horizSecondsPerPixel: 20, 
            verticalPercentsPerPixel: 3, 
            shapeHeight: 60,
            showCadenceIndicator: false,
            showTextEventIndicator: false,
            minShapeWidth: 3 };
        w.reconstituteFromDeserialized(workout);
        for (var i = 0; i < w.segments.length; i++) {
            var svgs = w.segments[i].toSvgs(settings);
            for (var j = 0; j < svgs.length; j++) {
                targetElement.appendChild(svgs[j]);
            }
        }
    }


    function toggleVisibility(aElement) {
        var div = aElement.parentNode.querySelector('div');
        var invisible = div.classList.contains('invisible');

        if (invisible) {
            var workout = userSettings.getMyWorkout(aElement.getAttribute('data-name'));
            if (!workout) return;
            div.querySelector('[data-tags]').innerHTML = '';
            div.querySelector('[data-tags]').appendChild(document.createTextNode(workout.tags));
            div.querySelector('[data-author]').innerHTML = '';
            div.querySelector('[data-author]').appendChild(document.createTextNode(workout.author));
            div.querySelector('[data-description]').innerHTML = '';
            div.querySelector('[data-description]').appendChild(document.createTextNode(workout.description));
            div.querySelector('[data-workout]').innerHTML = '';
            div.classList.remove('invisible');
            drawWorkout(div.querySelector('[data-workout]'), workout);
        } else {
            div.classList.add('invisible');
        }
    }


    function cloneWorkout(workoutName) {
        userSettings.setWorkoutForEditing(workoutName);
        window.location = 'index.html';
    }


    function downloadWorkout(workoutName) {
        var workout = new Workout();
        workout.reconstituteFromDeserialized(userSettings.getMyWorkout(workoutName));
        var xml = workout.toZwoXml();
        var blob = new Blob([xml], {type: "application/xml"});
        var fileName = getName().replace(/[^A-Z0-9]/ig, '_') + '.zwo';;
        saveAs(blob, fileName);
    }  document.getElementById("ajaxButton").onclick = function() { makeRequest('test.html'); };

    function getWorkoutTemplates(callback, error) {
        xhr = new XMLHttpRequest();

        xhr.onreadystatechange = function() {
            if (xhr.readyState === XMLHttpRequest.DONE) {
                if (xhr.status === 200) {
                    callback(JSON.parse(xhr.responseText));
                } else {
                    error();
                }
            }
        };
        xhr.open('GET', 'workouts.json');
        xhr.send();
    }
})();