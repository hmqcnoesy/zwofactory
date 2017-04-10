(function() {
    var userSettings = new UserSettings();
    var workoutTemplates = null;

    document.addEventListener('DOMContentLoaded', function() {
        getWorkoutTemplates(function(workouts) {
            var groups = {};
            for (var i = 0; i < workouts.length; i++) {
                var split = workouts[i].path.split('\\');
                var group = split[0];
                if (!groups.hasOwnProperty(group)) groups[group] = {};
                if (split.length == 2) {
                    groups[split[0]][workouts[i].name] = workouts[i];
                } else if (split.length == 3) {
                    if (!groups[split[0]].hasOwnProperty(split[1])) groups[split[0]][split[1]] = {};
                    groups[split[0]][split[1]][workouts[i].name] = workouts[i];
                }
            }

            workoutTemplates = groups;
            loadWorkoutGroups();   
            if (sessionStorage && sessionStorage.lastSelectedGroupName) {
                var lastSelectedGroupName = sessionStorage.lastSelectedGroupName;
                document.getElementById('selWorkoutGroups').value = lastSelectedGroupName;
                loadGroupMembers(lastSelectedGroupName);
            }
        }, function() {
            alert('Error retrieving workout templates');
        });   
    });


    document.getElementById('divWorkoutTemplates').addEventListener('click', function(e) {
        if (e.target.hasAttribute('data-toggle')) toggleVisibility(e.target);
        if (e.target.hasAttribute('data-clone')) {
            var workoutPath = e.target.parentNode.parentNode.parentNode.getAttribute('data-path');
            var workoutName = e.target.parentNode.parentNode.querySelector('[data-name]').innerText;
            cloneWorkout(workoutPath, workoutName);
        }
        if (e.target.hasAttribute('data-download')) {
            var workoutPath = e.target.parentNode.parentNode.parentNode.getAttribute('data-path');
            var workoutName = e.target.parentNode.parentNode.querySelector('[data-name]').innerText;
            downloadWorkout(workoutPath, workoutName);
        }
    }, true);


    document.getElementById('selWorkoutGroups').addEventListener('change', function() {
        loadGroupMembers(this.value);
        sessionStorage.lastSelectedGroupName = this.value;
    });


    function loadWorkoutGroups() {
        var sel = document.getElementById('selWorkoutGroups');

        for (var group in workoutTemplates) {
            var opt = document.createElement('option');
            opt.innerHTML = group;
            sel.appendChild(opt);
        }
    }


    function loadGroupMembers(groupName) {
        var divWorkoutTemplates = document.getElementById('divWorkoutTemplates');
        var foldersOrWorkouts = workoutTemplates[groupName];
        var divToCloneFolder = document.getElementById('divToCloneFolder');
        var divToCloneWorkout = document.getElementById('divToCloneWorkout');
        
        divWorkoutTemplates.innerHTML = '';

        for (var item in foldersOrWorkouts) {
            if (foldersOrWorkouts[item].path) {
                var cloned = divToCloneWorkout.cloneNode(true);
                cloned.removeAttribute('id');
                cloned.classList.remove('invisible');
                loadWorkout(foldersOrWorkouts[item], cloned);
                divWorkoutTemplates.appendChild(cloned);
            } else {
                var cloned = divToCloneFolder.cloneNode(true);
                cloned.removeAttribute('id');
                cloned.classList.remove('invisible');
                var a = cloned.querySelector('a');
                a.setAttribute('data-group', groupName);
                a.setAttribute('data-folder', item);
                a.appendChild(document.createTextNode(item));
                divWorkoutTemplates.appendChild(cloned);
            }
        }  
    }


    function loadWorkout(workout, targetElement) {
        var realWorkout = new Workout();
        realWorkout.reconstituteFromDeserialized(workout);
        targetElement.setAttribute('data-path', workout.path);
        targetElement.querySelector('[data-name]').appendChild(document.createTextNode(realWorkout.name));
        targetElement.querySelector('[data-duration]').appendChild(document.createTextNode(realWorkout.calculateDuration()));
        targetElement.querySelector('[data-author]').appendChild(document.createTextNode(realWorkout.author));
        targetElement.querySelector('[data-tags]').appendChild(document.createTextNode(realWorkout.tags));
        targetElement.querySelector('[data-description]').appendChild(document.createTextNode(realWorkout.description));
        drawWorkout(realWorkout, targetElement.querySelector('[data-workout]'));
    }


    function drawWorkout(workout, targetElement) {
        var settings = {
            horizSecondsPerPixel: 20, 
            verticalPercentsPerPixel: 3, 
            shapeHeight: 60,
            showCadenceIndicator: false,
            showTextEventIndicator: false,
            minShapeWidth: 3 };
        for (var i = 0; i < workout.segments.length; i++) {
            var svgs = workout.segments[i].toSvgs(settings);
            for (var j = 0; j < svgs.length; j++) {
                targetElement.appendChild(svgs[j]);
            }
        }
    }


    function toggleVisibility(aElement) {
        var div = aElement.parentNode.querySelector('div');
        var group = aElement.getAttribute('data-group');
        var folder = aElement.getAttribute('data-folder');
        var invisible = div.classList.contains('invisible');
        var alreadyBeenLoaded = div.hasAttribute('data-loaded');

        if (alreadyBeenLoaded && invisible) {
            div.classList.remove('invisible');
        } else if (invisible) {
            var divToClone = document.getElementById('divToCloneWorkout');
            var workouts = workoutTemplates[group][folder];
            for (var workoutName in workouts) {
                var cloned = divToClone.cloneNode(true);
                cloned.removeAttribute('id');
                cloned.classList.remove('invisible');
                loadWorkout(workouts[workoutName], cloned);
                div.appendChild(cloned);
            }
            div.classList.remove('invisible');
            div.setAttribute('data-loaded', true);
        } else {
            div.classList.add('invisible');
        }
    }


    function getWorkout(workoutPath, workoutName) {
        var split = workoutPath.split('\\');
        var workout;

        if (split.length == 2) workout = workoutTemplates[split[0]][workoutName];
        else workout = workoutTemplates[split[0]][split[1]][workoutName];
        return workout;
    }


    function cloneWorkout(workoutPath, workoutName) {
        var workout = getWorkout(workoutPath, workoutName);
        for (var i = 0; i < workout.segments.length; i++) {
            workout.segments[i].id = createGuid();
            for (var j = 0; j < workout.segments[i].textEvents.length; j++) {
                workout.segments[i].textEvents[j].id = createGuid();
            }
        }
        userSettings.setWorkoutForEditing(workout);
        window.location = '/';
    }


    function downloadWorkout(workoutPath, workoutName) {
        workout = getWorkout(workoutPath, workoutName);
        var workoutToDownload = new Workout();
        workoutToDownload.reconstituteFromDeserialized(workout);
        var xml = workoutToDownload.toZwoXml();
        var blob = new Blob([xml], {type: "application/octet-stream"});
        var fileName = getName().replace(/[^A-Z0-9]/ig, '_') + '.zwo';;
        saveAs(blob, fileName);
    }


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
        xhr.open('GET', '/js/workouts.json');
        xhr.send();
    }
})();