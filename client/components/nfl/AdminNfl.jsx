Session.set("currentFilter", {positionId: "", team: ""});
Session.set("paginationSkip", 0);
Session.set("paginationLimit", 25);

PlayerHistory = React.createClass({
    mixins: [ReactMeteorData],
    getMeteorData(){
        return {
            teams: Teams.find({}, {sort: {name: 1}}).fetch() || [],
            selectedPlayer : Session.get("selectedPlayer")
        }
    },
    doNothing(event){
    },
    renderHistory(){
        var player = this.data.selectedPlayer;
        var weeks = [1,2,3,4,5,6,7,8,9,10,11,12,13,14,15,16,17];
        return weeks.map((w)=>{
            var points = "", team = "", game = null, teamobj = null, enemy = null, away="";
            if(player) {
                if (_.find(player.history, function (s) {return s.week === w;})) game = _.find(player.history, function (s) {return s.week === w;});
                if (game) points = game.points;
                teamobj = Teams.findOne({name: player.team});
                if (teamobj && teamobj.schedule && _.find(teamobj.schedule, function (s) {return s.week === w;})) enemy = _.find(teamobj.schedule, function (s) {return s.week === w;});
                if(enemy){
                    team = enemy.team;
                    if(!enemy.home) away = "@";
                }
                return <div key={w} className="row player-matchup" data-week={w}>
                    <div className="col-md-1 col-sm-1 col-xs-1">
                        <label className="form-label history-form">{w}:</label>
                    </div>
                    <div className="col-md-7 col-sm-7 col-xs-6">
                        <h4 className="history-form">{away + team}</h4>
                    </div>
                    <div className="col-md-3 col-sm-3 col-xs-4 points-container pull-right">
                        <input type="text" className="input-form history-form" placeholder="Points" value={points} onChange={this.doNothing}/>
                    </div>
                </div>
            }
        });
    } ,
    render(){
        return(
            <div>{this.renderHistory()}</div>
        )
    }

});

TeamSchedule = React.createClass({
    mixins: [ReactMeteorData],
    getMeteorData(){
        return {
            teams: Teams.find({}, {sort: {name: 1}}).fetch() || [],
            selectedTeam : Session.get("selectedTeam")
        }
    },
    doNothing(){

    },
    renderTeams(){
        return this.data.teams.map((pos) => {
            return <option value={pos.name} key={pos.name}>{pos.name}</option>
        });
    } ,
    renderSchedule(){
        var team = this.data.selectedTeam;
        var weeks = [1,2,3,4,5,6,7,8,9,10,11,12,13,14,15,16,17];
        return weeks.map((w)=>{
            var val = "";
            var home = false;
            if(team && _.find(team.schedule, function(s){return s.week===w;})) val = _.find(team.schedule, function(s){return s.week===w}).team;
            if(team && _.find(team.schedule, function(s){return s.week===w;})) home = _.find(team.schedule, function(s){return s.week===w}).home;
            return <div className="row team-matchup" data-week={w} key={w}>
                <div className="col-md-1">
                    <label className="form-label history-form">{w}:</label>
                </div>
                <div className="col-md-6 col-md-offset-1">
                    <select className="input-form history-form" value={val} onChange={this.doNothing}>
                        <option value="">Select A Team</option>
                        {this.renderTeams()}
                    </select>
                </div>
                <div className="col-md-4 text-center">
                    <label className="isHomeGame"><input type="checkbox" className="homeGameCheck" checked={home} onChange={this.doNothing}/>Home Game?</label>
                </div>
            </div>
        });
    } ,
   render(){
       return(
          <div>{this.renderSchedule()}</div>
       )
   }
});

PlayerTab = React.createClass({
    mixins: [ReactMeteorData],
    getMeteorData(){
        var filter = Session.get("currentFilter");
        var nf={};
        if(filter.positionId && !(typeof filter.positionId==="string")) nf = _.extend(nf, {positionId: filter.positionId});
        if(filter.team && filter.team.trim()!=="") nf = _.extend(nf, {team: filter.team});
        Session.set("paginationLimit", Players.find({}).fetch().length/5);
        return {
            players: Players.find(nf, {sort: {average: -1, name: 1}, skip: Session.get("paginationSkip"), limit: Session.get("paginationLimit")}).fetch() || [],
            totalPlayers: Players.find({}).fetch().length,
            teams: Teams.find({}, {sort: {name: 1}}).fetch() || [],
            positions: Positions.find({}).fetch() || [],
            currentUser: Meteor.user(),
            selectedPlayer : Session.get("selectedPlayer")
        }
    },
    updatePaging(event){
        event.preventDefault();
        var val = parseInt($(event.target).data("value"));
        var totalPlayers = Players.find({}).fetch().length;
        Session.set("paginationSkip", totalPlayers/5*(val-1));
        $(event.target).parent().siblings().removeClass("active");
        $(event.target).parent().addClass("active");
    },
    renderTeams(){
        return this.data.teams.map((pos) => {
            return <option value={pos.name} key={pos.name}>{pos.name}</option>
        });
    } ,
    changeFilter(){
        var team = $(".team-filter").val();
        var position = $(".position-filter").val();
        var filter = Session.get("currentFilter");
        if(team){
            _.extend(filter, {team: team});
        }
        if(position && position.trim()!==""){
            position = Positions.findOne({position: position})._id;
            _.extend(filter, {positionId: position});
        }
        Session.set("currentFilter", filter);
    },
    toggleFilter(event){
        //console.log($(".filter-menu"));
        $(".filter-menu").toggleClass("open");
    },
    clearFilter(){
        Session.set("currentFilter", {positionId: "", team: ""});
        $(".team-filter").val("");
        $(".position-filter").val("");
    },
    changePlayerHealth(event){
        var id = $(event.target).parent().parent().data("id");
        var health = $(event.target).val();
        Players.update({_id: id}, {$set: {health: health}});
    },
    changePlayerPrice(event){
        var id = $(event.target).parent().parent().data("id");
        var price = parseInt($(event.target).val());
        if(!price) Meteor.globals.dangerGrowl("Player needs a valid price");
        else Players.update({_id: id}, {$set: {price: price}});
    },
    changePlayerName(event){
        var id = $(event.target).parent().parent().data("id");
        var player = $(event.target).val();
        var team = $(event.target).parent().parent().data("team");
        if(!player || player.trim()==="") Meteor.globals.dangerGrowl("Player requires non empty name");
        else if(Players.findOne({name: player, team: team})) Meteor.globals.dangerGrowl("Player already exists with that name");
        else Players.update({_id: id}, {$set: {name: player}});
    },
    changePlayerPosition(event){
        var id = $(event.target).parent().parent().data("id");
        var position = $(event.target).val();
        Players.update({_id: id}, {$set: {positionId: Positions.findOne({position: position})._id}});
    },
    removePlayer(event){
        event.preventDefault();
        var target = $(event.target).hasClass("fa") ? $(event.target).parent() : $(event.target);
        Players.remove({_id: target.data("id")});
    },
    renderPositions() {
        var positions = _.uniq(this.data.positions, function(p){return p.position;});
        return positions.map((pos) => {
            if(pos.name!=="D/ST") return <option value={pos.position} key={pos.key}>{pos.position}</option>
        });
    } ,
    editPlayerHistory(event){
        event.preventDefault();
        var row = $(event.target).hasClass("fa") ? $(event.target).parent().parent().parent() : $(event.target).parent().parent();
        var player = row.data("player");
        var team = row.data("team");
        var obj = Players.findOne({name: player, team: team});
        console.log(obj, player, team);
        if(obj){
            Session.set("selectedPlayer", obj);
            Meteor.setTimeout(function(){
                $(".addMatchup").modal("show");
            }, 10);
        }
    } ,
    saveHistory(){
        var player = this.data.selectedPlayer;
        var id = Players.findOne({name: player.name, team: player.team})._id;
        var total=0, num=0;
        var matchups=[];
        $(".player-matchup").each(function(){
            var week = $(this).data("week");
            var team = week && _.find(Teams.findOne({name: player.team}).schedule, function(s){return s.week===week;})
                ? _.find(Teams.findOne({name: player.team}).schedule, function(s){return s.week===week;}).team : null;
            var points = $(this).children(".points-container").children(".input-form").val();
            if(week && team && points){
                num++;
                points = parseFloat(points);
                total+=points;
                matchups.push({team: team, points: points, week: week});
            }
        });
        if(matchups.length>0){
            Meteor.call("updateMatchups", id, matchups, function(res){
                if(res) Meteor.globals.dangerGrowl("error updating matchups");
            });
        }
        if(num){
            Meteor.call("updatePlayerAverage", id, Math.round(total * 100.0 / num) / 100);
        }
        Session.set("selectedPlayer", {});
        $(".addMatchup").modal("hide");
    } ,
    renderPlayersWithStats(){
        return this.data.players.map((player) => {
            return <tr key={player.name + player.team} data-player={player.name} data-team={player.team} className="table-row" data-id={player._id}>
                <td><input type="text" defaultValue={player.name} onBlur={this.changePlayerName}/></td>
                <td>
                    <select defaultValue={player.health} onChange={this.changePlayerHealth}>
                        <option value="Out">Out</option>
                        <option value="Questionable">Questionable</option>
                        <option value="Probable">Probable</option>
                        <option value="Healthy">Healthy</option>
                    </select>
                </td>
                <td>
                    <select defaultValue={Positions.findOne({_id: player.positionId}).position} onChange={this.changePlayerPosition}>
                        <option value="QB">QB</option>
                        <option value="RB">RB</option>
                        <option value="WR">WR</option>
                        <option value="TE">TE</option>
                    </select>
                </td>
                <td>{player.team}</td>
                <td>{player.average || 0}</td>
                <td><input type="text" defaultValue={player.price} onBlur={this.changePlayerPrice}/></td>
                <td>
                    <a href="#" className="btn btn-default player-btn edit-history" onClick={this.editPlayerHistory}><i className="fa fa-pencil"></i></a>
                </td>
                <td>
                    <a href="#" className="btn btn-danger player-btn delete-player" onClick={this.removePlayer} data-id={player._id}><i className="fa fa-times"></i></a>
                </td>
            </tr>
        });
    } ,
    render(){
        return(
        <div id="editPlayersTab" className="tab-pane fade in active">
            <div className="row filter">
                <div className="col-md-6 col-sm-6 col-xs-6 col-md-offset-3 col-sm-offset-3 col-xs-offset-3 text-center">
                    <nav>
                        <ul className="pagination">
                            <li className="active"><a href="#" data-value="1" onClick={this.updatePaging}>1</a></li>
                            <li><a href="#" data-value="2" onClick={this.updatePaging}>2</a></li>
                            <li><a href="#" data-value="3" onClick={this.updatePaging}>3</a></li>
                            <li><a href="#" data-value="4" onClick={this.updatePaging}>4</a></li>
                            <li><a href="#" data-value="5" onClick={this.updatePaging}>5</a></li>
                        </ul>
                    </nav>
                </div>
                <div className="col-md-1 col-sm-1 col-xs-1 pull-right filter-menu">
                    <button type="button" className="btn btn-default dropdown-toggle filter-dropdown" aria-haspopup="true" aria-expanded="false" onClick={this.toggleFilter}>
                        Filter <span className="caret"></span>
                    </button>
                    <ul className="dropdown-menu">
                        <div className="filter-container">
                            <li><label className="form-label">Team:</label>
                                <select defaultValue={Session.get("currentFilter").team} className="team-filter input-form history-form" onChange={this.changeFilter}>
                                    <option value="" disabled>Filter By Team</option>
                                    {this.renderTeams()}
                                </select></li>
                            <li><label className="form-label">Position:</label>
                                <select defaultValue={Session.get("currentFilter").team} className="position-filter input-form history-form" onChange={this.changeFilter}>
                                    <option value="" disabled>Filter By Position</option>
                                    {this.renderPositions()}
                                </select></li>
                            <li><a href="#" className="btn btn-info round-btn clear-filter-btn" onClick={this.clearFilter}>Clear Filter</a></li>
                        </div>
                    </ul>
                </div>
            </div>
            <table className="table table-striped table-condensed player-table">
                <thead>
                <tr className="table-row">
                    <th> Name </th>
                    <th> Health </th>
                    <th> Position </th>
                    <th> Team </th>
                    <th> Average </th>
                    <th> Price </th>
                    <th> Edit History </th>
                    <th> Delete </th>
                </tr>
                </thead>
                <tbody>
                {this.renderPlayersWithStats()}
                </tbody>
            </table>
            <div className="addMatchup modal fade" role="dialog">
                <div className="modal-dialog">
                    <div className="modal-content">
                        <div className="modal-header">
                            <button type="button" className="close" data-dismiss="modal">&times;</button>
                            <h4 className="modal-title">Add Matchups</h4>
                        </div>
                        <div className="modal-body">
                            <div className="history-container">
                                <label className="form-label">History:</label>
                                <PlayerHistory />
                            </div>
                        </div>
                        <div className="modal-footer">
                            <a href="#" className="btn btn-success round-btn" type="button" onClick={this.saveHistory}>Save</a>
                            <a href="#" className="btn btn-default round-btn" type="button" data-dismiss="modal">Cancel</a>
                        </div>
                    </div>

                </div>
            </div>
        </div>
    )
    }
});

TeamTab = React.createClass({
    mixins: [ReactMeteorData],

    // Loads items from the Tasks collection and puts them on this.data.tasks
    getMeteorData() {
        var filter = Session.get("currentFilter");
        var nf={};
        if(filter.positionId && !(typeof filter.positionId==="string")) nf = _.extend(nf, {positionId: filter.positionId});
        if(filter.team && filter.team.trim()!=="") nf = _.extend(nf, {team: filter.team});
        return {
            players: Players.find(nf, {sort: {average: -1, name: 1}}).fetch() || [],
            teams: Teams.find({}, {sort: {name: 1}}).fetch() || [],
            positions: Positions.find({}).fetch() || [],
            selectedTeam: Session.get("selectedTeam")
        }
    },
    renderTeams(){
        return this.data.teams.map((pos) => {
            return <option value={pos.name} key={pos.name}>{pos.name}</option>
        });
    } ,
    findDefenseValue(position, team){
        var posId = Positions.findOne({position: position})._id;
        var players = Players.find({positionId: posId}).fetch();
        var total = 0, num = 0;
        _.each(players, function(p){
            var games = _.filter(p.history, function(h){return h.team===team;});
            _.each(games, function(g){
                total+=g.points;
                num++;
            });
        });
        var average = num===0 ? 0 : Math.round(total * 100.0 / num) / 100;
        Meteor.call("updateDefense", team, average, position, function(res){});

        var teams = this.data.teams, good=0, bad=0;
        if(teams.length===32){
            switch(position){
                case "QB":
                    teams = _.sortBy(teams, function(t){return t.defenseVsQB;});
                    good = teams[Math.round(teams.length/3)].defenseVsQB;
                    bad = teams[Math.round(2*teams.length/3)].defenseVsQB;
                    break;
                case "RB":
                    teams = _.sortBy(teams, function(t){return t.defenseVsRB;});
                    good = teams[Math.round(teams.length/3)].defenseVsRB;
                    bad = teams[Math.round(2*teams.length/3)].defenseVsRB;
                    break;
                case "WR":
                    teams = _.sortBy(teams, function(t){return t.defenseVsWR;});
                    good = teams[Math.round(teams.length/3)].defenseVsWR;
                    bad = teams[Math.round(2*teams.length/3)].defenseVsWR;
                    break;
                case "TE":
                    teams = _.sortBy(teams, function(t){return t.defenseVsTE;});
                    good = teams[Math.round(teams.length/3)].defenseVsTE;
                    bad = teams[Math.round(2*teams.length/3)].defenseVsTE;
                    break;
            }
        }
        var color="black";
        if(average>0 && average<=good) color="green";
        else if(average>0 && average<=bad) color="orange";
        else if(average>0) color="red";
        return <span style={{color: color}}>{average}</span>
    } ,
    changeTeamName(event){
        var id = $(event.target).parent().parent().data("id");
        var team = $(event.target).val();
        if(!team || team.trim()==="") Meteor.globals.dangerGrowl("Team requires non empty name");
        else if(Teams.findOne({name: team})) Meteor.globals.dangerGrowl("Team already exists with that name");
        else Teams.update({_id: id}, {$set: {name: team}});
    },
    changeTeamPrice(event){
        var id = $(event.target).parent().parent().data("id");
        var price = parseInt($(event.target).val());
        console.log("changing price to", price);
        if(!price) Meteor.globals.dangerGrowl("Team needs a valid price");
        else Teams.update({_id: id}, {$set: {price: price}});
    },
    saveSchedule(){
        var team = this.data.selectedTeam;
        var id = team._id;
        var matchups=[];
        $(".team-matchup").each(function(){
            var week = $(this).data("week");
            var t = $(this).children(".col-md-6").children(".input-form").val();
            var h = $(this).children().children(".isHomeGame").children(".homeGameCheck:checked");
            if(week && t){
                var isHome = false;
                if(h && h.length>0) isHome = true;
                matchups.push({team: t, week: week, home: isHome});
            }
        });
        Meteor.call("updateSchedule", id, matchups, function(res){
            if(res) Meteor.globals.dangerGrowl("error updating schedule");
        });
        Session.set("selectedTeam", {});
        $(".teamSchedule").modal("hide");
    } ,
    editTeamSchedule(event){
        var team = $(event.target).parent().parent().data("team");
        var obj = Teams.findOne({name: team});
        if(obj){
            Session.set("selectedTeam", obj);
            Meteor.setTimeout(function(){
                $(".teamSchedule").modal("show");
            }, 100);
        }
    },
    renderTeamsWithStats(){
        return this.data.teams.map((team) => {
            return <tr key={team.name} className="table-row" data-team={team.name} data-id={team._id}>
                <td> <input type="text" className="team-name" defaultValue={team.name} onBlur={this.changeTeamName}/></td>
                <td> {this.findDefenseValue("QB", team.name)} </td>
                <td> {this.findDefenseValue("RB", team.name)} </td>
                <td> {this.findDefenseValue("WR", team.name)} </td>
                <td> {this.findDefenseValue("TE", team.name)} </td>
                <td> <input type="text" className="team-price" defaultValue={team.price} onBlur={this.changeTeamPrice}/> </td>
                <td> <a href="#" className="btn btn-default player-btn edit-schedule" onClick={this.editTeamSchedule}><i className="fa fa-pencil"></i></a> </td>
            </tr>
        });
    } ,
    render(){
        return (
            <div id="editTeamsTab" className="tab-pane fade">
                <div className="home-container">
                    <table className="table table-striped table-condensed team-table">
                        <thead>
                        <tr className="table-row">
                            <th> Name </th>
                            <th> Average Vs. QB </th>
                            <th> Average Vs. RB </th>
                            <th> Average Vs. WR </th>
                            <th> Average Vs. TE </th>
                            <th> Price </th>
                            <th> Edit Schedule </th>
                        </tr>
                        </thead>
                        <tbody>
                        {this.renderTeamsWithStats()}
                        </tbody>
                    </table>
                    <div className="teamSchedule modal fade" role="dialog">
                        <div className="modal-dialog">
                            <div className="modal-content">
                                <div className="modal-header">
                                    <button type="button" className="close" data-dismiss="modal">&times;</button>
                                    <h4 className="modal-title">Set Schedule</h4>
                                </div>
                                <div className="modal-body">
                                    <div className="history-container">
                                        <label className="form-label">Schedule:</label>
                                        <TeamSchedule />
                                    </div>
                                </div>
                                <div className="modal-footer">
                                    <a href="#" className="btn btn-success round-btn" type="button" onClick={this.saveSchedule}>Save</a>
                                    <a href="#" className="btn btn-default round-btn" type="button" data-dismiss="modal">Cancel</a>
                                </div>
                            </div>

                        </div>
                    </div>
                </div>
            </div>
        )
    }
});

AddPlayerTab = React.createClass({
    mixins: [ReactMeteorData],

    // Loads items from the Tasks collection and puts them on this.data.tasks
    getMeteorData() {
        return {
            teams: Teams.find({}, {sort: {name: 1}}).fetch() || [],
            positions: Positions.find({}).fetch() || []
        }
    },
    renderPositions() {
        var positions = _.uniq(this.data.positions, function(p){return p.position;});
        return positions.map((pos) => {
            if(pos.name!=="D/ST") return <option value={pos.position} key={pos.key}>{pos.position}</option>
        });
    } ,
    renderTeams(){
        return this.data.teams.map((pos) => {
            return <option value={pos.name} key={pos.name}>{pos.name}</option>
        });
    } ,
    addPlayer(event){
        var name = $(event.target).siblings(".add-player-name").val();
        var team = $(event.target).siblings(".add-team-name").val();
        var position = $(event.target).siblings(".add-player-position").val();
        var health = $("input[type='radio']:checked").val();
        if(!name || name.trim==="" || !team || !position || !health) Meteor.globals.dangerGrowl("All fields are required");
        else if(Players.findOne({name: name, team: team})) Meteor.globals.dangerGrowl("" + name + " already exists");
        else{
            var positionId = Positions.findOne({position: position})._id;
            Players.insert({name: name, team: team, positionId: positionId, health: health, history: {}, average: 0, price: 0});
            Meteor.globals.successGrowl("Successfully added "+name);
            $(".add-player-name").val("");
            $(".add-team-name").val("");
            $(".add-player-position").val("");
            $(".add-player-health").each(function(){
                $(this).prop("checked", false);
            })
        }
    } ,
    addPlayerForm(){
        return <div className="row">
            <div className="col-md-5">
                <label className="form-label">Name:</label>
                <input type="text" className="add-player-name input-form" placeholder="Player Name..."/>
                <label className="form-label">Team:</label>
                <select className="add-team-name input-form" defaultValue="">
                    <option value="" disabled={true}>Select A Team</option>
                    {this.renderTeams()}
                </select>
                <label className="form-label">Position:</label>
                <select className="add-player-position input-form" defaultValue="">
                    <option value="" disabled={true}>Select A Position</option>
                    {this.renderPositions()}
                </select>
                <div className="health-container">
                    <label className="form-label">Health:</label>
                    <div className="input-form">
                        <label className="radio-inline"><input type="radio" name="optradio" value="Healthy" className="add-player-health"/>Healthy</label>
                        <label className="radio-inline"><input type="radio" name="optradio" value="Probable" className="add-player-health"/>Probable</label>
                        <label className="radio-inline"><input type="radio" name="optradio" value="Questionable" className="add-player-health"/>Questionable</label>
                        <label className="radio-inline"><input type="radio" name="optradio" value="Out" className="add-player-health"/>Out</label>
                    </div>
                </div>
                <a href="#" className="btn btn-success round-btn" onClick={this.addPlayer}>Add Player</a>
            </div>
        </div>
    } ,
    render(){
        return (
            <div id="addPlayerTab" className="tab-pane fade">
                <div>
                    {this.addPlayerForm()}
                </div>
            </div>
        )
    }
});

AddTeamTab = React.createClass({
    addTeam(){
        var teamName = $(".add-new-team-name").val();
        if(!teamName || teamName.trim()==="") Meteor.globals.dangerGrowl("Must input a valid name");
        else if(Teams.findOne({name: teamName})) Meteor.globals.dangerGrowl("There already exists a team with that name");
        else{
            Teams.insert({name: teamName, price: 0, average: 0, defenseVsQB: 0, defenseVsRB: 0, defenseVsWR: 0, defenseVsTE: 0});
            Meteor.globals.successGrowl("Successfully added the "+teamName);
            $(".add-new-team-name").val("");
        }
    } ,
    render(){
        return (
            <div id="addTeamTab" className="tab-pane fade">
            <div>
                <div className="row">
                    <div className="col-md-4">
                        <label className="form-label">Name:</label>
                        <input type="text" className="input-form add-new-team-name" placeholder="Team Name..."/>
                        <a href="#" className="btn btn-success round-btn" onClick={this.addTeam}>Save Team</a>
                    </div>
                </div>
            </div>
        </div>
        )
    }
});

AdminNfl = React.createClass({
    render(){
        return (
            <div>
                <div className="row admin-navbar">
                    <ul className="nav nav-tabs">
                        <li role="presentation" className="active"><a href="#editPlayersTab" data-toggle="tab">Edit Players</a></li>
                        <li role="presentation"><a href="#addPlayerTab" data-toggle="tab">Add Player</a></li>
                        <li role="presentation"><a href="#editTeamsTab" data-toggle="tab">Edit Teams</a></li>
                        <li role="presentation"><a href="#addTeamTab" data-toggle="tab">Add Team</a></li>
                    </ul>
                </div>
                <div className="tab-content">
                    <PlayerTab />
                    <AddPlayerTab />
                    <TeamTab />
                    <AddTeamTab />
                </div>
            </div>
        )
    }
});

