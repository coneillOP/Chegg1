
 class KickoffDataLayer {
  constructor(cacheTime, alertsEnabled, consoleLogEnabled) {
    this.lsTimeStamp = cacheTime;
    this.alertsEnabled = alertsEnabled;
    this.consoleLog = consoleLogEnabled;
    this.results = [];
  }

  startProcess() {
    var that = this;
    if(!localStorage.timeStamp || this.isTimeExpired(this.lsTimeStamp)) {
      localStorage.clear()
      this.getRuleIds();
      console.log("Make API Calls");
    }
    setTimeout(function() {
      that.validate()
    }, 4000)
  }

  isTimeExpired(timer){
    var now = Math.round(new Date().getTime()/60000)
    var timeStamp = Number(localStorage.timeStamp);
    timeStamp = timeStamp + timer;
    if (now >= timeStamp){
      return true;
    } else {
      return false;
    }
  }

  validate() {
    var allRules = [];
    for (var i = 0; i < localStorage.length; i++) {
      var key = localStorage.key(i)
      if (key.indexOf('time') === -1) {
        var body = localStorage.getItem(key)
        allRules.push(this.validateRules(JSON.parse(body)))
      }
    }

    if(i == localStorage.length) {
      var results = this.results;
      for (var i in results) {
        if(this.consoleLog) {
          console.log( results[i] );
        }
      }
      if(this.alertsEnabled) {
        alert(results.join("\r\n"))
      }
    }

    allRules.forEach(function(k) {
      if(k && k[0]) {
        console.log('Rule: ', k[0])
      }
    })
  }

  getRuleIds() {
    var that = this;
    var ruleIds = [];
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
              for (var i = 0; i < response.length; i++) {
                  if (response[i].name.indexOf("dataLayer") > -1) {
                      ruleIds.push(response[i].id);
                  }
              }
          }
      }
      opReq.open("POST", baseURL, true);
      opReq.send(JSON.stringify(data));
      console.log("1st API Call", ruleIds);
      that.checkRules(ruleIds)
     }, 500)
  }

  checkRules(ruleIds) {
      var that = this;
      setTimeout(function() {
        for(var i = 0; i < ruleIds.length; i++) {
          that.getRulesWithId(ruleIds[i])
        }
        that.setTimestamp()
      }, 1000)
  }

  getRulesWithId(id) {
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

  setTimestamp() {
    var timeStamp = Math.round(new Date().getTime()/60000)
    localStorage.setItem("timeStamp", timeStamp);
  }

  validateRules(response) {
    // var results = []
    if(response.tags) {
      for (var i = 0; i < response.tags.length; i++) {
        var summary;
        var variables = response.tags[i].variables
        var clause = response.tags[i].clause

        if(variables) {

          if(clause == "If") {
            for (var j = 0; j < variables.length; j++) {
              summary = this.evaluateVariable(response.name, variables[j])
            }
            if (summary && summary.pass == false) return;
          }

          if (clause == "Then") {
            for (var k = 0; k < variables.length; k++) {
              summary = this.evaluateVariable(response.name, variables[k])
              this.results.push(`${summary.responseName} : ${summary.name} - ${summary.pass}`);
            }
          }
        }
      }
    }
  }

  evaluateVariable(name, variable) {
    var variableReduced = variable.variable.split('.').reduce(this.index, digitalData);
    var operator = variable.matchType;
    var value = variable.value;
    var passed = this.passFailEvaluation(variableReduced, operator, value)
    return {
      responseName: name,
      name: variable.validationDescription,
      pass: passed
    }
  }

  passFailEvaluation(variable, operator, valueName) {
    var passed = true
    if (variable != null) {
      passed = passed && this.doOperation(operator, variable, valueName);
      return passed;
    } else {
      return false;
    }
  }

  doOperation(operator, actual, expected) {
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

  index(obj, i) {
    return obj[i]?obj[i]:null;
  }
}

var init = new KickoffDataLayer(10, true, true);
init.startProcess();
