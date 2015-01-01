$(document).ready(function() {
    $('#msg').keypress(function(k) {
        var keyCode = k.which;
        if (keyCode == 13) { //enter
            var date = new Date();
            var timestamp = date.toLocaleTimeString();
            var data = "<br>" + timestamp + " - " + $(this).val() + "<br>";
            localStorage[timestamp] = data;
            $('#news').prepend(localStorage[timestamp]);
            $(this).val('');
        }
    });
});

function update() {
    for (key in localStorage) {
        $('#news').prepend(localStorage[key]);
    }
}
