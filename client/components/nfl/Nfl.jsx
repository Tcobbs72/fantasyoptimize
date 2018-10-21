Session.set("selectedTeam", {});
Session.set("currentWeek", "");

if(!Meteor.globals) Meteor.globals={};
Meteor.globals.excludes = [];


Session.set("allWeightedQBs", []);
Session.set("allWeightedRBs", []);
Session.set("allWeightedWRs", []);
Session.set("allWeightedTEs", []);
Session.set("allWeightedFLEXes", []);
Session.set("allWeightedDSTs", []);

Session.set("weightedQBs", []);
Session.set("weightedRBs", []);
Session.set("weightedWRs", []);
Session.set("weightedTEs", []);
Session.set("weightedFLEXes", []);
Session.set("weightedDSTs", []);

Session.set("nflbudget", 50000);
var QB, RB1, RB2, WR1, WR2, WR3, TE, FLEX, DST;
var totalAvg = 0;

Nfl = React.createClass({
    // This mixin makes the getMeteorData method work
    mixins: [ReactMeteorData],

    // Loads items from the Tasks collection and puts them on this.data.tasks
    getMeteorData() {
        var excludes = Meteor.globals.excludes;
        var playerExcludes = _.pluck(_.filter(excludes, function(e){return e && e.positionId;}), "_id");
        var teamExcludes = _.pluck(_.filter(excludes, function(e){return e && !e.positionId;}), "_id");
        var teams = _.pluck(Teams.find({schedule: {$elemMatch: {"week": Session.get("currentWeek")}}}).fetch(), "name");
        return {
            players: Players.find({_id: {$nin: playerExcludes}, health: {$ne: "Out"}, team: {$in: teams}, price: {$ne: 0}}, {sort: {price: -1, name: 1}}).fetch() || [],
            teams: Teams.find({_id: {$nin: teamExcludes}, schedule: {$elemMatch: {"week": Session.get("currentWeek")}}, price: {$ne: 0}}, {sort: {price: -1}}).fetch() || [],
            positions: Positions.find({}).fetch() || [],
            weightedQBs: Session.get("weightedQBs"),
            weightedRBs: Session.get("weightedRBs"),
            weightedWRs: Session.get("weightedWRs"),
            weightedTEs: Session.get("weightedTEs"),
            weightedFLEXes: Session.get("weightedFLEXes"),
            weightedDSTs: Session.get("weightedDSTs"),
            optimizing: Session.get("currentlyOptimizing"),
            nflbudget: Session.get("nflbudget")
        }
    },
    renderWeightedTables(){
        var ids = ["weightedQB", "weightedRB", "weightedWR", "weightedTE", "weightedFLEX", "weightedDST"];
        return ids.map((id)=>{
            var classn = id==="weightedQB" ? "tab-pane active" : "tab-pane";
            return <div key={id} id={id} className={classn}>
                <table className="table table-bordered table-condensed weight-table">
                    <thead>
                    <tr className="table-row">
                        <th>Name</th>
                        <th>Price</th>
                        <th>Value</th>
                    </tr>
                    </thead>
                    <tbody>
                    </tbody>
                </table>
            </div>
        });
    },
    showWeighted(event){
        var weighted = [{players: Session.get("weightedQBs"), select: "weightedQB"},
            {players: Session.get("weightedRBs"), select: "weightedRB"},
            {players: Session.get("weightedWRs"), select: "weightedWR"},
            {players: Session.get("weightedTEs"), select: "weightedTE"},
            {players: Session.get("weightedFLEXes"), select: "weightedFLEX"},
            {players: Session.get("weightedDSTs"), select: "weightedDST"}];
        _.each(weighted, function(w){
            var string = "";
            _.each(w.players, function(p){
                string+="<tr className='table=row'>"+
                    "<td>"+p.name+"</td>"+
                    "<td>"+p.price+"</td>"+
                    "<td>"+p.value+"</td>"+
                    "</tr>"
            });
            $(".weightedModal").children().children().children(".modal-body").children(".tab-content").children("#"+w.select).children("table").children("tbody").children().remove();
            $(".weightedModal").children().children().children(".modal-body").children(".tab-content").children("#"+w.select).children("table").children("tbody").append(string);
        });
        Meteor.setTimeout(function(){
            $(".weightedModal").modal('show');
        }, 50);
    },
    reoptimize(event) {
        event.preventDefault();
        optimize();
    } ,
    renderWeightedButton(){
        var weighted = this.data.weightedQBs; //test if we have something
        if(weighted.length>0){
            return <div className="row">
                    <div className="col-md-3 col-sm-4 col-xs-5">
                <a href="#" className="btn btn-success round-btn show-value-btn text-center" onClick={this.showWeighted}>Show Values Of Players</a>
            </div>
           </div>
        }
    },
    renderPlayers(positions){
        var posIds = _.pluck(_.pluck(Positions.find({position: {$in: positions}}).fetch(), "_id"), "_str");
        //console.log(this.data.players);
        var fp = _.filter(this.data.players, function(p){
            //console.log(p.name, p.positionId);
            return _.contains(posIds, p.positionId._str);
        });
        return fp.map((p)=>{
            var team = _.find(Teams.findOne({name: p.team}).schedule, function(s){return s && s.week===Session.get("currentWeek");}).team;
            team = team ? team : "";
           return <option value={p.name} data-team={p.team} key={p.name+p.team}>{p.name} -- {p.price} -- {team}</option>
        });
    } ,
    renderDefenseOptions(){
        return this.data.teams.map((team) => {
            //console.log("rendering team", team);
            var match = _.find(team.schedule, function(s){return s.week===Session.get("currentWeek");}).team;
            match = match ? match : "";
            return <option value={team.name} key={team.name}>{team.name} -- {team.price} -- {match}</option>
        });
    },
    addPlayer(event){
      var row = $(event.target).parent().parent();
      var position = row.data("position");
      var player = $(event.target).val();
      var team = event.target.selectedOptions[0].dataset.team;
      var selected = Session.get("selectedTeam");
      var obj = Players.findOne({name: player, team: team});
      removeRow(row);
      if(!player){
          delete selected[position];
          Session.set("selectedTeam", selected);
      }
      else if(_.find(selected, function(p){return p.name===obj.name && p.team===obj.team})){
          Meteor.globals.dangerGrowl("You have already selected " + obj.name);
          $(event.target).val("");
      }
      else{
          if(obj.price<=Session.get("nflbudget")){
              addRow(row, obj);
              selected[position] = obj;
              Session.set("selectedTeam", selected);
          }
          else{
              Meteor.globals.dangerGrowl("You cannot go over budget");
          }
      }
    },
    addDefense(event){
        var row = $(event.target).parent().parent();
        var name = $(event.target).val();
        var team = Teams.findOne({name: name});
        if(team){
            if(team.price<=Session.get("nflbudget")){
                removeRow(row);
                var selected = Session.get("selectedTeam");
                selected["D/ST"] = team;
                Session.set("selectedTeam", selected);
                addDefenseRow(row, team);
            }
            else{
                removeRow(row);
                Meteor.globals.dangerGrowl("You cannot go over budget");
            }
        }
        else{
            var selected = Session.get("selectedTeam");
            delete selected["D/ST"];
            Session.set("selectedTeam", selected);
            removeRow(row);
        }
    },
    excludePlayer(event){
        event.preventDefault();
        var row = $(event.target).hasClass("fa") ? $(event.target).parent().parent().parent() : $(event.target).parent().parent();
        var player = row.children().children(".player-select").val();
        var team = row.data("team");
        var obj = Players.findOne({name: player, team: team});
        var position = Positions.findOne({_id: obj.positionId}).position;
        var weightedString = "";
        switch(position){
            case "QB":
                weightedString = "weightedQBs";
                break;
            case "RB":
                weightedString = "weightedRBs";
                break;
            case "WR":
                weightedString = "weightedWRs";
                break;
            case "TE":
                weightedString = "weightedTEs";
                break;
        }
        var weighted = Session.get(weightedString);
        weighted = _.filter(weighted, function(w){return w.name!==player});
        Session.set(weightedString, weighted);

        var flexes = Session.get("weightedFLEXes");
        flexes = _.filter(flexes, function(f){return f.name!==player});
        Session.set("weightedFLEXes", flexes);

        Meteor.globals.excludes.push(obj);
        removeRow(row);
    },
    excludeDefense(event){
        event.preventDefault();
        var row = $(event.target).hasClass("fa") ? $(event.target).parent().parent().parent() : $(event.target).parent().parent();
        var team = row.children().children(".player-select").val();
        var obj = Teams.findOne({name: team});
        var dsts = Session.get("weightedDSTs");
        dsts = _.filter(dsts, function(f){return f.name!==team});

        Session.set("weightedDSTs", dsts);
        Meteor.globals.excludes.push(obj);
        removeRow(row);
    } ,
    undoExcludes(event){
        event.preventDefault();
        Meteor.globals.excludes = [];
        Session.set("weightedQBs", Session.get("allWeightedQBs"));
        Session.set("weightedRBs", Session.get("allWeightedRBs"));
        Session.set("weightedWRs", Session.get("allWeightedWRs"));
        Session.set("weightedTEs", Session.get("allWeightedTEs"));
        Session.set("weightedFLEXes", Session.get("allWeightedFLEXes"));
        Session.set("weightedDSTs", Session.get("allWeightedDSTs"));
    } ,
    lockPlayer(event){
        event.preventDefault();
        var row = $(event.target).hasClass("fa") ? $(event.target).parent().parent().parent() : $(event.target).parent().parent();

        if(!row.hasClass("locked")){
            if(!row.children().children(".player-select").val()) Meteor.globals.dangerGrowl("You haven't selected a player to lock");
            else{
                row.addClass("locked");
                row.children().children(".player-select").attr("disabled", "disabled");
                row.children().children(".exclude-btn").attr("disabled", "disabled");
                row.children().children(".clear-btn").attr("disabled", "disabled");
                row.children().children(".lock-button").children().removeClass("fa-lock");
                row.children().children(".lock-button").children().addClass("fa-unlock");
            }
        }
        else{
            row.removeClass("locked");
            row.children().children(".player-select").removeAttr("disabled");
            row.children().children(".exclude-btn").removeAttr("disabled");
            row.children().children(".clear-btn").removeAttr("disabled");
            row.children().children(".lock-button").children().removeClass("fa-unlock");
            row.children().children(".lock-button").children().addClass("fa-lock");
        }
    },
    clearRow(event){
        event.preventDefault();
        var selected = Session.get("selectedTeam");
        var row = $(event.target).hasClass("fa") ? $(event.target).parent().parent().parent() : $(event.target).parent().parent();
        var position = row.data("position");
        switch(position){
            case "QB":
                QB=null;
                break;
            case "RB1":
                RB1=null;
                break;
            case "RB2":
                RB2=null;
                break;
            case "WR1":
                WR1=null;
                break;
            case "WR2":
                WR2=null;
                break;
            case "WR3":
                WR3=null;
                break;
            case "TE":
                TE=null;
                break;
            case "FLEX":
                FLEX=null;
                break;
            case "D/ST":
                DST=null;
                break;
        }
        delete selected[position];
        Session.set("selectedTeam", selected);
        removeRow($(event.target).parent().parent().parent());
    },
    renderPositions() {
        return this.data.positions.map((pos) => {
            return <tr className="table-row" key={pos.key} data-position={pos.key}>
                    <td>
                        {pos.position}
                    </td>
                    <td>
                        <select className="player-select" defaultValue="" onChange={this.addPlayer}>
                            <option value="">Name -- Price -- Matchup</option>
                            {this.renderPlayers([pos.position])}
                        </select>
                    </td>
                    <td className="player-health"></td>
                    <td className="player-team"></td>
                    <td className="player-price"></td>
                    <td className="player-matchup"></td>
                    <td className="player-average"></td>
                    <td>
                        <a href="#" className="btn btn-danger btn-sm opts-btn exclude-btn" onClick={this.excludePlayer}><i className="fa fa-trash-o"></i></a>
                    </td>
                    <td>
                        <a href="#" className="btn btn-default btn-sm opts-btn lock-button" onClick={this.lockPlayer}><i className="fa fa-lock"></i></a>
                    </td>
                    <td>
                        <a href="#" className="btn btn-default btn-sm opts-btn clear-btn" onClick={this.clearRow}><i className="fa fa-eraser"></i></a>
                    </td>
                </tr>;
        });
    } ,
    renderFlexes(){
        return <tr className="table-row" key={"FLEX"} data-position="FLEX">
            <td>
                FLEX
            </td>
            <td>
                <select className="player-select" defaultValue="" onChange={this.addPlayer}>
                    <option value="">Name -- Price -- Matchup</option>
                    {this.renderPlayers(["RB", "WR", "TE"])}
                </select>
            </td>
            <td className="player-health"></td>
            <td className="player-team"></td>
            <td className="player-price"></td>
            <td className="player-matchup"></td>
            <td className="player-average"></td>
            <td>
                <a href="#" className="btn btn-danger btn-sm opts-btn exclude-btn" onClick={this.excludePlayer}><i className="fa fa-trash-o"></i></a>
            </td>
            <td>
                <a href="#" className="btn btn-default btn-sm opts-btn lock-button" onClick={this.lockPlayer}><i className="fa fa-lock"></i></a>
            </td>
            <td>
                <a href="#" className="btn btn-default btn-sm opts-btn clear-btn" onClick={this.clearRow}><i className="fa fa-eraser"></i></a>
            </td>
        </tr>;
    },
    renderDefenses(){
        return <tr className="table-row" data-position="D/ST">
            <td>
                D/ST
            </td>
            <td>
                <select className="player-select" defaultValue="" onChange={this.addDefense}>
                    <option value="" disabled>Name -- Price -- Matchup</option>
                    {this.renderDefenseOptions()}
                </select>
            </td>
            <td></td>
            <td className="player-team"></td>
            <td className="player-price"></td>
            <td className="player-matchup"></td>
            <td className="player-average"></td>
            <td>
                <a href="#" className="btn btn-danger btn-sm opts-btn exclude-btn" onClick={this.excludeDefense}><i className="fa fa-trash-o"></i></a>
            </td>
            <td>
                <a href="#" className="btn btn-default btn-sm opts-btn lock-button" onClick={this.lockPlayer}><i className="fa fa-lock"></i></a>
            </td>
            <td>
                <a href="#" className="btn btn-default btn-sm opts-btn clear-btn" onClick={this.clearRow}><i className="fa fa-eraser"></i></a>
            </td>
        </tr>;
    },
    renderOptimizeTable(){
       if(this.data.positions && this.data.positions.length>0 && this.data.weightedFLEXes.length>0){
           if(this.data.optimizing){
               return <div>
                   <div className="row">
                       <div className="text-center">
                           <h4 className="loading-message">Optimizing...</h4>
                       </div>
                   </div>
                   <div className="row">
                       <div className="loading-message text-center">
                           <i className="fa fa-cog fa-spin"></i>
                       </div>
                   </div>
               </div>
           }
           else{
               return <div>
                   <div className="row">
                       <div className="col-md-1 col-sm-1 col-xs-1">
                           <h4 className="form-label">Budget:</h4>
                       </div>
                       <div className="col-md-1 col-sm-1 col-xs-1">
                           <h4 className="form-label user-budget"> {this.data.nflbudget}</h4>
                       </div>
                       <div className="col-md-2 col-md-offset-3 col-sm-2 col-sm-offset-3 col-xs-2 col-xs-offset-2 text-center">
                           <a href="#" type="button" className="btn btn-success optimize-btn" onClick={this.reoptimize}>Optimize</a>
                       </div>
                       <div className="col-md-2 col-sm-3 col-xs-3 pull-right">
                           <a href="#" className="btn btn-danger undo-excludes-btn" onClick={this.undoExcludes}>Undo Excludes</a>
                       </div>
                   </div>
                   <table className="table table-striped table-condensed player-table">
                       <thead>
                       <tr className="table-row">
                           <th>Position</th>
                           <th width="20%">Name</th>
                           <th>Health</th>
                           <th>Team</th>
                           <th>Price</th>
                           <th>Matchup</th>
                           <th>Average</th>
                           <th>Exclude</th>
                           <th>Lock</th>
                           <th>Clear</th>
                       </tr>
                       </thead>
                       <tbody>
                       {this.renderPositions()}
                       {this.renderFlexes()}
                       {this.renderDefenses()}
                       </tbody>
                   </table>
                   <div className="row">
                       {this.renderWeightedButton()}
                   </div>
               </div>
           }
       }
        else{

           if(this.data.positions && this.data.positions.length>=4){
               var players = this.data.players;
               Meteor.setTimeout(function(){
                   var excludes = Meteor.globals.excludes;
                   var teamExcludes = _.pluck(_.filter(excludes, function(e){return !e.positionId;}), "_id");
                   var teams = Teams.find({_id: {$nin: teamExcludes}, price: {$ne: 0}}).fetch() || [];

                   var weeks = _.sortBy(_.compact(_.uniq(_.pluck(_.flatten(_.pluck(teams, "schedule") || []), "week") || [])), function(num){return num;});
                   if(weeks){
                       Session.set("currentWeek", _.max(_.filter(weeks, function(w){
                               w = parseInt(w);
                               return Players.findOne({history: {$elemMatch: {week: w}}});
                           }))+1);
                   }
                   if(Session.get("currentWeek") > parseInt(weeks[weeks.length]-1)) Session.set("currentWeek", parseInt(weeks[weeks.length-1]));
                   loadWeighted(players, teams);
               }, 500);
           }
           return <div>
               <div className="row">
                   <div className="text-center">
                       <h4 className="loading-message">Loading players and teams...</h4>
                   </div>
               </div>
               <div className="row">
                   <div className="loading-message text-center">
                       <i className="fa fa-cog fa-spin"></i>
                   </div>
               </div>
            </div>
       }
    } ,
    render() {
        
        return (
            <div>
                {this.renderOptimizeTable()}
                <div className="weightedModal modal fade" role="dialog">
                    <div className="modal-dialog weighted-dialog">
                        <div className="modal-content">
                            <div className="modal-header">
                                <button type="button" className="close" data-dismiss="modal">&times;</button>
                                <h4 className="modal-title">Value of Players</h4>
                            </div>
                            <div className="modal-body">
                                <ul className="nav nav-tabs">
                                    <li role="presentation" className="active"><a href="#weightedQB" data-toggle="tab">QB</a></li>
                                    <li role="presentation"><a href="#weightedRB" data-toggle="tab">RB</a></li>
                                    <li role="presentation"><a href="#weightedWR" data-toggle="tab">WR</a></li>
                                    <li role="presentation"><a href="#weightedTE" data-toggle="tab">TE</a></li>
                                    <li role="presentation"><a href="#weightedFLEX" data-toggle="tab">FLEX</a></li>
                                    <li role="presentation"><a href="#weightedDST" data-toggle="tab">D/ST</a></li>
                                </ul>
                                <div className="tab-content">
                                    {this.renderWeightedTables()}
                                </div>
                            </div>
                            <div className="modal-footer">
                                <a href="#" className="btn btn-default round-btn" type="button" data-dismiss="modal">Close</a>
                            </div>
                        </div>

                    </div>
                </div>
            </div>
        );
    }
});

function loadWeighted(players, teams){

    console.log("LOADING WEIGHTED", players, teams);
    var qbs = _.filter(players, function(p){return p.positionId._str===Positions.findOne({position: "QB"})._id._str;}) || [];
    //all wide receivers
    var wrs = _.filter(players, function(p){return p.positionId._str===Positions.findOne({position: "WR"})._id._str;}) || [];
    //all running backs
    var rbs = _.filter(players, function(p){return p.positionId._str===Positions.findOne({position: "RB"})._id._str;}) || [];
    //all tight ends
    var tes = _.filter(players, function(p){return p.positionId._str===Positions.findOne({position: "TE"})._id._str;}) || [];
    console.log("FOUND PLAYERS", qbs, rbs, wrs, tes);

    qbs = _.sortBy(findPlayerValue(qbs, "defenseVsQB"), function(p){return p.value;}).reverse();
    rbs = _.sortBy(findPlayerValue(rbs, "defenseVsRB"), function(p){return p.value;}).reverse();
    wrs = _.sortBy(findPlayerValue(wrs, "defenseVsWR"), function(p){return p.value;}).reverse();
    tes = _.sortBy(findPlayerValue(tes, "defenseVsTE"), function(p){return p.value;}).reverse();
    var flexes = _.sortBy(rbs.concat(wrs).concat(tes), function(a){return a.value;}).reverse();
    var t = _.sortBy(findTeamValue(teams), function(t){return t.value;}).reverse();

    var allP = Players.find({health: {$ne: "Out"}, price: {$ne: 0}}).fetch();
    _.each(allP, function(p){totalAvg+=p.average});
    totalAvg/=allP.length;

    Session.set("weightedQBs", qbs);
    Session.set("weightedRBs", rbs);
    Session.set("weightedWRs", wrs);
    Session.set("weightedTEs", tes);
    Session.set("weightedFLEXes", flexes);
    Session.set("weightedDSTs", t);
    Session.set("allWeightedQBs", qbs);
    Session.set("allWeightedRBs", rbs);
    Session.set("allWeightedWRs", wrs);
    Session.set("allWeightedTEs", tes);
    Session.set("allWeightedFLEXes", flexes);
    Session.set("allWeightedDSTs", t);
}

function optimize(){
    var locked = [];
    //Meteor.globals.nflBudget=50000;
    $(".locked").each(function() {
        if($(this).data("position")==="D/ST"){
            var t = Teams.findOne({name: $(this).children().children(".player-select").val()});
            locked.push({position: "D/ST", obj: t});
        }
        else{
            var name = $(this).children().children(".player-select").val();
            var team = $(this).data("team");
            var player = Players.findOne({name: name, team: team});
            locked.push({position: $(this).data("position"), obj: player});
        }
    });
    //console.log(locked);
    //Session.set("currentlyOptimizing", true);
    $(".processing").modal("show");
    Meteor.setTimeout(function(){
        fillRoster(locked);
        $(".processing").modal("hide");
    }, 1000);
}

function removeRow(row){
    row.removeData("team");
    var pos = row.data("position");
    switch(pos){
        case "QB":
            QB=null;
            break;
        case "RB1":
            RB1=null;
            break;
        case "RB2":
            RB2=null;
            break;
        case "WR1":
            WR1=null;
            break;
        case "WR2":
            WR2=null;
            break;
        case "WR3":
            WR3=null;
            break;
        case "TE":
            TE=null;
            break;
        case "FLEX":
            FLEX=null;
            break;
        case "D/ST":
            DST=null;
            break;
    }
    row.children().children(".player-select").val("");
    row.children(".player-health").children().text("");
    row.children(".player-team").children().text("");
    var price = parseInt(row.children(".player-price").children().text());
    changeBudget(-price);
    row.children(".player-price").children().text("");
    row.children(".player-matchup").children().text("");
    row.children(".player-average").children().text("");
}

function addDefenseRow(row, obj){
    row.children().children(".player-select").val(obj.name);
    var team = obj.name.split(" ");
    team = team[team.length-1];
    var html = "<p>"+team+"</p>";
    row.children(".player-team").append(html);
    html = "<p>"+obj.price || 0+"</p>";
    changeBudget(obj.price);
    row.children(".player-price").append(html);
    team = _.find(obj.schedule, function(s){return s.week===Session.get("currentWeek");}).team || "Not set yet";
    if(team!=="Not set yet"){
        team = team.split(' ');
        team = team[team.length-1];
    }
    html = "<p>"+ team +"</p>";
    row.children(".player-matchup").append(html);
    html = "<p>"+obj.average || 0+"</p>";
    row.children(".player-average").append(html);
}

function addRow(row, obj){
    row.data("team", obj.team);
    var disabled = row.children().children(".player-select").attr("disabled");
    if(disabled) row.children().children(".player-select").removeAttr("disabled");
    row.children().children(".player-select").val(obj.name);
    if(disabled) row.children().children(".player-select").attr("disabled", "disabled");
    var team = obj.team.split(" ");
    var html = "<p>"+team[team.length-1]+"</p>";
    row.children(".player-team").append(html);
    html = "<p>"+obj.health+"</p>";
    row.children(".player-health").append(html);
    html = "<p>"+obj.price+"</p>";
    changeBudget(obj.price);
    row.children(".player-price").append(html);
    var matchup = Teams.findOne({name: _.find(Teams.findOne({name: obj.team}).schedule, function(s){return s.week===Session.get("currentWeek");}).team }) || {};
    var teams = Teams.find({}).fetch();
    var position = Positions.findOne({_id: obj.positionId}).position;
    var defense=0, color="green", good, bad;
    if(matchup.name){
        switch(position){
            case "QB":
                defense = matchup.defenseVsQB;
                teams = _.sortBy(teams, function(t){return t.defenseVsQB;});
                good = teams[Math.round(teams.length/3)].defenseVsQB;
                bad = teams[Math.round(2*teams.length/3)].defenseVsQB;
                break;
            case "RB":
                defense = matchup.defenseVsRB;
                teams = _.sortBy(teams, function(t){return t.defenseVsRB;});
                good = teams[Math.round(teams.length/3)].defenseVsRB;
                bad = teams[Math.round(2*teams.length/3)].defenseVsRB;
                break;
            case "WR":
                defense = matchup.defenseVsWR;
                teams = _.sortBy(teams, function(t){return t.defenseVsWR;});
                good = teams[Math.round(teams.length/3)].defenseVsWR;
                bad = teams[Math.round(2*teams.length/3)].defenseVsWR;
                break;
            case "TE":
                defense = matchup.defenseVsTE;
                teams = _.sortBy(teams, function(t){return t.defenseVsTE;});
                good = teams[Math.round(teams.length/3)].defenseVsTE;
                bad = teams[Math.round(2*teams.length/3)].defenseVsTE;
                break;
        }
    }
    if(defense<good) color="red";
    else if(defense<bad) color="orange";
    var team = matchup.name;
    if(!team) team="Not set yet";
    else{
        var temp = team.split(" ");
        team = temp[temp.length-1].trim();
    }
    html = "<p><span style='color: "+color+";'}>"+team+"</span></p>";
    row.children(".player-matchup").append(html);
    html = "<p>"+obj.average+"</p>";
    row.children(".player-average").append(html);
}

function changeBudget(amount){
    amount = amount ? amount : 0;
    var old = Session.get("nflbudget");
    old-=amount;
    Session.set("nflbudget", old);
}

function fillRoster(locked){
    QB = RB1 = RB2 = WR1 = WR2 = WR3 = TE = FLEX = DST = null;
    //all players that the user locked (dont need to worry about defense)
    //var playerLocks = _.pluck(_.filter(locked, function(l){return l.positionId;}), "_id");
    //the objects the user excluded
    //var excludes = Meteor.globals.excludes;
    ////the players the user excluded
    //var playerExcludes = _.pluck(_.filter(excludes, function(e){return e.positionId;}), "_id").concat(playerLocks);
    ////the defenses the user excluded
    //var teamExcludes = _.pluck(_.filter(excludes, function(e){return !e.positionId;}), "_id");
    //
    //var teamnames = _.pluck(Teams.find({_id: {$nin: teamExcludes}, schedule: {$elemMatch: {"week": Session.get("currentWeek")}}}).fetch(), "name");
    //
    ////player objects
    //var players = Players.find({_id: {$nin: playerExcludes}, health: {$ne: "Out"}, team: {$in: teamnames}, price: {$ne: 0}}, {sort: {price: -1, name: 1}}).fetch();
    ////defense objects
    //var teams = Teams.find({_id: {$nin: teamExcludes}, schedule: {$elemMatch: {week: Session.get("currentWeek")}}}, {sort: {price: -1}}).fetch();
    //all quarterbacks
    //var qbs = _.filter(players, function(p){return p.positionId._str===Positions.findOne({position: "QB"})._id._str;}) || [];
    ////all wide receivers
    //var wrs = _.filter(players, function(p){return p.positionId._str===Positions.findOne({position: "WR"})._id._str;}) || [];
    ////all running backs
    //var rbs = _.filter(players, function(p){return p.positionId._str===Positions.findOne({position: "RB"})._id._str;}) || [];
    ////all tight ends
    //var tes = _.filter(players, function(p){return p.positionId._str===Positions.findOne({position: "TE"})._id._str;}) || [];

    var qbs = Session.get("weightedQBs");
    var rbs = Session.get("weightedRBs");
    var wrs = Session.get("weightedWRs");
    var tes = Session.get("weightedTEs");
    var flexes = Session.get("weightedFLEXes");
    var teams = Session.get("weightedDSTs");

    var price = 0;
    _.each(locked, function(p){
        //console.log(p);
        price+=p.obj.price;
        switch(p.position){
            case "QB":
                QB = _.find(qbs, function(q){return q.name===p.obj.name && q.team===p.obj.team});
                qbs = _.without(qbs, p.obj);
                break;
            case "RB1":
                RB1 =  _.find(rbs, function(q){return q.name===p.obj.name && q.team===p.obj.team});
                rbs = _.without(rbs, p.obj);
                break;
            case "RB2":
                RB2 = _.find(rbs, function(q){return q.name===p.obj.name && q.team===p.obj.team});
                rbs = _.without(rbs, p.obj);
                break;
            case "WR1":
                WR1 =  _.find(wrs, function(q){return q.name===p.obj.name && q.team===p.obj.team});
                wrs = _.without(wrs, p.obj);
                break;
            case "WR2":
                WR2 = _.find(wrs, function(q){return q.name===p.obj.name && q.team===p.obj.team});
                wrs = _.without(wrs, p.obj);
                break;
            case "WR3":
                WR3 =  _.find(wrs, function(q){return q.name===p.obj.name && q.team===p.obj.team});
                wrs = _.without(wrs, p.obj);
                break;
            case "FLEX":
                FLEX = _.find(flexes, function(q){return q.name===p.obj.name && q.team===p.obj.team});
                flexes = _.without(flexes, p.obj);
                break;
            case "TE":
                TE =  _.find(tes, function(q){return q.name===p.obj.name && q.team===p.obj.team});
                tes = _.without(tes, p.obj);
                break;
            case "D/ST":
                DST =  _.find(teams, function(q){return q.name===p.obj.name;});
                teams = _.without(teams, p.obj);
                break;
        }
    });

    var current = 50000-price; //how much money we have left

    //qbs = _.sortBy(findPlayerValue(qbs, "defenseVsQB"), function(p){return p.value;}).reverse();
    //rbs = _.sortBy(findPlayerValue(rbs, "defenseVsRB"), function(p){return p.value;}).reverse();
    //wrs = _.sortBy(findPlayerValue(wrs, "defenseVsWR"), function(p){return p.value;}).reverse();
    //tes = _.sortBy(findPlayerValue(tes, "defenseVsTE"), function(p){return p.value;}).reverse();
    //var flexes = _.sortBy(rbs.concat(wrs).concat(tes), function(a){return a.value;}).reverse();
    //teams = _.sortBy(findTeamValue(teams), function(t){return t.value;}).reverse();
    //
    //Session.set("weightedQBs", qbs);
    //Session.set("weightedRBs", rbs);
    //Session.set("weightedWRs", wrs);
    //Session.set("weightedTEs", tes);
    //Session.set("weightedFLEXes", flexes);
    //Session.set("weightedDSTs", teams);

    //console.log(QB, RB1, RB2, WR1, WR2, WR3, TE, FLEX, DST);

    findRemaining(qbs, rbs, wrs, tes, flexes, teams, current);

    //console.log(QB, RB1, RB2, WR1, WR2, WR3, TE, FLEX, DST);

    //var totalValue = (QB && QB.value ? QB.value : 0) + (RB1 && RB1.value? RB1.value : 0) + (RB2 && RB2.value? RB2.value : 0) +
    //    (WR1 && WR1.value? WR1.value : 0) + (WR2 && WR2.value? WR2.value : 0) + (WR3 && WR3.value? WR3.value : 0) +
    //    (TE && TE.value? TE.value : 0) + (FLEX && FLEX.value? FLEX.value : 0) + (DST && DST.value? DST.value : 0);
    //Meteor.globals.successGrowl("Optimized");
    //Session.set("currentlyOptimizing", false);

    if(QB && QB.name) addPlayerRow("QB", QB);
    if(RB1 && RB1.name) addPlayerRow("RB1", RB1);
    if(RB2 && RB2.name) addPlayerRow("RB2", RB2);
    if(WR1 && WR1.name) addPlayerRow("WR1", WR1);
    if(WR2 && WR2.name) addPlayerRow("WR2", WR2);
    if(WR3 && WR3.name) addPlayerRow("WR3", WR3);
    if(TE && TE.name) addPlayerRow("TE", TE);
    if(FLEX && FLEX.name) addPlayerRow("FLEX", FLEX);
    if(DST && DST.name) addTeamRow("D/ST", DST);
}

function findPlayerValue(players, filter){

    return _.map(players, function(p){
        var games = _.filter(p.history, function(g){return g.week<Session.get("currentWeek")});
        var average = p.average;
        var game = _.find(Teams.findOne({name: p.team}).schedule, function(s){return s.week===Session.get("currentWeek")});
        var home = game.home;
        var matchup = Teams.findOne({name: game.team});
        var defense = matchup[filter];

        //initial value of player, average out player average with defense average
        var value = (average+defense)/2;

        //console.log("looking at player", p.name);
        //console.log("initial", value);

        var total = 0;
        _.each(games, function(g){
            if(g.points>=30) total+=10;
            else if(g.points>=25) total+=8;
            else if(g.points>=20) total+=6;
            else if(g.points>=15) total+=4;
            else if(g.points<5) total-=10;
            else if(g.points<8) total-=8;
            else if(g.points<11) total-=6;
        });

        value+=games.length>0 ? (total/games.length) : 0;

        //console.log("value after my history", value);

        var playersAgainst = Players.find({positionId: p.positionId, history: {$elemMatch: {team: matchup.name}}}).fetch();

        total=0;
        _.each(playersAgainst, function(pa){
            var game = _.find(pa.history, function(h){return h.team===matchup.name;});
            if(game){
                if(game.points>=30) total+=10;
                else if(game.points>=25) total+=8;
                else if(game.points>=20) total+=6;
                else if(game.points>=15) total+=4;
                else if(game.points<5) total-=10;
                else if(game.points<8) total-=8;
                else if(game.points<11) total-=6;
            }
        });

        value+=playersAgainst.length>0 ? (total/playersAgainst.length) : 0;

        //console.log("value after defense history", value);

        //var difference = defense>average ? 1 : 1 + (defense-average)/(2*average);
        //var value = (p.value ? p.value : 0) + (p.average+defense)/2; //multiply the players average by the player's matchup defense against player's position
        //
        ////iterate over all games in player history and find total percent difference in players points earned vs average given up
        //var totalDifference = 0, numGames = 0;
        //_.each(games, function(g){
        //    var myPoints = g.points;
        //    var defenseAvg = Teams.findOne({name: g.team})[filter];
        //    if(defenseAvg){
        //        //console.log("My points versus defense avg ", p.name, myPoints, defenseAvg);
        //        totalDifference+=(myPoints-defenseAvg)/defenseAvg;
        //        numGames++;
        //    }
        //});
        //
        //_.each(_.filter(matchup.schedule, function(s){ return s.week<Session.get("currentWeek"); }), function(g){
        //    var players = Players.find({positionId: p.positionId, team: g.team, history: {$elemMatch: {week: g.week}}}).fetch();
        //    var points = _.map(players, function(pl){
        //        return _.find(pl.history, function(h){return h.week === g.week}).points;
        //    });
        //    var mostpoints = _.isEmpty(points) ? 0 : _.max(points);
        //    if(mostpoints && defense){
        //        //console.log("My points versus defense avg ", p.name, mostpoints, defense);
        //        totalDifference+=(mostpoints-defense)/defense;
        //        numGames++;
        //    }
        //});
        //
        //if(numGames && totalDifference){
        //    //console.log("Multiplying By ", p.name, (1+(totalDifference/numGames)));
        //    value*=(1+(totalDifference/numGames));
        //}
        //
        ////players that play away average 95% if the points of players that play at home
        //
        if(home){
            value*=(1.0294);
            //console.log("home game", value);
        }
        //
        ////there is a player in the same position that averages more than me that isnt injured
        if(Players.findOne({positionId: p.positionId, team: p.team, health: {$nin: ["Out", "Questionable"]}, average: {$gt: p.average+3}})){
            var ps = Players.find({positionId: p.positionId, team: p.team, health: {$nin: ["Out", "Questionable"]}, average: {$gt: p.average+3}}).fetch();
            var total = 0;
            _.each(ps, function(pa){
                if(p.history && pa.history && p.history[p.history.length-1].week > pa.history[pa.history.length-1].week){
                    total+=1+((average-pa.average)/pa.average);
                }
            });
            if(total){
                value*=(total/ps.length);
                //console.log("im not the starter", value);
            }
        }

        //there is a player in the same position that averages more than me that is injured
        else if(Players.findOne({positionId: p.positionId, team: p.team, health: {$in: ["Out", "Questionable"]}, average: {$gt: p.average+3}})){
            var ps = Players.find({positionId: p.positionId, team: p.team, health: {$in: ["Out", "Questionable"]}, average: {$gt: p.average+3}}).fetch();
            var total = 0, count = 0;
            _.each(ps, function(pa){
                //only add value if this is the first two games this player is playing with the starter injured
                //we dont want to add value for future games because 2 games is enough for a player to prove their worth
                if(!p.history || pa.history[pa.history.length-1].week + 1 >= p.history[p.history.length-1].week){
                    total+=1+((pa.average-average)/average);
                    count++;
                }
            });
            if(count>0){
                value*=(total/count);
                //console.log("starter is injured", value);
            }
        }
        //
        var lastThree = 0;
        if(p.history.length>=3 && p.history[p.history.length-3].week===Session.get("currentWeek")-3 && p.history[p.history.length-1].week===Session.get("currentWeek")-1){
            lastThree+=p.history[p.history.length-1].points;
            lastThree+=p.history[p.history.length-2].points;
            lastThree+=p.history[p.history.length-3].points;
            lastThree/=3;
            value *= _.min([_.max([1+(lastThree-average)/average, 0.7]), 1.4]);
            //console.log("after trend", value);
        }
        else if(Session.get("currentWeek")>3 && p.history && p.history[p.history.length-1].week!==Session.get("currentWeek")-1 && p.history.length<Session.get("currentWeek")/2){
            value*=0.5;
            //console.log("didnt play last week", value);
        }
        //
        //value*=difference;

        value = value<0 ? 0 : value;

        return _.extend(p, {value: Math.round(100.0*value)/100});
    });
}

function findTeamValue(teams){
    return _.map(teams, function(t){
        var players = Players.find({team: _.find(t.schedule, function(s){return s.week===Session.get("currentWeek")}).team}).fetch();
        var value = 0, num=0;
        _.each(players, function(p){
            num++;
            var defense;
            switch(Positions.findOne({_id: p.positionId}).position){
                case "QB":
                    defense = t.defenseVsQB;
                    break;
                case "RB":
                    defense = t.defenseVsQB;
                    break;
                case "WR":
                    defense = t.defenseVsQB;
                    break;
                case "TE":
                    defense = t.defenseVsQB;
                    break;
            }
            var val = defense*p.average;
            if(val>=300) value+=0;
            else if(val===0) value+=20;
            else value+=((-20/300)*val)+20;
        });
        value = num>0 ? Math.round(100.0*value/num)/100 : 0;
        return _.extend(t, {value: value});
    });
}

function findRemaining(qbs, rbs, wrs, tes, flexes, teams, budget){
    var tbudget = -1;

    //initialize indexes at the tops of each list (where valid)
    var qbi = 0, rb1i=0, rb2i=1, wr1i=0, wr2i=1, wr3i=2, tei=0, dsti=0, flexi=0;
    //while(rbs[rb2i].team === rbs[rb1i].team) rb2i++;
    //while(wrs[wr2i].team === wrs[wr1i].team) wr2i++;
    //while(wrs[wr3i].team === wrs[wr1i].team || wrs[wr3i].team === wrs[wr2i].team) wr3i++;
    var TQB, TRB1, TRB2, TWR1, TWR2, TWR3, TTE, TFLEX, TDST;

    var notValid = 1;
    while(notValid && flexi<flexes.length){
        var nvalidRb1 = 0, nvalidRb2 = 0, nvalidWr1 = 0, nvalidWr2 = 0, nvalidWr3 = 0, nvalidTe = 0;
        if(rb1i<rbs.length && flexes[flexi].name===rbs[rb1i].name) nvalidRb1 = 1;
        if(rb2i<rbs.length && flexes[flexi].name===rbs[rb2i].name) nvalidRb2 = 1;
        if(wr1i<wrs.length && flexes[flexi].name===wrs[wr1i].name) nvalidWr1 = 1;
        if(wr2i<wrs.length && flexes[flexi].name===wrs[wr2i].name) nvalidWr2 = 1;
        if(wr3i<wrs.length && flexes[flexi].name===wrs[wr3i].name) nvalidWr3 = 1;
        if(tei<tes.length && flexes[flexi].name===tes[tei].name) nvalidTe = 1;
        notValid = nvalidRb1 || nvalidRb2 || nvalidWr1 || nvalidWr2 || nvalidWr3 || nvalidTe;
        if(notValid) flexi++;
    }

    //initialize the return index of each index to be itself
    var bqb = qbi, brb1 = rb1i, brb2 = rb2i, bwr1 = wr1i, bwr2 = wr2i, bwr3 = wr3i, bte = tei, bflex = flexi, bdst = dsti;

    //while we are over budget...
    while(tbudget<0){
        //restart the budget and subtract the current value we have for each position
        var current = budget;
        if(!QB){
            TQB = qbs.length>0 ? qbs[qbi] : {price: 0};
            current-=TQB.price;
        }
        if(!RB1){
            TRB1 = rbs.length>0 ? rbs[rb1i] : {price: 0};
            current-=TRB1.price;
        }
        if(!RB2){
            TRB2 = rbs.length>1 ? rbs[rb2i] : {price: 0};
            current-=TRB2.price;
        }
        if(!WR1){
            TWR1 = wrs.length>0 ? wrs[wr1i] : {price: 0};
            current-=TWR1.price;
        }
        if(!WR2){
            TWR2= wrs.length>1 ? wrs[wr2i] : {price: 0};
            current-=TWR2.price;
        }
        if(!WR3){
            TWR3 = wrs.length>2 ? wrs[wr3i] : {price: 0};
            current-=TWR3.price;
        }
        if(!TE){
            TTE = tes.length>0 ? tes[tei] : {price: 0};
            current-=TTE.price;
        }
        if(!FLEX){
            TFLEX = flexes.length>flexi ? flexes[flexi] : {price: 0};
            current-=TFLEX.price;
        }
        if(!DST){
            TDST = teams.length>dsti ? teams[dsti] : {price: 0};
            current-=TDST.price;
        }
        tbudget=current;
        //if we are still over budget we need to find the next index for each position
        if(tbudget<0){
            //initialize each value loss at position to be high
            var qbloss = 1000, rb1loss = 1000, rb2loss = 1000, wr1loss = 1000, wr2loss = 1000, wr3loss = 1000, teloss = 1000, flexloss = 1000, dstloss = 1000;
            //default set the next index to be one more
            var qbii=qbi+1, rb1ii=rb1i+1, rb2ii=rb2i+1, wr1ii=wr1i+1, wr2ii=wr2i+1, wr3ii=wr3i+1, teii=tei+1, flexii=flexi+1, dstii=dsti+1;

            //if(qbii<qbs.length && qbs[qbii].price >= qbs[qbi].price) qbii++;
            //while(rb1ii<rbs.length && (rbs[rb1ii].price >= rbs[rb1i].price || rb1ii===rb2i || rbs[rb1ii]===flexes[flexi])) rb1ii++;
            //while(rb2ii<rbs.length && (rbs[rb2ii].price >= rbs[rb2i].price || rb2ii===rb1i || rbs[rb2ii]===flexes[flexi])) rb2ii++;
            //while(wr1ii<wrs.length && (wrs[wr1ii].price >= wrs[wr1i].price || wr1ii===wr2i || wr1ii===wr3i || wrs[wr1ii]===flexes[flexi])) wr1ii++;
            //while(wr2ii<wrs.length && (wrs[wr2ii].price >= wrs[wr2i].price || wr2ii===wr1i || wr2ii===wr3i || wrs[wr2ii]===flexes[flexi])) wr2ii++;
            //while(wr3ii<wrs.length && (wrs[wr3ii].price >= wrs[wr3i].price || wr3ii===wr1i || wr3ii===wr2i || wrs[wr3ii]===flexes[flexi])) wr3ii++;
            //while(teii<tes.length && (tes[teii].price >= tes[tei].price || tes[teii]===flexes[flexi])) teii++;
            //while(flexii<flexes.length && (flexes[flexii].price >= flexes[flexi].price || flexes[flexii]===rbs[rb1i] || flexes[flexii]===rbs[rb2i] || flexes[flexii]===wrs[wr1i] || flexes[flexii]===wrs[wr2i] || flexes[flexii]===wrs[wr3i] || flexes[flexii]===tes[tei])) flexii++;
            //if(dstii<teams.length && teams[dstii].price >= teams[dsti].price) dstii++;

            //adjust new indexes where needed
            while(rb1ii<rbs.length && (rb1ii===rb2i || rbs[rb1ii].name===flexes[flexi].name)) rb1ii++;
            while(rb2ii<rbs.length && (rb2ii===rb1i || rbs[rb2ii].name===flexes[flexi].name)) rb2ii++;
            while(wr1ii<wrs.length && (wr1ii===wr2i || wr1ii===wr3i || wrs[wr1ii].name===flexes[flexi].name)) wr1ii++;
            while(wr2ii<wrs.length && (wr2ii===wr1i || wr2ii===wr3i || wrs[wr2ii].name===flexes[flexi].name)) wr2ii++;
            while(wr3ii<wrs.length && (wr3ii===wr1i || wr3ii===wr2i || wrs[wr3ii].name===flexes[flexi].name)) wr3ii++;
            while(teii<tes.length && (tes[teii].name===flexes[flexi].name)) teii++;
            while(flexii<flexes.length && (flexes[flexii].name===rbs[rb1i].name || flexes[flexii].name===rbs[rb2i].name
                || flexes[flexii].name===wrs[wr1i].name || flexes[flexii].name===wrs[wr2i].name
                || flexes[flexii].name===wrs[wr3i].name || flexes[flexii].name===tes[tei].name)) flexii++;

            var min = 1.00;

            //calculate the value loss at each position
            if(qbii<qbs.length && qbii!==qbi) qbloss = _.min([Math.round(100.0*(qbs[qbi].value-qbs[qbii].value))/100, min]);
            if(rb1ii<rbs.length && rb1ii!==rb1i && rb1ii!==rb2i) rb1loss = _.min([Math.round(100.0*(rbs[rb1i].value-rbs[rb1ii].value))/100, min]);
            if(rb2ii<rbs.length && rb2ii!==rb2i && rb2ii!==rb1i) rb2loss = _.min([Math.round(100.0*(rbs[rb2i].value-rbs[rb2ii].value))/100, min]);
            if(wr1ii<wrs.length && wr1ii!==wr1i && wr1ii!==wr2i && wr1ii!==wr3i) wr1loss = _.min([Math.round(100.0*(wrs[wr1i].value-wrs[wr1ii].value))/100, min]);
            if(wr2ii<wrs.length && wr2ii!==wr2i && wr2ii!==wr1i && wr2ii!==wr3i) wr2loss = _.min([Math.round(100.0*(wrs[wr2i].value-wrs[wr2ii].value))/100, min]);
            if(wr3ii<wrs.length && wr3ii!==wr3i && wr3ii!==wr1i && wr3ii!==wr2i) wr3loss = _.min([Math.round(100.0*(wrs[wr3i].value-wrs[wr3ii].value))/100, min]);
            if(teii<tes.length && teii!==tei) teloss = _.min([Math.round(100.0*(tes[tei].value-tes[teii].value))/100, min]);
            if(dstii<teams.length && dstii!==dsti) dstloss = _.min([Math.round(100.0*(teams[dsti].value-teams[dstii].value))/100, min]);
            if(flexii<flexes.length && flexii!==flexi) flexloss = _.min([Math.round(100.0*(flexes[flexi].value-flexes[flexii].value))/100, min]);

            //console.log("new indexes", qbi, qbii, rb1i, rb1ii, rb2i, rb2ii, wr1i, wr1ii, wr2i, wr2ii, wr3i, wr3ii, tei, teii, flexi, flexii, dsti, dstii);
            //console.log("losses by position", qbloss, rb1loss, rb2loss, wr1loss, wr2loss, wr3loss, teloss, flexloss, dstloss);

            //find the smallest value loss
            var smallest = _.min([qbloss, rb1loss, rb2loss, wr1loss, wr2loss, wr3loss, teloss, flexloss, dstloss]);

            var randIndex = -1;
            if(smallest === min){
                randIndex = Math.floor(Math.random()*8)+1;
            }

            //console.log("smallest", smallest, randIndex);
            //console.log(smallest===dstloss);
            //console.log((randIndex===-1 || randIndex===9));

            //adjust index of the smallest value loss
            if(smallest===qbloss && (randIndex===-1 || randIndex===1)){
                //console.log("changing qb");
                qbi = qbii;
            }
            else if(smallest===rb1loss && (randIndex===-1 || randIndex===2)){
                //console.log("changing rb1");
                rb1i = rb1ii;
            }
            else if(smallest===rb2loss && (randIndex===-1 || randIndex===3)){
                //console.log("changing rb2");
                rb2i = rb2ii;
            }
            else if(smallest===wr1loss && (randIndex===-1 || randIndex===4)){
                //console.log("changing wr1");
                wr1i = wr1ii;
            }
            else if(smallest===wr2loss && (randIndex===-1 || randIndex===5)){
                //console.log("changing wr2");
                wr2i = wr2ii;
            }
            else if(smallest===wr3loss && (randIndex===-1 || randIndex===6)){
                //console.log("changing wr3");
                wr3i = wr3ii;
            }
            else if(smallest===teloss && (randIndex===-1 || randIndex===7)){
                //console.log("changing te");
                tei = teii;
            }
            else if(smallest===flexloss && (randIndex===-1 || randIndex===8)){
                //console.log("changing flex");
                flexi = flexii;
            }
            else if(smallest===dstloss && (randIndex===-1 || randIndex===9)){
                //console.log("changing dst");
                dsti = dstii;
            }

        }
    }


    //check to see if we can go back up the list to find a player(s) of higher value
    var remaining = tbudget;
    while(remaining>=0){
        var qinc = 0, rb1inc = 0, rb2inc = 0, wr1inc = 0, wr2inc = 0, wr3inc = 0, teinc = 0, flexinc = 0, dstinc = 0;
        var tq = qbi-1, trb1 = rb1i-1, trb2 = rb2i-1, twr1 = wr1i-1, twr2 = wr2i-1, twr3 = wr3i-1, tte = tei-1, tflex = flexi-1, tdst = dsti-1;
        var ttq, ttrb1, ttrb2, ttwr1, ttwr2, ttwr3, ttte, ttflex, ttdst;

        while(tq>0 && TQB){
            if(qbs[tq].value>qbs[qbi].value && (remaining+qbs[qbi].price)>=qbs[tq].price){
                qinc = qbs[tq].value - qbs[qbi].value;
                ttq = tq;
            }
            tq--;
        }

        while(trb1>0 && TRB1){
            if(rbs[trb1].value>rbs[rb1i].value && rbs[trb1].name!==rbs[rb2i].name && rbs[trb1].name!==flexes[flexi].name && (remaining+rbs[rb1i].price)>=rbs[trb1].price){
                rb1inc = rbs[trb1].value - rbs[rb1i].value;
                ttrb1 = trb1;
            }
            trb1--;
        }

        while(trb2>0 && TRB2){
            if(rbs[trb2].value>rbs[rb2i].value && rbs[trb2].name!==rbs[rb1i].name && rbs[trb2].name!==flexes[flexi].name && (remaining+rbs[rb2i].price)>=rbs[trb2].price){
                rb2inc = rbs[trb2].value - rbs[rb2i].value;
                ttrb2 = trb2;
            }
            trb2--;
        }

        while(twr1>0 && TWR1){
            if(wrs[twr1].value>wrs[wr1i].value && wrs[twr1].name!==wrs[wr2i].name && wrs[twr1].name!==wrs[wr3i].name && wrs[twr1].name!==flexes[flexi].name && (remaining+wrs[wr1i].price)>=wrs[twr1].price){
                wr1inc = wrs[twr1].value - wrs[wr1i].value;
                ttwr1 = twr1;
            }
            twr1--;
        }

        while(twr2>0 && TWR2){
            if(wrs[twr2].value>wrs[wr2i].value && wrs[twr2].name!==wrs[wr1i].name && wrs[twr2].name!==wrs[wr3i].name && wrs[twr2].name!==flexes[flexi].name && (remaining+wrs[wr2i].price)>=wrs[twr2].price){
                wr2inc = wrs[twr2].value - wrs[wr2i].value;
                ttwr2 = twr2;
            }
            twr2--;
        }

        while(twr3>0 && TWR3){
            if(wrs[twr3].value>wrs[wr3i].value && wrs[twr3].name!==wrs[wr1i].name && wrs[twr3].name!==wrs[wr2i].name && wrs[twr3].name!==flexes[flexi].name && (remaining+wrs[wr3i].price)>=wrs[twr3].price){
                wr3inc = wrs[twr3].value - wrs[wr3i].value;
                ttwr3 = twr3;
            }
            twr3--;
        }


        while(tte>0 && TTE){
            if(tes[tte].value>tes[tei].value && tes[tte].name!==flexes[flexi].name && (remaining+tes[tei].price)>=tes[tte].price){
                teinc = tes[tte].value - tes[tei].value;
                ttte = tte;
            }
            tte--;
        }


        while(tflex>0 && TFLEX){
            if(flexes[tflex].value>flexes[flexi].value && flexes[tflex].name!==rbs[rb1i].name && flexes[tflex].name!==rbs[rb2i].name && flexes[tflex].name!==wrs[wr1i].name && flexes[tflex].name!==wrs[wr2i].name && flexes[tflex].name!==tes[tei].name && flexes[tflex].name!==wrs[wr3i].name && (remaining+flexes[flexi].price)>=flexes[tflex].price){
                flexinc = flexes[tflex].value - flexes[flexi].value;
                ttflex = tflex;
            }
            tflex--;
        }


        while(tdst>0 && TDST){
            if(teams[tdst].value>teams[dsti].value && (remaining+teams[dsti].price)>=teams[tdst].price){
                dstinc = teams[tdst].value - teams[dsti].value;
                ttdst = tdst;
            }
            tdst--;
        }

        var max = _.max([qinc, rb1inc, rb2inc, wr1inc, wr2inc, wr3inc, teinc, flexinc, dstinc]);
        if(max===0) break; //cant increase anywhere
        else if(max===qinc){
            remaining += qbs[qbi].price;
            qbi = ttq;
            remaining -= qbs[qbi].price;
            TQB = qbs[qbi];
        }
        else if(max===rb1inc){
            remaining += rbs[rb1i].price;
            rb1i = ttrb1;
            remaining -= rbs[rb1i].price;
            TRB1 = rbs[rb1i];
        }
        else if(max===rb2inc){
            remaining += rbs[rb2i].price;
            rb2i = ttrb2;
            remaining -= rbs[rb2i].price;
            TRB2 = rbs[rb2i];
        }
        else if(max===wr1inc){
            remaining += wrs[wr1i].price;
            wr1i = ttwr1;
            remaining -= wrs[wr1i].price;
            TWR1 = wrs[wr1i];
        }
        else if(max===wr2inc){
            remaining += wrs[wr2i].price;
            wr2i = ttwr2;
            remaining -= wrs[wr2i].price;
            TWR2 = wrs[wr2i];
        }
        else if(max===wr3inc){
            remaining += wrs[wr3i].price;
            wr3i = ttwr3;
            remaining -= wrs[wr3i].price;
            TWR3 = wrs[wr3i];
        }
        else if(max===teinc){
            remaining += tes[tei].price;
            tei = ttte;
            remaining -= tes[tei].price;
            TTE = tes[tei];
        }
        else if(max===flexinc){
            remaining += flexes[flexi].price;
            flexi = ttflex;
            remaining -= flexes[flexi].price;
            TFLEX = flexes[flexi];
        }
        else if(max===dstinc){
            remaining += teams[dsti].price;
            dsti = ttdst;
            remaining -= teams[dsti].price;
            TDST = teams[dsti];
        }
    }


    if(!QB) QB=TQB;
    if(!RB1) RB1=TRB1;
    if(!RB2) RB2=TRB2;
    if(!WR1) WR1 = TWR1;
    if(!WR2) WR2 = TWR2;
    if(!WR3) WR3 = TWR3;
    if(!TE) TE = TTE;
    if(!FLEX) FLEX = TFLEX;
    if(!DST) DST = TDST;

}

function getValueOfTeam(qb, rb1, rb2, wr1, wr2, wr3, te, flex, dst){
    var val = 0;
    val += qb?qb.value:0;
    val += rb1?rb1.value:0;
    val += rb2?rb2.value:0;
    val += wr1?wr1.value:0;
    val += wr2?wr2.value:0;
    val += wr3?wr3.value:0;
    val += te?te.value:0;
    val += flex?flex.value:0;
    val += dst?dst.value:0;
    return val;
}

function getPriceOfTeam(qb, rb1, rb2, wr1, wr2, wr3, te, flex, dst){
    return (qb ? qb.price : 0 + rb1 ? rb1.price : 0 + rb2 ? rb2.price : 0 + wr1 ? wr1.price : 0 +
    wr2 ? wr2.price : 0 + wr3 ? wr3.price : 0 + te ? te.price : 0 + flex ? flex.price : 0 + dst ? dst.price : 0);
}

function addPlayerRow(select, obj){
    if(obj){
        var row = $(".table-row[data-position='"+select+"']");
        removeRow(row, obj);
        Meteor.setTimeout(function(){
            addRow(row, obj);
        }, 10);
    }
}

function addTeamRow(select, obj){
    if(obj){
        var row = $(".table-row[data-position='"+select+"']");
        removeRow(row, obj);
        Meteor.setTimeout(function(){
            addDefenseRow(row, obj);
        }, 10);
    }
}
