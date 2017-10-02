
var lsTimeStamp = 0;
var results = []

if(!localStorage.timeStamp || isTimeExpired(lsTimeStamp)){
  localStorage.clear()
  getRuleIds()
  console.log("Make API Calls");
}
setTimeout(function() {
  validate()
}, 4000)


function getRuleIds() {
  var ruleIds = []
  var data = {
      requestUrl: "https://api.observepoint.com/v2/rules",
      requestType: "GET",
      requestJson: "{}",
      requestKey: "api_key aDY1ZTNodDYxYWR0YjkyY3FhcG5sMmowc21zZXRjdjU0b25uYWlvbnBnbnZoNDIyZjBvYm9mNHU1MCYxNDcmMTQ4NzE5OTQ1NzkxOA"
  }
  var baseURL = "https://labs.observepoint.com:444";
  setTimeout(function(){
    var opReq = new XMLHttpRequest();
    opReq.onreadystatechange = function() {
        if (opReq.readyState == 4 && opReq.status == 200){
            var response = JSON.parse(opReq.responseText)
            for (i = 0; i < response.length; i++) {
                if (response[i].name.indexOf("dataLayer") > -1) {
                    ruleIds.push(response[i].id);
                }
            }
        }
    }
    opReq.open("POST", baseURL, true);
    opReq.send(JSON.stringify(data));
    console.log("1st API Call", ruleIds);
    checkRules(ruleIds)
  }, 500)
}

function checkRules(ruleIds) {
  setTimeout(function() {
    for(var i = 0; i < ruleIds.length; i++) {
      getRulesWithId(ruleIds[i])
    }
    setTimestamp()
  }, 1000)
}

function getRulesWithId(id) {
  var data = {
      requestUrl: "https://api.observepoint.com/v2/rules/"+id,
      requestType: "GET",
      requestJson: "{}",
      requestKey: "api_key aDY1ZTNodDYxYWR0YjkyY3FhcG5sMmowc21zZXRjdjU0b25uYWlvbnBnbnZoNDIyZjBvYm9mNHU1MCYxNDcmMTQ4NzE5OTQ1NzkxOA"
  }
  var baseURL = "https://labs.observepoint.com:444";
  var opReq = new XMLHttpRequest();
  opReq.open("POST", baseURL, true);
  opReq.send(JSON.stringify(data));
  console.log("2nd API Calls");
  opReq.onreadystatechange = function() {
    if(opReq.readyState == 4 && opReq.status == 200) {
      localStorage.setItem(`${id}`, opReq.responseText)
    }
  }
}

function isTimeExpired(timer){
  var now = Math.round(new Date().getTime()/60000)
  var timeStamp = Number(localStorage.timeStamp);
  timeStamp = timeStamp + timer;
  if (now >= timeStamp){
    return true;
  } else {
    return false;
  }
}

function setTimestamp() {
  var timeStamp = Math.round(new Date().getTime()/60000)
  localStorage.setItem("timeStamp", timeStamp);
}

function validate() {
  var allRules = [];
  for (var i = 0; i < localStorage.length; i++) {
    var key = localStorage.key(i)
    if (key.indexOf('time') === -1) {
      var body = localStorage.getItem(key)
      allRules.push(validateRules(JSON.parse(body)))
    }
  }
  allRules.forEach(function(k) {
    if(k && k[0]) {
      console.log('Rule: ', k[0])
    }
  })
}

function validateRules(response) {
  for (var i = 0; i < response.tags.length; i++) {
    var summary;
    var variables = response.tags[i].variables
    var clause = response.tags[i].clause

    if(!variables) continue;

    if(clause == "If") {
      for (var j = 0; j < variables.length; j++) {
        summary = evaluateVariable(response.name, variables[j])
      }
      if (summary && summary.pass == false) return;
    }

    if (clause == "Then") {
      for (var k = 0; k < variables.length; k++) {
        summary = evaluateVariable(response.name, variables[k])
        results.push(`${summary.responseName} : ${summary.name} - ${summary.pass}`);
      }
    }
  }
}

setTimeout(function(){ for (var i in results) {
  console.log( results[i] );
}
  alert(results.join("\r\n"))
}, 6000);


function evaluateVariable(name, variable) {
  var variableReduced = variable.variable.split('.').reduce(index, digitalData);
  var operator = variable.matchType;
  var value = variable.value;
  var passed = passFailEvaluation(variableReduced, operator, value)
  return {
    responseName: name,
    name: variable.validationDescription,
    pass: passed
  }
}

function passFailEvaluation(variable, operator, valueName) {
  var passed = true
  if (variable != null) {
    passed = passed && doOperation(operator, variable, valueName);
    return passed;
  } else {
    return false;
  }
}

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
            return (actual.match(expected) !=null ? true : false);
        case "GreaterThanOrEquals":
            return actual >= expected;
        case "LessThanOrEquals":
            return actual <= expected;
    }
}

function index(obj, i) {
    return obj[i]?obj[i]:null;
}
