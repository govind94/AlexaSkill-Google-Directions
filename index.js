'use strict';
var Alexa = require("alexa-sdk");
var appId = 'amzn1.ask.skill.ce19d66c-b1d2-40b9-987a-ea1c13916b14'; //'amzn1.echo-sdk-ams.app.your-skill-id';
var https = require('https');
var apiKey = 'AIzaSyDBuY63041R_cpalQykTqpuFRvm_zz1EKA';
var alexa;

exports.handler = function(event, context, callback) {
    alexa = Alexa.handler(event, context);
    alexa.appId = appId;
    //alexa.dynamoDBTableName = 'highLowGuessUsers';
    alexa.registerHandlers(newSessionHandlers, drivingModeHandlers, transitModeHandlers, findModeHandlers, startModeHandlers); //, guessAttemptHandlers);
    alexa.execute();
};

var states = {
    DRIVINGMODE: '_DRIVINGMODE',
    TRANSITMODE: '_TRANSITMODE',
    FINDMODE: '_FINDMODE',
    STARTMODE: '_STARTMODE'
};

var newSessionHandlers = {
    'NewSession': function() {
       /* if(Object.keys(this.attributes).length === 0) {
            this.attributes['endedSessionCount'] = 0;
            this.attributes['gamesPlayed'] = 0;
        } */
        this.handler.state = states.STARTMODE;
        this.emit(':ask', 'Welcome to the Directions App. Would you like to know directions?', 'Say yes to start or no to quit.');
    },
    "AMAZON.StopIntent": function() {
      this.emit(':tell', "Goodbye!");  
    },
    "AMAZON.CancelIntent": function() {
      this.emit(':tell', "Goodbye!");  
    },
    'SessionEndedRequest': function () {
        console.log('session ended!');
        //this.attributes['endedSessionCount'] += 1;
        this.emit(":tell", "Goodbye!");
    }
};

var startModeHandlers = Alexa.CreateStateHandler(states.STARTMODE, {
    'NewSession': function () {
        this.emit('NewSession'); // Uses the handler in newSessionHandlers
    },
    'AMAZON.HelpIntent': function() {
        var message = 'I can help you find directions. Tell me where you are now and where you want to go.';
        this.emit(':ask', message, message);
    },
    'AMAZON.YesIntent': function() {
        this.handler.state = states.FINDMODE;
        this.emit(':ask', 'Great! ' + 'Are you driving?', 'Please say yes or no.');
    },
    'AMAZON.NoIntent': function() {
        console.log("NOINTENT");
        this.emit(':tell', 'Ok, see you next time!');
    },
    "AMAZON.StopIntent": function() {
      console.log("STOPINTENT");
      this.emit(':tell', "Goodbye!");  
    },
    "AMAZON.CancelIntent": function() {
      console.log("CANCELINTENT");
      this.emit(':tell', "Goodbye!");  
    },
    'SessionEndedRequest': function () {
        console.log("SESSIONENDEDREQUEST");
        //this.attributes['endedSessionCount'] += 1;
        this.emit(':tell', "Goodbye!");
    },
    'Unhandled': function() {
        console.log("UNHANDLED");
        var message = 'Say yes to know directions, or no to exit.';
        this.emit(':ask', message, message);
    }
});

var findModeHandlers = Alexa.CreateStateHandler(states.FINDMODE, {
    'NewSession': function () {
        this.emit('NewSession'); // Uses the handler in newSessionHandlers
    },
    'AMAZON.HelpIntent': function() {
        var message = 'I can help you find directions. Tell me where you are now and where you want to go.';
        this.emit(':ask', message, message);
    },
    'AMAZON.YesIntent': function() {
        this.handler.state = states.DRIVINGMODE;                
        this.emit(':ask', 'Great! ' + 'Tell me where you are now and where you want to go. For example, you can say, Get me directions from Gaithursburg, Maryland to Rockefeller, New York', 
            'Please say the source and destination addresses.');
    },
    'AMAZON.NoIntent': function() {
        this.handler.state = states.TRANSITMODE;
        this.emit(':ask', 'Alright! ' + 'Tell me where you are now and where you want to go. For example, you can say, Get me directions from 10 Commercial Avenue, New Brunswick to Times Square, New York', 
            'Please say the source and destination addresses.');
    },
    "AMAZON.StopIntent": function() {
      console.log("STOPINTENT");
      this.emit(':tell', "Goodbye!");  
    },
    "AMAZON.CancelIntent": function() {
      console.log("CANCELINTENT");
      this.emit(':tell', "Goodbye!");  
    },
    'SessionEndedRequest': function () {
        console.log("SESSIONENDEDREQUEST");
        //this.attributes['endedSessionCount'] += 1;
        this.emit(':tell', "Goodbye!");
    },
    'Unhandled': function() {
        console.log("UNHANDLED");
        var message = 'Say yes to know directions, or no to exit.';
        this.emit(':ask', message, message);
    }
});

var drivingModeHandlers = Alexa.CreateStateHandler(states.DRIVINGMODE, {
    'NewSession': function () {
        this.handler.state = '';
        this.emitWithState('NewSession'); // Equivalent to the Start Mode NewSession handler
    },
    'GetDirectionsIntent': function() {
        var source = this.event.request.intent.slots.src.value;
        var destination = this.event.request.intent.slots.dest.value;
        for (var i = 0; i < source.length; i++)
            if (source[i] == ' ') source[i] = '+';
        for (var i = 0; i < destination.length; i++)
            if (destination[i] == ' ') destination[i] = '+';
        var url = 'https://maps.googleapis.com/maps/api/directions/json?origin='+source+'&destination='+destination+'&key='+apiKey;
        httpsGet(url, function(response) {
            var output = '';
            var result = JSON.parse(response);
            var cardContent = "\nDirections provided by Google\n\n";
            var json = result.routes[0].legs[0].steps;
            for (var i = 0; i < json.length; i++) {
                var index = i + 1;
                var inst = (json[i].html_instructions).replace(/<b>/g, "").replace(/<\/b>/g, "").replace(/<\/div>/g, "").replace(/<div style="font-size:0.9em">/g, ". ");
                cardContent += index + ". " + inst + " for " + json[i].distance.text + ".\n";
            }
            output += "The total travel time is " + result.routes[0].legs[0].duration.text + ". See your Alexa app for directions.";
            var cardTitle = "Directions";
            console.log(cardContent);
            alexa.emit(':tellWithCard', output, cardTitle, cardContent);
        });
    },
    'AMAZON.HelpIntent': function() {
        this.emit(':ask', 'I can help you find directions. Tell me where you are now and where you want to go.', 'Tell me where you are now and where you want to go.');
    },
    "AMAZON.StopIntent": function() {
        console.log("STOPINTENT");
      this.emit(':tell', "Goodbye!");  
    },
    "AMAZON.CancelIntent": function() {
        console.log("CANCELINTENT");
    },
    'SessionEndedRequest': function () {
        console.log("SESSIONENDEDREQUEST");
        this.attributes['endedSessionCount'] += 1;
        this.emit(':tell', "Goodbye!");
    },
    'Unhandled': function() {
        console.log("UNHANDLED");
        this.emit(':ask', 'Sorry, I didn\'t get that.', 'Please repeat properly.');
    }
});

var transitModeHandlers = Alexa.CreateStateHandler(states.TRANSITMODE, {
    'NewSession': function () {
        this.handler.state = '';
        this.emitWithState('NewSession'); // Equivalent to the Start Mode NewSession handler
    },
    'GetDirectionsIntent': function() {
        var source = this.event.request.intent.slots.src.value;
        var destination = this.event.request.intent.slots.dest.value;
        for (var i = 0; i < source.length; i++)
            if (source[i] == ' ') source[i] = '+';
        for (var i = 0; i < destination.length; i++)
            if (destination[i] == ' ') destination[i] = '+';
        var url = 'https://maps.googleapis.com/maps/api/directions/json?mode=transit&transit_mode=train&origin='+source+'&destination='+destination+'&key='+apiKey;
        httpsGet(url, function(response) {
            var output = '';
            var result = JSON.parse(response);
            var cardContent = "\nDirections provided by Google\n\n";
            var jsonOne = result.routes[0].legs[0].steps;
            for (var i = 0; i < jsonOne.length; i++) 
            {
                var index = i + 1;
                cardContent += index + ". " + jsonOne[i].html_instructions + "\n";
                if (jsonOne[i].travel_mode === "WALKING") // if ((jsonOne[i].html_instructions).search("Walk") != -1)
                {
                    var jsonTwo = jsonOne[i].steps;
                    for (var j = 0; j < jsonTwo.length; j++)
                    {
                        if (jsonTwo[j].html_instructions === undefined) continue;
                        var inst = (jsonTwo[j].html_instructions).replace(/<b>/g, "").replace(/<\/b>/g, "").replace(/<\/div>/g, "").replace(/<div style="font-size:0.9em">/g, ". ");
                        cardContent += "-> " + inst + " (" + jsonTwo[j].distance.text + ")\n";
                    }
                }
                else if (jsonOne[i].travel_mode === "TRANSIT")
                {
                    var jsonTwo = jsonOne[i].transit_details;
                    cardContent += "-> Line name: " + jsonTwo.line.name + "\n";
                    cardContent += "-> Number of stops: " + jsonTwo.num_stops + "\n";
                    cardContent += "-> Departure Stop: " + jsonTwo.departure_stop.name + "\n";
                    cardContent += "-> Departure Time: " + jsonTwo.departure_time.text + "\n";
                    cardContent += "-> Arrival Stop: " + jsonTwo.arrival_stop.name + "\n";
                    cardContent += "-> Arrival Time: " + jsonTwo.arrival_time.text + "\n";
                }
            }
            output += "The total travel time is " + result.routes[0].legs[0].duration.text + ". See your Alexa app for directions.";
            var cardTitle = "Directions";
            console.log(cardContent);
            alexa.emit(':tellWithCard', output, cardTitle, cardContent);
        });
    },
    'AMAZON.HelpIntent': function() {
        this.emit(':ask', 'I can help you find directions. Tell me where you are now and where you want to go.', 'Tell me where you are now and where you want to go.');
    },
    "AMAZON.StopIntent": function() {
        console.log("STOPINTENT");
      this.emit(':tell', "Goodbye!");  
    },
    "AMAZON.CancelIntent": function() {
        console.log("CANCELINTENT");
    },
    'SessionEndedRequest': function () {
        console.log("SESSIONENDEDREQUEST");
        this.attributes['endedSessionCount'] += 1;
        this.emit(':tell', "Goodbye!");
    },
    'Unhandled': function() {
        console.log("UNHANDLED");
        this.emit(':ask', 'Sorry, I didn\'t get that.', 'Please repeat properly.');
    }
});

function httpsGet(url, callback) {
    https.get(url, function(res) {
        var body = '';
        res.on('data', function(data) {
            body += data;
        });
        res.on('end', function() {
            callback(body);
        });
    });
}
