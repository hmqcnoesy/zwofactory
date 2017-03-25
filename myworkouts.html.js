(function() {
    var userSettings = new UserSettings();

    document.addEventListener('DOMContentLoaded', function() {
        var workouts = userSettings.getAllMyWorkouts();
        var divMyWorkouts = document.getElementById('divMyWorkouts');
        var divToClone = document.getElementById('divToClone');
        for (var i = 0; i < workouts.length; i++) {
            var cloned = divToClone.cloneNode(true);
            cloned.classList.remove('invisible');
            var a = cloned.querySelector('a');
            a.setAttribute('data-name', workouts[i].name);
            a.appendChild(document.createTextNode(workouts[i].name));
            divMyWorkouts.appendChild(cloned);
        }        
    });


    document.getElementById('divMyWorkouts').addEventListener('click', function(e) {
        if (e.target.hasAttribute('data-toggle')) toggleVisibility(e.target);

        var svg;

        if (e.target.tagName.toLowerCase() == 'path') 
            svg = e.target.parentNode;
        else
            svg = e.target;

        var workoutName = svg.parentNode.parentNode.parentNode.querySelector('a').getAttribute('data-name');
        if (svg.hasAttribute('data-edit')) editWorkout(workoutName);
        if (svg.hasAttribute('data-delete')) deleteWorkout(workoutName);
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


    function editWorkout(workoutName) {
        console.log('editing ' + workoutName);
    }


    function deleteWorkout(workoutName) {
        console.log(workoutName + ' deleted');
    }
})();