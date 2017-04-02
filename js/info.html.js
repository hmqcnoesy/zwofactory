(function() {

    document.getElementById('divMain').addEventListener('click', function(e) {
        if (e.target.hasAttribute('data-toggle')) toggleVisibility(e.target);
    });


    function toggleVisibility(aElement) {
        var p = aElement.parentNode.querySelector('p');
        var invisible = p.classList.contains('invisible');

        if (invisible) {
            p.classList.remove('invisible');
        } else {
            p.classList.add('invisible');
        }
    }
})();