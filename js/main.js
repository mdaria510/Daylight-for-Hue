//Initialize Objects and variables.
var forecastData = {};
var lights = {};
var transitiontime = 60;

// TODO: Do this programmatically
var allLightsGroup = [1, 3, 5, 6, 7, 8, 9, 10, 11, 12]
var allLightsGroupDefault = [1, 3, 5, 6, 7, 8, 9, 10, 11, 12]
var livingRoomGroup = [1, 3, 5, 6, 11];
var kitchenGroup = [7, 9, 10];
var bathroomGroup = [8, 12];
var nightLightGroup = [1, 3, 7, 8]
var temperatureGroup = [];
var precipitationGroup = [];

var lateNightCutoff = 1320;

var numOfLights = 12;

//Send Request for Forecast Data Immediately Upon Load
fetchForecastData();
setTimeout(refreshWeatherTable, 1000);

//forecast.io

//Initialize Time
var d = new Date(Date.now());


//Initialize Switches
initializeLightAutoControlSwitch();
initializeLightTimeOfDaySwitch();
initializeLightTemperatureSwitch();
initializeLightPrecipitationSwitch();
initializeLightCloudsSwitchl();
initializeAutoForecastFetch();


function getLightState(lightID) {
    hue.getLight(lightID, function(data) {
        currentLightState.on = data.state.on;
        currentLightState.hue = data.state.hue;
        currentLightState.sat = data.state.sat;
        currentLightState.bri = data.state.bri;
        currentLightState.ct = data.state.ct;
    });
}


function swapLightGroup(lightID, originalGroup, newGroup) {
    originalGroup.splice(originalGroup.indexOf(lightID), 1);
    newGroup.push(lightID);

    console.log("Light ID:" + lightID + " swapped from " + originalGroup + " to " + newGroup + ".");
}


function autoControlLights() {

    if (LightTemperatureSwitchEnabled === true) {
        //controlLightByTemperature();
        setTimeout(controlLightByTemperature, 1000);
    }

    if (LightPrecipitationSwitchEnabled === true) {
        //controlLightsByPrecipitation();
        setTimeout(controlLightsByPrecipitation, 2000);
    }

    if (LightCloudsSwitchEnabled === true) {
        //controlLightsByClouds();
        setTimeout(controlLightsByClouds, 3000);
    }

    if (LightTimeOfDaySwitchEnabled === true) {
        setTimeout(controlLightsByDayPhase, 4000);
    }



}


function controlLightsByDayPhase() {

    //Test 
    //forecastData.dayPhase = "night";

    switch (forecastData.dayPhase) {

        case "day":
            //Test
            //forecastData.distanceToMidPointSquared = .8;

            //Amount of warmth to add to daylight
            //182 (5500K) at high noon to 500 at golden hour            
            var dayWarmth = 182 + Math.round(318 * forecastData.distanceToMidPointSquared);

            //lock to 500 for a little while during sunrise/set
            if (forecastData.distanceToMidPointSquared >= .9) {
                dayWarmth = 500;
            }

            for (var i = 0; i < livingRoomGroup.length; i++) {

                hue.setLightState(livingRoomGroup[i], {
                    ct: dayWarmth,
                    bri: 254,
                    transitiontime: transitiontime,
                    on: true
                })

            }

            for (var i = 0; i < kitchenGroup.length; i++) {

                hue.setLightState(kitchenGroup[i], {
                    ct: dayWarmth,
                    bri: 254,
                    transitiontime: transitiontime,
                    on: true
                })

            }

            for (var i = 0; i < bathroomGroup.length; i++) {

                hue.setLightState(bathroomGroup[i], {
                    ct: dayWarmth,
                    bri: 254,
                    transitiontime: transitiontime,
                    on: true
                })

            }



            console.log("ct:" + dayWarmth);
            break;

        case "night":
            //Before 10pm


            //continuously getting warm from neutral (200) at sunset until full warmth (500) at 10pm
            var nightWarmth = Math.round(500 - (lateNightCutoff - getTimeInMinutes()) * (200 / (lateNightCutoff - convertTimestampToMinutes(forecastData.sunsetTime))));

            //continuously getting dimmer from full bright (254) at sunset until min bright (1) at 10pm
            var nightBri = Math.round(1 + ((lateNightCutoff - getTimeInMinutes()) * (200 / (lateNightCutoff - (convertTimestampToMinutes(forecastData.sunsetTime))))));

            for (var i = 0; i < livingRoomGroup.length; i++) {
                hue.setLightState(livingRoomGroup[i], {
                    ct: nightWarmth,
                    bri: nightBri,
                    transitiontime: transitiontime
                })

            }

            //Set kitchen to be dimmer
            for (var i = 0; i < kitchenGroup.length; i++) {
                hue.setLightState(kitchenGroup[i], {
                    ct: nightWarmth,
                    bri: nightBri - 100,
                    transitiontime: transitiontime
                })

            }

            //Set bathroom to be dimmer
            for (var i = 0; i < bathroomGroup.length; i++) {
                hue.setLightState(bathroomGroup[i], {
                    ct: nightWarmth,
                    bri: nightBri - 100,
                    transitiontime: transitiontime
                })

            }
            break;
            //Between 10pm and Midnight    
        case "latenight":
            //after 10pm until midnight, full warmth, minimum brightness
            for (var i = 0; i < allLightsGroup.length; i++) {
                hue.setLightState(allLightsGroup[i], {
                    ct: 500,
                    bri: 1,
                    transitiontime: transitiontime
                })

            }
            break;
            //After midnight, before dawn
        case "midnight":
            //after midnight, nightlightmode
            for (var i = 0; i < numOfLights; i++) {
                if (nightLightGroup.includes(i)) {
                    hue.setLightState(i, {
                        hue: 0,
                        sat: 254,
                        bri: 1,
                        transitiontime: transitiontime,
                        on: true
                    })
                } else {
                    turnLightOff(i);
                }

            }


            break;


    }

    console.log("Auto light control executed.");
}

function controlLightByTemperature() {

    if (forecastData.apparentTemperature > 80) {

        if (temperatureGroup.length === 0) {
            swapLightGroup(6, livingRoomGroup, temperatureGroup);
        }

        //0-100% redness between 80 and 100 degrees
        var satFactor = Math.round(255 - ((95 - forecastData.apparentTemperature) * 17));

        console.log("Temperature Color Saturation: " + satFactor);
        switch (forecastData.dayPhase) {

            case "day":
                for (var i = 0; i < temperatureGroup.length; i++) {
                    hue.setLightState(temperatureGroup[i], {
                        hue: 0,
                        bri: 254,
                        sat: satFactor,
                        transitiontime: transitiontime
                    })

                }
                break;

            case "night":
                //continuously getting dimmer from full bright (254) at sunset until min bright (1) at late night cutoff
                var nightBri = Math.round(1 + ((lateNightCutoff - getTimeInMinutes()) * (200 / (lateNightCutoff - (convertTimestampToMinutes(forecastData.sunsetTime))))));

                for (var i = 0; i < temperatureGroup.length; i++) {
                    hue.setLightState(temperatureGroup[i], {
                        hue: 0,
                        bri: nightBri,
                        sat: satFactor,
                        transitiontime: transitiontime
                    })

                }
                break;

            case "latenight":
                for (var i = 0; i < temperatureGroup.length; i++) {
                    hue.setLightState(temperatureGroup[i], {
                        hue: 0,
                        bri: 1,
                        sat: satFactor,
                        transitiontime: transitiontime
                    })

                }
                break;

            case "midnight":
                break;

        }

        //when switched off, pop it back into the all lights group
        //implement in switch

    } else {
        if (temperatureGroup.length > 0) {

            for (var i = 0; i < temperatureGroup.length; i++) {
                swapLightGroup(temperatureGroup[i], temperatureGroup, livingRoomGroup);
            }
        }

    }
}


function controlLightsByPrecipitation() {

    if (forecastData.precipIntensity > 0) {

        if (precipitationGroup.length === 0) {
            swapLightGroup(3, livingRoomGroup, precipitationGroup);
        }



        //0-100% blueness between 0.4 precipitation
        var satFactor = Math.round(255 - ((0.2 - forecastData.precipIntensity) * 640));

        console.log("Precipitation color saturation: " + satFactor);
        switch (forecastData.dayPhase) {

            case "day":
                for (var i = 0; i < precipitationGroup.length; i++) {
                    hue.setLightState(precipitationGroup[i], {
                        hue: 47000,
                        bri: 254,
                        sat: satFactor,
                        transitiontime: transitiontime
                    })

                }
                break;

            case "night":
                //continuously getting dimmer from full bright (254) at sunset until min bright (1) at late night cutoff
                var nightBri = Math.round(1 + ((lateNightCutoff - getTimeInMinutes()) * (200 / (lateNightCutoff - (convertTimestampToMinutes(forecastData.sunsetTime))))));

                for (var i = 0; i < precipitationGroup.length; i++) {
                    hue.setLightState(precipitationGroup[i], {
                        hue: 47000,
                        bri: nightBri,
                        sat: satFactor,
                        transitiontime: transitiontime
                    })

                }
                break;

            case "latenight":
                for (var i = 0; i < precipitationGroup.length; i++) {
                    hue.setLightState(precipitationGroup[i], {
                        hue: 47000,
                        bri: 1,
                        sat: satFactor,
                        transitiontime: transitiontime
                    })

                }
                break;

            case "midnight":
                break;


        }

        //when switched off, pop it back into the all lights group
        //implement in switch

    } else {
        if (precipitationGroup.length > 0) {

            for (var i = 0; i < precipitationGroup.length; i++) {
                swapLightGroup(precipitationGroup[i], precipitationGroup, livingRoomGroup);
            }
        }
    }
}


function controlLightsByClouds() {
    switch (forecastData.dayPhase) {
        case "day":
            for (var i = 0; i < precipitationGroup.length; i++) {
                hue.setLightState(precipitationGroup[i], {
                    hue: 47000,
                    bri: 254,
                    sat: satFactor,
                    transitiontime: transitiontime
                })

            }
            break;

    }

}
///////////////////////////////////////////////// DATA //////////////////////////////////////////////

//poll bridge for current status of lights
function fetchLightsData() {
    hue.getLights(function(data) {
        lights = data;
        refreshLightsTable();
    });
}

//pull down weather data from APIs
function fetchForecastData() {
    //location
    var latitude = 40.74447;
    var longitude = -73.63562;
    var zipcode = 11501;

    //forecast.io
    var forecastIOAPIKey = '0b2c6cbd3a35293c25b3a0346db259df';
    var forecastIOurl = 'https://api.forecast.io/forecast/';
    console.log("Fetching forecast.io data.");
    $.getJSON(forecastIOurl + forecastIOAPIKey + "/" + latitude + "," + longitude + "?callback=?", function(data) {

        forecastData.summary = data.currently.summary;
        forecastData.icon = data.currently.icon;

        forecastData.temperature = data.currently.temperature;
        forecastData.apparentTemperature = data.currently.apparentTemperature;

        forecastData.precipProbability = data.currently.precipProbability;
        forecastData.precipIntensity = data.currently.precipIntensity;

        forecastData.windSpeed = data.currently.windSpeed;
        forecastData.cloudCover = data.currently.cloudCover;

        forecastData.time = data.currently.time;
        forecastData.sunriseTime = data.daily.data["0"].sunriseTime
        forecastData.sunsetTime = data.daily.data["0"].sunsetTime
    });


    //Weather Underground
    var weatherUndergroundAPIKey = 'ead6eea0ead7ea57';
    var weatherUndergroundurl = 'http://api.wunderground.com/api/';
    var weatherUndergroundRequestType = 'conditions'
    var weatherUndergroundStation = 'pws:KNYROSLY5'
    console.log("Fetching weather underground data.");
    $.ajax({
        url: weatherUndergroundurl + weatherUndergroundAPIKey + "/" + weatherUndergroundRequestType + "/q/" + weatherUndergroundStation + ".json",
        dataType: "jsonp",
        success: function(parsed_json) {
            forecastData.uv = parsed_json.current_observation.UV;
            forecastData.solar = parsed_json.current_observation.solarradiation;
        }
    });

    calculateTimes();
    calculateDayPhase();

    refreshWeatherTable();

}

//calculate relative times that are used for managing light state throughout the day
function calculateTimes() {
    forecastData.lastUpdatedTime = getTime();
    forecastData.minToSunset = Math.round((forecastData.sunsetTime - forecastData.time) / 60);
    forecastData.minToSunrise = Math.round((forecastData.sunriseTime - forecastData.time) / 60);

    forecastData.lengthOfDay = Math.round((forecastData.sunsetTime - forecastData.sunriseTime) / 60);
    forecastData.midDay = Math.round((forecastData.lengthOfDay / 2) + convertTimestampToMinutes(forecastData.sunriseTime));

    forecastData.distanceToMidPoint = Math.abs((((getTimeInMinutes() - convertTimestampToMinutes(forecastData.sunriseTime)) / (forecastData.midDay - convertTimestampToMinutes(forecastData.sunriseTime))) - 1));
    forecastData.distanceToMidPointSquared = Math.pow((((getTimeInMinutes() - convertTimestampToMinutes(forecastData.sunriseTime)) / (forecastData.midDay - convertTimestampToMinutes(forecastData.sunriseTime))) - 1), 4);
}

//Calculate current phase of the day (day/night etc)
function calculateDayPhase() {
    if (getTimeInMinutes() >= lateNightCutoff) {
        forecastData.dayPhase = "latenight";
    } else if (getTimeInMinutes() < convertTimestampToMinutes(forecastData.sunriseTime)) {
        forecastData.dayPhase = "midnight";
    } else if ((forecastData.minToSunrise >= 0) || (forecastData.minToSunset <= -0)) {
        forecastData.dayPhase = "night";
    } else {
        forecastData.dayPhase = "day";
    }

    console.log("Time of Day :" + forecastData.dayPhase);
}



////////////////////////////////////////////////  User Interface  /////////////////////////////////////////////////////////



////////////////////////////////////////////////////////////////
// Tables
///////////////////////////////////////////////////////////////




//Populate and refresh lights table
function refreshLightsTable() {
    fetchLightsData();

    $("#LightsTableBody").empty();
    $("#LightsTableBody").append("<tr><th>ID</th><th>Name</th><th>On?</th><th>CT</th><th>Bri</th><th>Sat</th><th>Hue</th></tr>");

    for (id in lights) {
        $("#LightsTableBody").append("<tr><th>" + id + " </th><th>" + lights[id].name + " </th><th>" + lights[id].state.on + "</th><th>" + lights[id].state.ct + "</th><th>" + lights[id].state.bri + "</th><th>" + lights[id].state.sat + "</th><th>" + lights[id].state.hue + "</th></tr>");
    }
}

//Populate and refresh weather table
function refreshWeatherTable() {
    $("#ForecastTableBody").empty();

    $("#ForecastTableBody").append("<tr><th> Last Updated: </th><th>" + getTime() + " </th>");
    $("#ForecastTableBody").append("<tr><th> Summary: </th><th>" + forecastData.summary + " </th>");
    $("#ForecastTableBody").append("<tr><th> Icon: </th><th>" + forecastData.icon + " </th>");
    $("#ForecastTableBody").append("<tr><th> Temperature: </th><th>" + forecastData.temperature + "&deg; F </th>");
    $("#ForecastTableBody").append("<tr><th> Feels Like: </th><th>" + forecastData.apparentTemperature + "&deg; F </th>");
    $("#ForecastTableBody").append("<tr><th> Precip Chance: </th><th>" + forecastData.precipProbability + "% </th>");
    $("#ForecastTableBody").append("<tr><th> Precip Intensity: </th><th>" + forecastData.precipIntensity + "</th>");
    $("#ForecastTableBody").append("<tr><th> Wind Speed: </th><th>" + forecastData.windSpeed + " </th>");
    $("#ForecastTableBody").append("<tr><th> Cloud Cover: </th><th>" + forecastData.cloudCover + " </th>");
    $("#ForecastTableBody").append("<tr><th> Min To Sunset: </th><th>" + forecastData.minToSunset + " </th>");
    $("#ForecastTableBody").append("<tr><th> Min To Sunrise: </th><th>" + forecastData.minToSunrise + " </th>");
    $("#ForecastTableBody").append("<tr><th> Solar Radiation </th><th>" + forecastData.solar + " </th>");
    $("#ForecastTableBody").append("<tr><th> UV Index: </th><th>" + forecastData.uv + " </th>");
}


////////////////////////////////////////////////////////////////
// Switches
///////////////////////////////////////////////////////////////






//Auto light control switch initialization and switching event handler
var autoLightControlEnabled = true;
var autoLightControlIntervalID;

function initializeLightAutoControlSwitch() {

    $("[name='LightAutoControlSwitch']").bootstrapSwitch();

    $('input[name="LightAutoControlSwitch"]').on('switchChange.bootstrapSwitch', function(event, state) {
        autoLightControlEnabled = state;
        console.log("autoControlEnabled = " + autoLightControlEnabled + " | state = " + state); // true | false

        if (autoLightControlEnabled === true) {
            //update every 5 minutes (300000ms)
            autoControlIntervalID = setInterval(autoControlLights, 30000);
            console.log("Auto Light Control Interval Started.");
            $('input[name="LightTimeOfDaySwitch"]').bootstrapSwitch('toggleDisabled');
            $('input[name="LightTemperatureSwitch"]').bootstrapSwitch('toggleDisabled');
            $('input[name="LightPrecipitationSwitch"]').bootstrapSwitch('toggleDisabled');
            $('input[name="LightCloudsSwitch"]').bootstrapSwitch('toggleDisabled');

        } else {
            clearInterval(autoControlIntervalID);
            console.log("Auto Control Interval Cleared");
            $('input[name="LightTimeOfDaySwitch"]').bootstrapSwitch('toggleDisabled');
            $('input[name="LightTemperatureSwitch"]').bootstrapSwitch('toggleDisabled');
            $('input[name="LightPrecipitationSwitch"]').bootstrapSwitch('toggleDisabled');
            $('input[name="LightCloudsSwitch"]').bootstrapSwitch('toggleDisabled');
        }
    });
}


////Time of Day effect
var LightTimeOfDaySwitchEnabled;

function initializeLightTimeOfDaySwitch() {

    $("[name='LightTimeOfDaySwitch']").bootstrapSwitch();

    $('input[name="LightTimeOfDaySwitch"]').on('switchChange.bootstrapSwitch', function(event, state) {
        LightTimeOfDaySwitchEnabled = state;
        console.log("LightTimeOfDaySwitchEnabled = " + LightTimeOfDaySwitchEnabled + " | state = " + state); // true | false

    });
}



///Temperature effect
var LightTemperatureSwitchEnabled;

function initializeLightTemperatureSwitch() {


    $("[name='LightTemperatureSwitch']").bootstrapSwitch();

    $('input[name="LightTemperatureSwitch"]').on('switchChange.bootstrapSwitch', function(event, state) {
        LightTemperatureSwitchEnabled = state;
        console.log("LightTemperatureSwitchEnabled = " + LightTemperatureSwitchEnabled + " | state = " + state); // true | false




    });
}


////Precipitation Effect
var LightPrecipitationSwitchEnabled;

function initializeLightPrecipitationSwitch() {

    $("[name='LightPrecipitationSwitch']").bootstrapSwitch();

    $('input[name="LightPrecipitationSwitch"]').on('switchChange.bootstrapSwitch', function(event, state) {
        LightPrecipitationSwitchEnabled = state;
        console.log("LightPrecipitationSwitchEnabled = " + LightPrecipitationSwitchEnabled + " | state = " + state); // true | false



    });
}


///Cloud effect
var LightCloudsSwitchEnabled;

function initializeLightCloudsSwitchl() {


    $("[name='LightCloudsSwitch']").bootstrapSwitch();

    $('input[name="LightCloudsSwitch"]').on('switchChange.bootstrapSwitch', function(event, state) {
        LightCloudsSwitchEnabled = state;
        //console.log("autoControlEnabled = " + autoLightControlEnabled + " | state = " + state); // true | false




    });
}



var autoForecastFetchEnabled = true;
//Auto weather fetch switch initialization and switching event handler
function initializeAutoForecastFetch() {

    var fetchForecastDataIntervalID;
    $("[name='AutoForecastFetchSwitch']").bootstrapSwitch();

    $('input[name="AutoForecastFetchSwitch"]').on('switchChange.bootstrapSwitch', function(event, state) {
        autoForecastFetchEnabled = state;
        fetchForecastData();
        console.log("autoForecastFetchEnabled = " + autoForecastFetchEnabled + " | state = " + state); // true | false

        if (autoForecastFetchEnabled === true) {
            //update every 5 minutes (300000ms)
            fetchForecastDataIntervalID = setInterval(fetchForecastData, 300000);
            console.log("Auto fetch forecast interval started.");


        } else {
            clearInterval(fetchForecastDataIntervalID);
            console.log("Auto fetch forecast interval cleared.");
        }
    });
}




//TODO precipitation effect switch

//TODO cloud effect switch

//TODO temp effect switch
//Doing by default now



/////////////////////////////////////////////////////////////////////
//jQuery Handlers
/////////////////////////////////////////////////////////////////////
$(document).ready(function() {
    $("#UpdateWeatherButton").click(function() {
        fetchForecastData();
        return false;
    });

    $("#LightButtonRefresh").click(function() {
        refreshLightsTable(); 
        return false;

    });

    $("#LightButtonOn").click(function() {
        hue.getLights(function(data) {
            for (key in data) {
                hue.setLightState(key, {
                    on: true
                }, function(data) {});
            }
        });

        setTimeout(refreshLightsTable, 500);
        return false;

    });

    $("#LightButtonOff").click(function() {
        hue.getLights(function(data) {
            for (key in data) {
                hue.setLightState(key, {
                    on: false
                }, function(data) {});
            }
        });

        setTimeout(refreshLightsTable, 500);
        return false;

    });

    $("#LightButtonWarm").click(function() {
        hue.getLights(function(data) {
            for (key in data) {
                hue.setLightState(key, {
                    ct: 500
                }, function(data) {});
            }

            setTimeout(refreshLightsTable, 500);
            return false;
        });
    });

    $("#LightButtonCool").click(function() {
        hue.getLights(function(data) {
            for (key in data) {
                hue.setLightState(key, {
                    ct: 153
                }, function(data) {});
            }
        });
        setTimeout(refreshLightsTable, 500);
        return false;
    });


});



////////////////////////////////////  Utility Functions   //////////////////////////////////////////////

/////////////////////////
//Time Helper Functions
////////////////////////

//Get current time in H:M
function getTime() {
    var today = new Date();
    var h = today.getHours();
    var m = today.getMinutes();
    var s = today.getSeconds();

    return (h + ":" + m);

}

//Get current time in minutes elapsed per day
function getTimeInMinutes() {
    var today = new Date();
    var h = today.getHours();
    var m = today.getMinutes();
    var s = today.getSeconds();

    //console.log("Time of day in minutes:" + ((h * 60) + m));
    return ((h * 60) + m);
}

//Convert a unix timestamp to minutes elapsed in the current day
function convertTimestampToMinutes(timestamp) {
    var date = new Date(timestamp * 1000);
    // Hours part from the timestamp
    var h = date.getHours();
    //console.log("hours:" + h);
    // Minutes part from the timestamp
    var m = date.getMinutes();
    //console.log("minutes:" + m);
    //console.log("Timestamp " + timestamp + " converted to: " + ((h * 60) + m) + " minutes of the day.");
    return ((h * 60) + m);
}



/////////////////////////
// Light Helper Functions
////////////////////////

function turnLightOn(lightID) {
    hue.setLightState(lightID, {
        on: true
    });
}

function turnLightOff(lightID) {
    hue.setLightState(lightID, {
        on: false
    });
}

function allLightsOn() {
    hue.getLights(function(data) {
        for (key in data) {
            hue.setLightState(key, {
                on: true
            }, function(data) {});
        }
    });

}

function allLightsOff() {
    hue.getLights(function(data) {
        for (key in data) {
            hue.setLightState(key, {
                on: false
            }, function(data) {});
        }
    });

}


/////////////////////////////   Bridge Management ////////////////////////////////////////////////////
//////////////// WIP


var jshue = jsHue();
/*
hue.discover(
    function(bridges) {
        if(bridges.length === 0) {
            console.log('No bridges found. :(');
        }
        else {
            bridges.forEach(function(b) {
                console.log('Bridge found at IP address %s.', b.internalipaddress);
            });
        }
    },
    function(error) {
        console.error(error.message);
    }
);
*/

var bridge = jshue.bridge('192.168.1.29');

// create user account (requires link button to be pressed)
//bridge.createUser('HueJS', function(data) {
// extract bridge-generated username from returned data
// var username = data[0].success.username;

//  console.log('New username:', username);

// instantiate user object with username
// var user = bridge.user(username);

var hue = bridge.user("QEoIN1BYAaY8UNm3NBZDvZLGsXZ3L9iLuwqeH8gx");

//});


fetchLightsData();  

console.log("Hue Instantiated with user QEoIN1BYAaY8UNm3NBZDvZLGsXZ3L9iLuwqeH8gx ")



/////////////////////////////////////////////////////////////////////////
//--------------------------OLD-------------------------
/*
////////////////////////////////////////////////////////////////////////

function refreshForecastTable(forecastData) {

    console.log("Forecast Table Emptied.");
    $("#ForecastTableBody").empty();

    console.log("Populating Forecast Table Started");
    $("#ForecastTableBody").append("<tr><th> Summary: </th><th>" + forecastData.summary + " </th>");
    $("#ForecastTableBody").append("<tr><th> Icon: </th><th>" + forecastData.icon + " </th>");
    $("#ForecastTableBody").append("<tr><th> Temperature: </th><th>" + forecastData.temperature + "&deg; F </th>");
    $("#ForecastTableBody").append("<tr><th> Feels Like: </th><th>" + forecastData.apparentTemperature + "&deg; F </th>");
    $("#ForecastTableBody").append("<tr><th> Precip Chance: </th><th>" + forecastData.precipProbability + "% </th>");
    $("#ForecastTableBody").append("<tr><th> Precip Summary: </th><th>" + forecastData.precipIntensity + "% </th>");
    $("#ForecastTableBody").append("<tr><th> Wind Speed: </th><th>" + forecastData.windSpeed + " </th>");
    $("#ForecastTableBody").append("<tr><th> Cloud Cover: </th><th>" + forecastData.cloudCover + " </th>");
    console.log("Populating Forecast Table Complete");

}
*/


/*
//Current Forecast Object Constructor
function currentForecastObject(rawobject) {
    this.summary = rawobject.responseJSON.currently.summary;
    this.icon = rawobject.responseJSON.currently.icon;

    this.temperature = rawobject.responseJSON.currently.temperature;
    this.apparentTemperature = rawobject.responseJSON.currently.apparentTemperature;

    this.precipIntensity = rawobject.responseJSON.currently.precipIntensity;
    this.precipProbability = rawobject.responseJSON.currently.precipProbability;

    this.windSpeed = rawobject.responseJSON.currently.windSpeed;
    this.cloudCover = rawobject.responseJSON.currently.cloudCover;

    console.log("Current Forecast Object Created. Current summary/temp: " + this.summary + "/" + this.temperature);
}

function updateCurrentForecastObject(CFObject, rawobject) {
    CFObject.summary = rawobject.responseJSON.currently.summary;
    CFObject.icon = rawobject.responseJSON.currently.icon;

    CFObject.temperature = rawobject.responseJSON.currently.temperature;
    CFObject.apparentTemperature = rawobject.responseJSON.currently.apparentTemperature;

    CFObject.precipIntensity = rawobject.responseJSON.currently.precipIntensity;
    CFObject.precipProbability = rawobject.responseJSON.currently.precipProbability;

    CFObject.windSpeed = rawobject.responseJSON.currently.windSpeed;
    CFObject.cloudCover = rawobject.responseJSON.currently.cloudCover;

    console.log("Current Forecast Object Updated. Current summary/temp: " + this.summary + "/" + this.temperature);
}


/////////////////////////////////////////////////////////////////////////

function allLightsCool() {
    hue.getLights(function(data) {
        for (key in data) {
            hue.setLightState(key, {
                ct: 153
            }, function(data) {});
        }
    });
}

function allLightsWarm() {
   hue.getLights(function(data) {
        for (key in data) {
            hue.setLightState(key, {
                ct: 500
            }, function(data) {});
        }
    });
}





function changeLightColorTemp(lightID, colorTemp, transitiontime) {
    hue.setLightState(lightID, {
        ct: colorTemp,
        transitiontime: transitiontime
    });

    console.log("Light " + lightID + " changed to colortemp " + colorTemp + ".");
}

function changeLightBrightness(lightID, brightness, transitiontime) {
    hue.setLightState(lightID, {
        bri: brightness,
        transitiontime: transitiontime
    });

    console.log("Light " + lightID + " changed to brightness " + brightness + ".");
}

function changeLightHue(lightID, hue, transitiontime) {
    hue.setLightState(lightID, {
        hue: hue,
        transitiontime: transitiontime
    });

    console.log("Light " + lightID + " changed to hue " + hue + ".");
}

function changeLightSaturation(lightID, saturation, transitiontime) {
    hue.setLightState(lightID, {
        sat: saturation,
        transitiontime: transitiontime
    });

    console.log("Light " + lightID + " changed to saturation " + saturation + ".");
}

function changeLightHSB(lightID, hue, saturation, brightness, transitiontime) {
    hue.setLightState(lightID, {
        hue: hue,
        sat: saturation,
        bri: brightness,
        transitiontime: transitiontime
    });

    console.log("Light " + lightID + " changed to hue: " + hue + ", saturation: " + saturation + ", brightness: " + brightness + ".");
}

////////////////////////////////////////////////////////////////////////////




/*
//continuous between ct 350 and ct 500
var sunsetTimeMinutes = convertTimestampToMinutes(forecastData.sunsetTime);
var minutesBetweenSunsetAnd10PM = 1320 - sunsetTimeMinutes;
var warmthUnitsPerMinUntil10PM = 150 / minutesBetweenSunsetAnd10PM;
//console.log("Warmth Units Per Min Until 10pm:" + warmthUnitsPerMinUntil10PM);
var timeUntil10PM = 1320 - getTimeInMinutes();                
var subtractedWarmth = timeUntil10PM * warmthUnitsPerMinUntil10PM;
var warmthValue = 500 - subtractedWarmth;
//console.log("WarmthValue: " + warmthValue);


//continuous between bri 255 and bri 1
var sunsetTimeMinutes = convertTimestampToMinutes(forecastData.sunsetTime);
var minutesBetweenSunsetAnd10PM = 1320 - sunsetTimeMinutes;
var brightnessUnitsPerMinUntil10PM = 254 / minutesBetweenSunsetAnd10PM;
console.log("Brightness Units Per Min Until 10pm:" + brightnessUnitsPerMinUntil10PM);
var timeUntil10PM = 1320 - getTimeInMinutes();     

var addedBrightness = timeUntil10PM * brightnessUnitsPerMinUntil10PM;
var briValue = 1 + addedBrightness;
console.log("briValue: " + briValue);
*/