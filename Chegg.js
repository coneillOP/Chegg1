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
                var ruleNum = response[i].id
                ruleIDarr.push(response[i].id);
            }
        }
    }
    ruleIDarr.forEach(checkRule)
}
opReq.open("POST", baseURL, true);
opReq.send(JSON.stringify(data));
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
function checkVariable(key, value, variable, operator, expected) {
    if(key === variable){
        passed = doOperation(operator, value, expected);
        results.found = true;
        results.passed = passed;
    }
}
function index(obj, i) {
    // console.log(obj[i]);
    return obj[i]?obj[i]:null;
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
            for (var i2 = 0; i2 < response.tags.length; i2++){
                if(!response.tags[i2].variables){
                    continue;
                }
                if(response.tags[i2].clause == "If") {
                  var passed = true;
                  for (var i = 0; i < response.tags[i2].variables.length; i++) {
                      ruleArr.push(response.tags[i2].variables[i]);
                      var variableName = response.tags[i2].variables[i].variable;
                      var operator = response.tags[i2].variables[i].matchType;
                      var valueName = response.tags[i2].variables[i].value;
                      var variable = variableName.split('.').reduce(index, digitalData);
                      if(variable != null)
                      {
                        passed = passed && doOperation(operator, variable, valueName);
                      } else passed = false;
                    }
                    if(passed == false) {
                      console.log("Rule: " + response.name + " is not applicable");
                      return;
                    }
                }else if (response.tags[i2].clause == "Then"){
                  var passed = true;
                  for (var i = 0; i < response.tags[i2].variables.length; i++) {
                      ruleArr.push(response.tags[i2].variables[i]);
                      var variableName = response.tags[i2].variables[i].variable;
                      var operator = response.tags[i2].variables[i].matchType;
                      var valueName = response.tags[i2].variables[i].value;
                      var variable = variableName.split('.').reduce(index, digitalData);
                      if(variable != null)
                      {
                        passed = passed && doOperation(operator, variable, valueName);
                      } else passed = false;
                    }
                  console.log(response.name + ": "+ passed);
                }
            }
          }
        }
    opReq.open("POST", baseURL, true);
    opReq.send(JSON.stringify(data));
}
