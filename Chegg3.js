class KickoffDataLayer {
  startProcess(cacheTime, alertsEnabled, consoleLogEnabled, debugEnabled) {
    this.lsTimeStamp = cacheTime;
    this.alertsEnabled = alertsEnabled;
    this.debugEnabled = debugEnabled;
    this.consoleLog = consoleLogEnabled;
    this.results = [];

    this.payload = {
        requestUrl: "https://api.observepoint.com/v2/rules",
        requestType: "GET",
        requestJson: "{}",
        requestKey: "api_key aDY1ZTNodDYxYWR0YjkyY3FhcG5sMmowc21zZXRjdjU0b25uYWlvbnBnbnZoNDIyZjBvYm9mNHU1MCYxNDcmMTQ4NzE5OTQ1NzkxOA"
    }
    this.baseURL = "https://labs.observepoint.com:444";

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
    var data = this.payload;
    var baseURL = this.baseURL;
    var that = this;
    var ruleIds = [];
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
    this.payload.requestUrl = "https://api.observepoint.com/v2/rules/";
    var data = this.payload;
    data.requestUrl = data.requestUrl + id;
    var opReq = new XMLHttpRequest();
    opReq.open("POST", this.baseURL, true);
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
              summary = this.evaluateVariable(response.name, variables[k]);
              
              var passed = summary.pass;
              if(summary.value) {
                if(summary.value[0] == '[' && summary.value[summary.value.length - 1] == ']') {
                  var value = summary.value.replace('[', '').replace(']', '').split(',');
                  var valueEvaluation = this.passValueFailEvaluation(summary.name, value);
                  if(valueEvaluation !== true) {
                    passed = valueEvaluation;
                  }
                }
              }

              const logDetail = `${summary.responseName} : ${summary.name} - ${summary.description} - ${passed}`;
              if(this.debugEnabled == false) {
                this.results.push(logDetail);
              }
              else {
                if(summary.pass == false) {
                  this.results.push(logDetail);
                }
              } 
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
      
    var passed = this.passFailEvaluation(variableReduced, operator, value);
    return {
      responseName: name,
      name: variable.variable,
      description: variable.validationDescription,
      value: value,
      pass: passed
    }
  }

  passValueFailEvaluation(variable, value) {
    var variableReduced = variable.split('.').reduce(this.index, digitalData);
    var compareData = [];
    if(typeof variableReduced == 'string') {
      if(variableReduced[0] == '[' && variableReduced[variableReduced.length - 1] == ']') {
        compareData = variableReduced.replace('[', '').replace(']', '').split(',');
      }
      else {
        compareData = variableReduced;
      }
    }
    else if(typeof variableReduced == 'object') {
      for(var i in variableReduced) {
        if(typeof variableReduced[i] !== 'object') {
          compareData.push(variableReduced[i]);
        }
      }
    }

    var missing = false;
    for(var i = 0; i < value.length; i++) {
      if(compareData.indexOf(value[i]) == -1) {
        missing = missing + ', ' + value[i]
      }
      if(i == value.length - 1 && status !== false) {
        missing = missing + ' Not Found';
      }
    }

    if(missing == false) {
      return true;
    }
    else {
      return missing;
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
    if(obj) {
      if(i.indexOf('[') !== -1 && i.indexOf(']') !== -1) {
        var arrIndex = parseInt(i.substring(i.lastIndexOf("[") + 1, i.lastIndexOf("]")));
        i = i.substr(0, i.indexOf('['));
        return obj[i][arrIndex]?obj[i][arrIndex]:null;
      }
      else {
        return obj[i]?obj[i]:null;
      }
    }
  }
}
var init = new KickoffDataLayer();
init.startProcess(10, true, true, false);
