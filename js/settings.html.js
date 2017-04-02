(function() {
    var userSettings;

    document.addEventListener('DOMContentLoaded', function() {
        userSettings = new UserSettings();
        setAllInputValues();
    });


    document.getElementById('btnReloadDefaults').addEventListener('click', function() {
        userSettings = new UserSettings(true);
        setAllInputValues();
    });


    document.getElementById('btnSave').addEventListener('click', function() {
        var checkboxes  = document.querySelectorAll('input[type=checkbox]');
        for (var i = 0; i < checkboxes.length; i++) {
            userSettings[checkboxes[i].getAttribute('data-key')] = checkboxes[i].checked;
        }

        var numInputs = document.querySelectorAll('input[type=number]');
        for (var i = 0; i < numInputs.length; i++) {
            userSettings[numInputs[i].getAttribute('data-key')] = numInputs[i].value;
        }

        userSettings.saveSettings();
        window.location = '/';
    });


    function setAllInputValues() {
        var checkboxes  = document.querySelectorAll('input[type=checkbox]');
        for (var i = 0; i < checkboxes.length; i++) {
            checkboxes[i].checked = userSettings[checkboxes[i].getAttribute('data-key')];
        }

        var numInputs = document.querySelectorAll('input[type=number]');
        for (var i = 0; i < numInputs.length; i++) {
            numInputs[i].value = userSettings[numInputs[i].getAttribute('data-key')];
        }
    }
})();