var defaultSettings = {
    rememberLinks: true,
    horizSecondsPerPixel: 5,
    links: []
};


function saveSettings(settings) {
    if (localStorage) {
        localStorage.zwofactorySettings = JSON.stringify(settings);
    }
}

function getSettings() {
    if (!localStorage || !localStorage.zwofactorySettings) return defaultSettings;

    var settings = JSON.parse(localStorage.zwofactorySettings);
    
    for (var prop in defaultSettings) {
        if (!settings.hasOwnProperty(prop))
            settings[prop] = defaultSettings[prop];
    }
    return settings;
}