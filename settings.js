function UserSettings() {
    this.rememberLinks = true;
    this.horizSecondsPerPixel = 5;
    this.shapeHeight = 300;
    this.minShapeWidth = 3;
    this.verticalPercentsPerPixel = 1;
    this.showCadenceIndicator = true;
    this.showTextEventIndicator = true;
    this.links = [];

    if (localStorage && localStorage.zwofactorySettings) {
        var savedSettings = JSON.parse(localStorage.zwofactorySettings);
        
        for (var prop in savedSettings) {
            this[prop] = savedSettings[prop];
        }
    }
}


UserSettings.prototype.saveSettings = function() {
    if (!localStorage) return;
    localStorage.zwofactorySettings = JSON.stringify(settings);
}


UserSettings.prototype.getMyWorkout = function(name) {
    var storageName = 'workout:' + name;
    if (localStorage && localStorage[storageName]) return JSON.parse(localStorage[storageName]);
    return null;
}


UserSettings.prototype.getAllMyWorkouts = function() {
    if (!localStorage) return null;
    if (!localStorage.myWorkoutInfo) return [];
    return JSON.parse(localStorage.myWorkoutInfo);
}


UserSettings.prototype.saveMyWorkout = function(workout) {
    if (!localStorage) return;
    var now = new Date();
    var allWorkoutsInfo = this.getAllMyWorkouts();
    var thisWorkoutInfo = allWorkoutsInfo.find(w => w.name == workout.name);

    if (thisWorkoutInfo) {
        thisWorkoutInfo.modifiedOn = now;
    } else {
        thisWorkoutInfo = { name: workout.name, modifiedOn: now};
        allWorkoutsInfo.push(thisWorkoutInfo);
    }
    
    localStorage.myWorkoutInfo = JSON.stringify(allWorkoutsInfo);
    localStorage['workout:' + workout.name] = JSON.stringify(workout);
}