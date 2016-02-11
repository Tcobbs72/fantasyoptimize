//Meteor.startup(function(){
//    Meteor.setTimeout(function(){
//        Meteor.call("getQBs", 16, function(error, result) {
//        });
//        Meteor.call("getRBs", 16, function(error, result) {
//        });
//        Meteor.call("getWRs", 16, function(error, result){
//        });
//        //Meteor.call("getSalaries", 16);
//    }, 1000);
//});

Sports = React.createClass({
    mixins: [ReactMeteorData],
    getMeteorData(){
        return {
            currentUser: Meteor.user() ? Meteor.user() : null
        }
    },
    showOptimize(event){
        event.preventDefault();
        $(".optimize-container").slideUp("slow");
        $(".all-sports-container").css("margin-top", "120px");
        Meteor.setTimeout(function(){
            $(".optimize-container").slideDown("slow");
            $(".all-sports-container").css("margin-top", "2%");
        }, 100);
    },
    render(){
        if(this.data.currentUser){
            return (
                <div className="sports"><div className="all-sports-container"><div className="sport-container">
                    <div className="nfl">
                        <div className="row sport-title">
                            Football
                        </div>
                        <div className="row text-center">
                            <a href="/nfl" className="btn btn-primary" onClick={this.showOptimize}>Make Lineup</a>
                        </div>
                    </div>
                </div>
                    <div className="sport-container">
                        <div className="nba">
                            <div className="row sport-title">
                                Basketball
                            </div>
                            <div className="row text-center">
                                <h4 style={{color: "white"}}><i>Coming Soon...</i></h4>
                            </div>
                        </div>
                    </div>
                    <div className="sport-container">
                        <div className="mlb">
                            <div className="row sport-title">
                                Baseball
                            </div>
                            <div className="row text-center">
                                <h4 style={{color: "white"}}><i>Coming Soon...</i></h4>
                            </div>
                        </div>
                    </div>
                    <div className="sport-container">
                        <div className="nhl">
                            <div className="row sport-title">
                                Hockey
                            </div>
                            <div className="row text-center">
                                <h4 style={{color: "white"}}><i>Coming Soon...</i></h4>
                            </div>
                        </div>
                    </div></div></div> )
        }
        else{
            return <div className="temp"></div>
        }
    }
});

App = React.createClass({
    hideOptimize(event){
        Meteor.globals.nflBudget = 50000;
        event.preventDefault();
        $(".optimize-container").slideUp("slow");
        $(".all-sports-container").css("margin-top", "120px");
    },
    render() {
        return (
            <div className="app-root">
                <Header />
                <div className="optimize-container" style={{display: "none"}}>
                    <div className="lineup-container">
                        <div className="row">
                        <a href="#" className="btn btn-primary" onClick={this.hideOptimize}>Hide</a>
                        </div>
                        {this.props.yield}
                    </div>
                </div>
                <Sports />
                <Footer />
            </div>
        );
    }
});