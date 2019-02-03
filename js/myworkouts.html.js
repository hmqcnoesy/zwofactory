(function() {
    var userSettings = new UserSettings();

    document.addEventListener('DOMContentLoaded', function() {
        var workouts = userSettings.getAllMyWorkouts().sort(function(a,b) {
            if (a.modifiedOn < b.modifiedOn) return 1;
            if (a.modifiedOn > b.modifiedOn) return -1;
            if (a.modifiedOn == b.modifiedOn) return 0;
        });
        var divMyWorkouts = document.getElementById('divMyWorkouts');
        var divToClone = document.getElementById('divToClone');
        for (var i = 0; i < workouts.length; i++) {
            var cloned = divToClone.cloneNode(true);
            cloned.removeAttribute('id');
            cloned.classList.remove('invisible');
            var a = cloned.querySelector('a');
            a.setAttribute('data-name', workouts[i].name);
            a.appendChild(document.createTextNode(workouts[i].name));
            divMyWorkouts.appendChild(cloned);
        }        
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
            var savedWorkout = userSettings.getMyWorkout(aElement.getAttribute('data-name'));
            if (!savedWorkout) return;
            var workout = new Workout();
            workout.reconstituteFromDeserialized(savedWorkout);
            div.querySelector('[data-duration]').innerHTML = '';
            div.querySelector('[data-duration]').appendChild(document.createTextNode(workout.calculateDuration()));
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


    function editWorkout(workoutName) {
        var workout = userSettings.getMyWorkout(workoutName);
        userSettings.setWorkoutForEditing(workout);
        window.location = '/';
    }


    function deleteWorkout(workoutName) {
        if (!confirm('Are you sure you want to permanently delete "' + workoutName + '"?')) return;
        
        userSettings.deleteWorkout(workoutName);
        var elementToRemove = document.querySelector('[data-name="' + workoutName + '"]').parentNode;
        elementToRemove.parentNode.removeChild(elementToRemove);
    }


    function downloadWorkout(workoutName) {
        var workout = new Workout();
        workout.reconstituteFromDeserialized(userSettings.getMyWorkout(workoutName));
        var xml = workout.toZwoXml();
        var blob = new Blob([xml], {type: "application/octet-stream"});
        var fileName = getName().replace(/[^A-Z0-9]/ig, '_') + '.zwo';;
        saveAs(blob, fileName);
    }
    
    document.getElementById('btnExport').addEventListener('click', function() {
        var myWorkouts = { };
        if (localStorage["myWorkoutInfo"]) myWorkouts.myWorkoutInfo = JSON.parse(localStorage["myWorkoutInfo"]);
        for (var key in localStorage) {
            if (key.indexOf("workout:") != 0) continue;

            myWorkouts[key] = JSON.parse(localStorage[key]);
        }

        var blob = new Blob([JSON.stringify(myWorkouts)], {type: "application/octet-stream"});
        var fileName = 'zwofactory.com My Workouts.json';
        saveAs(blob, fileName);
    });

    document.getElementById('inputFile').addEventListener('change', function(e) {
        var userSettings = new UserSettings();
        var files = e.target.files; 
        if (files.length != 1) return;

        var reader = new FileReader();
        reader.onload = function(event) {
            var json = event.target.result;
            var data = JSON.parse(json);
            for (var i = 0; i < data.myWorkoutInfo.length; i++) {
                userSettings.saveMyWorkout(data["workout:" + data.myWorkoutInfo[i].name]);
            }
            window.location = '/myworkouts';
        };
        reader.readAsText(files[0]);
    }, false);

    document.getElementById('btnImport').addEventListener('click', function() {
        document.getElementById('inputFile').click();
    });
})();