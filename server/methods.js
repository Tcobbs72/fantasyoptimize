require = __meteor_bootstrap__.require; //to use npm require must be exposed.
var cheerio = Npm.require('cheerio');

var fs = Npm.require('fs');
var path = Npm.require('path');
var basepath = path.resolve('.').split('.meteor')[0];

var qbs = [], rbs = [], wrs = [], tes = [];

Meteor.methods({
    getQBs: function (week) {
        console.log("being called", Teams.find({}).fetch().length, Players.find({}).fetch().length);
        for(var i = 1; i<week; i++) {
            if(Players.findOne({positionId: Positions.findOne({position: "QB"})._id, history: {$elemMatch: {week: i}}})){
                console.log("There is already entries for week ", i);
            }
            else{
                var result = Meteor.http.get("http://www.nfl.com/stats/weeklyleaders?week="+i+"&season=2015&showCategory=Passing");
                var $ = cheerio.load(result.content);
                $("#passer").children().children("tr").each(function () {
                    if ($(this).hasClass("odd") || $(this).hasClass("even")) {
                        var name = null, team=null, opp=null, score, complete=null, attempt=null,
                            yards=null, td=null, int=null, sack=null, fum=null, points = 0;
                        $(this).children("td").each(function(){
                            if($(this).hasClass("nameCell")) name = $(this).children("a").text();
                            else if($(this).hasClass("right")){
                                if(complete===null) complete = parseInt($(this).text());
                                else if(attempt===null) attempt = parseInt($(this).text());
                                else if(yards===null){
                                    yards = parseInt($(this).text());
                                    points += Math.round(100.0*yards/25)/100;
                                    if(yards>300) points+=3;
                                }
                                else if(td===null){
                                    td = parseInt($(this).text());
                                    points += 4*td;
                                }
                                else if(int===null){
                                    int = parseInt($(this).text());
                                    points -= int;
                                }
                                else if(sack===null) sack = parseInt($(this).text());
                                else if(fum===null){
                                    fum = parseInt($(this).text());
                                    points -= fum;
                                }
                            }
                            else{
                                if(!team) team = Teams.findOne({abbrev: $(this).children("a").text()}) ? Teams.findOne({abbrev: $(this).children("a").text()}).name : null;
                                else if(!opp) opp = $(this).text() + $(this).children("a").text();
                            }
                        });
                        if(Players.findOne({name: name, team: team, positionId: {$in: [Positions.findOne({position: "RB"})._id, Positions.findOne({position: "WR"})._id, Positions.findOne({position: "TE"})._id]}})){
                            var player = Players.findOne({name: name, team: team});
                            player.history = _.map(player.history, function(h){
                                if(h.week===i){
                                    h.points+=points;
                                }
                                return h;
                            });
                            Players.update({name: name, team: team}, {$set: {history: player.history}});
                        }
                        else if(attempt>5 && team && name){
                            var qb = Players.findOne({name: name, team: team, positionId: Positions.findOne({position: "QB"})._id});
                            if(!qb && points>=4){
                                console.log("creating qb", name);
                                qb = {name: name, average: points, team: team, history: [{week: i, points: points, team: _.find(Teams.findOne({name: team}).schedule, function(s){return s.week===i;}).team}], positionId: Positions.findOne({position: "QB"})._id, health: "Healthy"};
                                Players.insert(qb);
                            }
                            else if(qb){
                                console.log("adding history", name);
                                qb.history.push({week: i, points: points, team: _.find(Teams.findOne({name: team}).schedule, function(s){return s.week===i;}).team});
                                var sum = 0, games = 0;
                                _.each(qb.history, function(g){
                                    sum+=g.points;
                                    games++;
                                });
                                if(games) qb.average = Math.round(sum * 100.0 / games) / 100;
                                Players.update({name: qb.name, team: qb.team, positionId: Positions.findOne({position: "QB"})._id}, {$set: {history: qb.history, average: qb.average}});
                            }
                            //qbs = _.map(qbs, function(a){if(a.name===qb.name && a.team===qb.team) return qb; else return a;});
                        }
                    }
                });
            }
            console.log("QBS DONE", i);
        }
    },
    getWRs: function (week) {
        for(var i = 1; i<week; i++) {
            if(Players.findOne({positionId: Positions.findOne({position: "WR"})._id, history: {$elemMatch: {week: i}}})) {
                console.log("There is already entries for week ", i);
            }
            else{
                var result = Meteor.http.get("http://www.nfl.com/stats/weeklyleaders?week="+i+"&season=2015&showCategory=Receiving");
                var $ = cheerio.load(result.content);
                $("#receiver").children().children("tr").each(function () {
                    if ($(this).hasClass("odd") || $(this).hasClass("even")) {
                        var name = null, team=null, opp=null, receptions=null,
                            yards=null, td=null, avg=null, fum=null, points = 0;
                        $(this).children("td").each(function(){
                            if($(this).hasClass("nameCell")) name = $(this).children("a").text();
                            else if($(this).hasClass("right")){
                                if(receptions===null){
                                    receptions = parseInt($(this).text());
                                    points += receptions;
                                }
                                else if(yards===null){
                                    yards = parseInt($(this).text());
                                    points += Math.round(100.0*yards/10)/100;
                                    if(yards>100) points+=3;
                                }
                                else if(avg===null) avg = parseInt($(this).text());
                                else if(td===null){
                                    td = parseInt($(this).text());
                                    points += 6*td;
                                }
                                else if(fum===null){
                                    fum = parseInt($(this).text());
                                    points -= fum;
                                }
                            }
                            else{
                                if(!team) team = Teams.findOne({abbrev: $(this).children("a").text()}) ? Teams.findOne({abbrev: $(this).children("a").text()}).name : null;
                                else if(!opp) opp = $(this).text() + $(this).children("a").text();
                            }
                        });
                        if(Players.findOne({name: name, team: team, positionId: {$in: [Positions.findOne({position: "QB"})._id, Positions.findOne({position: "RB"})._id, Positions.findOne({position: "TE"})._id]}})){
                            var player = Players.findOne({name: name, team: team});
                            player.history = _.map(player.history, function(h){
                                if(h.week===i){
                                    h.points+=points;
                                }
                                return h;
                            });
                            Players.update({name: name, team: team}, {$set: {history: player.history}});
                        }
                        else if(receptions>0 && team && name){
                            var wr = Players.findOne({name: name, team: team, positionId: Positions.findOne({position: "WR"})._id});
                            if(!wr && points>=4){
                                console.log("creating wr", name);
                                wr = {name: name, average: points, team: team, history: [{week: i, points: points, team: _.find(Teams.findOne({name: team}).schedule, function(s){return s.week===i;}).team}], positionId: Positions.findOne({position: "WR"})._id, health: "Healthy"};
                                Players.insert(wr);
                            }
                            else if(wr){
                                console.log("adding history", name);
                                wr.history.push({week: i, points: points, team: _.find(Teams.findOne({name: team}).schedule, function(s){return s.week===i;}).team});
                                var sum = 0, games = 0;
                                _.each(wr.history, function(g){
                                    sum+=g.points;
                                    games++;
                                });
                                if(games) wr.average = Math.round(sum * 100.0 / games) / 100;
                                Players.update({name: wr.name, team: wr.team, positionId: Positions.findOne({position: "WR"})._id}, {$set: {history: wr.history, average: wr.average}});
                            }
                        }
                    }
                });
            }
            console.log("WRS DONE", i);
        }
    },
    getRBs: function (week) {
            for (var i = 1; i < week; i++) {
                if(Players.findOne({positionId: Positions.findOne({position: "RB"})._id, history: {$elemMatch: {week: i}}})) {
                    console.log("There is already entries for week ", i);
                }
                else{

                    var result = Meteor.http.get("http://www.nfl.com/stats/weeklyleaders?week=" + i + "&season=2015&showCategory=Rushing");
                    var $ = cheerio.load(result.content);
                    $("#rusher").children().children("tr").each(function () {
                        if ($(this).hasClass("odd") || $(this).hasClass("even")) {
                            var name = null, team = null, opp = null, attempt = null,
                                yards = null, td = null, avg = null, fum = null, points = 0;
                            $(this).children("td").each(function () {
                                if ($(this).hasClass("nameCell")) name = $(this).children("a").text();
                                else if ($(this).hasClass("right")) {
                                    if (attempt === null) attempt = parseInt($(this).text());
                                    else if (yards === null) {
                                        yards = parseInt($(this).text());
                                        points += Math.round(100.0 * yards / 10) / 100;
                                        if (yards > 100) points += 3;
                                    }
                                    else if (avg === null) avg = parseInt($(this).text());
                                    else if (td === null) {
                                        td = parseInt($(this).text());
                                        points += 6 * td;
                                    }
                                    else if (fum === null) {
                                        fum = parseInt($(this).text());
                                        points -= fum;
                                    }
                                }
                                else {
                                    if(!team) team = Teams.findOne({abbrev: $(this).children("a").text()}) ? Teams.findOne({abbrev: $(this).children("a").text()}).name : null;
                                    else if (!opp) opp = $(this).text() + $(this).children("a").text();
                                }
                            });
                            //console.log("Looking at running back", name, team, points);
                            if (Players.findOne({
                                    name: name,
                                    team: team,
                                    positionId: {$in: [Positions.findOne({position: "QB"})._id, Positions.findOne({position: "WR"})._id, Positions.findOne({position: "TE"})._id]}
                                })) {
                                console.log("Player is not a running back");
                                var player = Players.findOne({name: name, team: team});
                                player.history = _.map(player.history, function (h) {
                                    if (h.week === i) {
                                        h.points += points;
                                    }
                                    return h;
                                });
                                Players.update({name: name, team: team}, {$set: {history: player.history}});
                            }
                            else if (attempt > 4 && team && name) {
                                var rb = Players.findOne({name: name, team: team, positionId: Positions.findOne({position: "RB"})._id});
                                if (!rb && points>=4) {
                                    console.log("creating rb", name);
                                    rb = {
                                        name: name,
                                        average: points,
                                        team: team,
                                        history: [{
                                            week: i,
                                            points: points,
                                            team: _.find(Teams.findOne({name: team}).schedule, function (s) {
                                                return s.week === i;
                                            }).team
                                        }],
                                        positionId: Positions.findOne({position: "RB"})._id,
                                        health: "Healthy"
                                    };
                                    Players.insert(rb);
                                }
                                else if(rb){
                                    console.log("adding history", name);
                                    rb.history.push({
                                        week: i,
                                        points: points,
                                        team: _.find(Teams.findOne({name: team}).schedule, function (s) {
                                            return s.week === i;
                                        }).team
                                    });
                                    var sum = 0, games = 0;
                                    _.each(rb.history, function(g){
                                        sum+=g.points;
                                        games++;
                                    });
                                    if(games) rb.average = Math.round(sum * 100.0 / games) / 100;
                                    Players.update({
                                        name: rb.name,
                                        team: rb.team,
                                        positionId: Positions.findOne({position: "RB"})._id
                                    }, {$set: {history: rb.history, average: rb.average}});
                                }
                                else{
                                    console.log("not enough points to add to create");
                                }
                            }
                        }
                    });
                }
            console.log("RBS DONE", i);
        }
    },
    getSalaries: function(week){
        Players.update({}, {$set: {price: 0}}, {multi: true});
        Teams.update({}, {$set: {price: 0}}, {multi: true});
        var excel = new Excel('xls');
        var workbook = excel.readFile(basepath + "client/salaries/week"+week+".xls");
        var week = workbook.SheetNames;
        //console.log("Get the 1st Sheet Name (remember is an array): " + workbook.SheetNames[0]);
        //console.log("Get Some Cell from it: " + JSON.stringify(workbook.Sheets[week[0]]['C2']));
        for(var i = 2; workbook.Sheets[week[0]]['B'+i]; i++){
            var name = workbook.Sheets[week[0]]['B'+i].v;
            var salary = workbook.Sheets[week[0]]['C'+i].v;
            if(name.split(' ').length===1) Teams.update({name: new RegExp(name, "i")}, {$set: {price: salary}});
            if(!Players.findOne({name: name})) console.log("Couldnt find player: ", name);
            Players.update({name: name}, {$set: {price: salary}});
            console.log("setting salary of ", name, salary);
        }
    },
    updateMatchups: function(id, matchups){
        Players.update({_id: id}, {$set: {"history": matchups}});
    },
    updateSchedule: function(id, matchups){
        Teams.update({_id: id}, {$set: {"schedule": matchups}});
    },
    updatePlayerAverage: function(id, average){
        Players.update({_id: id}, {$set: {average: average}});
    },
    updatePlayerHealth: function(player, team, health){
        Players.update({name: player, team: team}, {$set: {health: health}});
    },
    updatePlayerPosition: function(player, team, position){
        Players.update({name: player, team: team}, {$set: {positionId: Positions.findOne({position: position})._id}});
    },
    updatePlayerName: function(oldName, newName, team){
        Players.update({name: oldName, team: team}, {$set: {name: newName}});
    },
    updateTeamName: function(oldName, newName){
        Teams.update({name: oldName}, {$set: {name: newName}});
    },
    updatePlayerPrice: function(player, team, price){
        console.log("changing price", player, team, price);
        Players.update({name: player, team: team}, {$set: {price: price}});
    },
    updateTeamPrice: function(team, price){
        Teams.update({name: team}, {$set: {price: price}});
    },
    updateDefense: function(team, average, position){
        var fields = {};
        switch(position){
            case "QB":
                fields={$set: {defenseVsQB: average}};
                break;
            case "RB":
                fields={$set: {defenseVsRB: average}};
                break;
            case "WR":
                fields={$set: {defenseVsWR: average}};
                break;
            case "TE":
                fields={$set: {defenseVsTE: average}};
                break;
        }
        Teams.update({name: team}, fields);
        var total=0;
        var obj = Teams.findOne({name: team});
        total+=obj.defenseVsQB;
        total+=obj.defenseVsRB;
        total+=obj.defenseVsWR;
        total+=obj.defenseVsTE;
        Teams.update({name: team}, {$set: {average: Math.round(100.0*total/4)/100}});
    }
});