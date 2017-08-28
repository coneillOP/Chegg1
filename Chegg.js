// Rules GET
var ruleIDarr = []
var data = {
    requestUrl: "https://api.observepoint.com/v2/rules",
    requestType: "GET",
    requestJson: "{}",
    requestKey: "api_key aDY1ZTNodDYxYWR0YjkyY3FhcG5sMmowc21zZXRjdjU0b25uYWlvbnBnbnZoNDIyZjBvYm9mNHU1MCYxNDcmMTQ4NzE5OTQ1NzkxOA"
}
var baseURL = "https://labs.observepoint.com:444";
var opReq = new XMLHttpRequest();
opReq.onreadystatechange = function() {
    if (opReq.readyState == 4 && opReq.status == 200){
        var response = JSON.parse(opReq.responseText)
        for (i = 0; i < response.length; i++) {
            if (response[i].name.indexOf("dataLayer") > -1) {
                // console.log(response[i].name);
                // console.log(response[i].id);
                var ruleNum = response[i].id
                ruleIDarr.push(response[i].id);
            }
        }
    }
    ruleIDarr.forEach(checkRule)
}
opReq.open("POST", baseURL, true);
opReq.send(JSON.stringify(data));
// Individual Rule Validation
function doOperation(operator, actual, expected) {
    switch (operator) {
        case "Equal":
            return actual == expected;
        case "NotEqual":
            return actual != expected;
        case "Contains":
            return actual.indexOf(expected) != -1;
        case "DoesNotContain":
            return actual.indexOf(expected) == -1;
        case "IsSet":
            return !!actual;
        case "NotSet":
            return !actual;
        case "Regex":
            return actual.match(expected);
        case "GreaterThanOrEquals":
            return actual >= expected;
        case "LessThanOrEquals":
            return actual <= expected;
    }
}
var results = { passed: false, found: false};
function checkVariable(key, value, variable, operator, expected) {
    // console.log(key, value, variable);
    if(key === variable){
        passed = doOperation(operator, value, expected);
        results.found = true;
        results.passed = passed;
    }
}
function iterObj(obj, variable, operator, expectedValue) {
    for (var key in obj) {
        checkVariable(key, obj[key], variable, operator, expectedValue)
        if (results.found) {
            return results.passed;
        }
        if (obj[key] !== null && typeof(obj[key])== "object") {
            //going one step down in the object tree!!
            iterObj(obj[key], variable, operator, expectedValue);
        }
    }
    if(!results.found){
        results.passed = operator == "NotSet";
    }
}
var ruleArr = [];
function checkRule(dlRulesID) {
    var data = {
        requestUrl: "https://api.observepoint.com/v2/rules/"+dlRulesID,
        requestType: "GET",
        requestJson: "{}",
        requestKey: "api_key aDY1ZTNodDYxYWR0YjkyY3FhcG5sMmowc21zZXRjdjU0b25uYWlvbnBnbnZoNDIyZjBvYm9mNHU1MCYxNDcmMTQ4NzE5OTQ1NzkxOA"
    }
    var baseURL = "https://labs.observepoint.com:444";
    var opReq = new XMLHttpRequest();
    opReq.onreadystatechange = function() {
        if (opReq.readyState == 4 && opReq.status == 200){
            var response = JSON.parse(opReq.responseText)
            console.log(response);
            for (var i2 = 0; i2 < response.tags.length; i2++){
                // if(response.tags[i2].clause !== "Then"){
                //     continue;
                // }
                if(!response.tags[i2].variables){
                    continue;
                }
                var passed = true;
                for (var i = 0; i < response.tags[i2].variables.length; i++) {
                    // console.log(response.tags[i2].variables[i]);
                    ruleArr.push(response.tags[i2].variables[i]);
                    var variableName = response.tags[i2].variables[i].variable;
                    var operator = response.tags[i2].variables[i].matchType;
                    var valueName = response.tags[i2].variables[i].value;
                    // Data Layer Loop
                    iterObj(digitalData, variableName, operator, valueName);
                    passed = passed && results.passed;
                    results = { passed: false, found: false};
                }
                console.log(response.tags[i2].clause, "Rule " + response.name + " passed: " + passed);

            }
        }
    }
    opReq.open("POST", baseURL, true);
    opReq.send(JSON.stringify(data));
}
