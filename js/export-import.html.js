(function() {
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