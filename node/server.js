/*

var ForecastIo = require('forecastio');


var options = {
    units: 'us',
    exclude: 'daily,hourly,flags,darksky-stations,lamp-stations,isd-stations,madis-stations'
};

var forecastIo = new ForecastIo('0b2c6cbd3a35293c25b3a0346db259df');

forecastIo.forecast('40.74447', '-73.63562').then(function(data) {
    console.log(JSON.stringify(data, null, 2));
});

*/

function b() {

    var apiKey = '0b2c6cbd3a35293c25b3a0346db259df';
    var url = 'https://api.forecast.io/forecast/';
    var lati = 40.74447;
    var longi = -73.63562;
    var data;

    $.getJSON(url + apiKey + "/" + lati + "," + longi + "?callback=?", function(data) {
        $('#weather').innerHTML('and the weather is: ' + data[4].temperature);
    });
}