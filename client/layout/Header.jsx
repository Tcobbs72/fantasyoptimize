// This is inside header.jsx
Header = React.createClass({
    mixins: [ReactMeteorData],
    getMeteorData(){
        return {
            currentUser: Meteor.user() ? Meteor.user() : null
        }
    },
    createUser(){
        var username = $(".new-username").val();
        var email = $(".new-email").val();
        var password = $(".new-password").val();
        var confirm = $(".new-password-confirm").val();
        if(!username || !email || !password || !confirm || username.trim()==="" || email.trim()==="" || password.trim()==="" || confirm.trim()==="") Meteor.globals.dangerGrowl("Must fill in all parts of the form");
        else if(!validateEmail(email)) Meteor.globals.dangerGrowl("Email needs to be in valid format. Example: test@test.com", {delay: 5000});
        else if(password!==confirm) Meteor.globals.dangerGrowl("Passwords do not match");
        else{
            if(Meteor.users.findOne({username: username})){
                Meteor.globals.dangerGrowl("Username already taken");
            }
            else if(Meteor.users.findOne({emails: {$elemMatch: {address: email}}})){
                Meteor.globals.dangerGrowl("Email already taken");
            }
            else{
                resetForm();
                $(".newUserModal").modal("hide");
                $(".processing").modal("show");
                Accounts.createUser({username: username, password: password, email: email}, function(){
                    $(".processing").modal("hide");
                });
            }
        }
    } ,
    logout(){
        $(".optimize-container").slideUp("slow");
        $(".all-sports-container").css("margin-top", "120px");
        $(".processing").modal("show");
        Meteor.logout(function(Error){
            if(Error) Meteor.globals.dangerGrowl("Error logging out");
            $(".processing").modal("hide");
        });
    } ,
    admin(){
        Meteor.globals.nflBudget = 50000;
        $(".optimize-container").slideUp("slow");
        $(".all-sports-container").css("margin-top", "120px");
        Meteor.setTimeout(function(){
            $(".optimize-container").slideDown("slow");
            $(".all-sports-container").css("margin-top", "2%");
        }, 100);
    } ,
    signup(){
      $(".newUserModal").modal("show");
        Meteor.setTimeout(function(){
            $(".new-username").focus();
        }, 600);
    },
    showLogin(){
      $(".loginModal").modal("show");
        Meteor.setTimeout(function(){
            $(".username").focus();
        }, 600);
    },
    login(){
        var username = $(".username").val();
        var password = $(".password").val();
        $(".username").val("");
        $(".password").val("");
        if(username && password){
            $(".loginModal").modal("hide");
            $(".processing").modal("show");
            Meteor.loginWithPassword(username, password, function(Error){
                if(Error){
                    Meteor.globals.dangerGrowl("Incorrect username or password");
                }
                $(".processing").modal("hide");
            });
            //while(Meteor.loggingIn()){
            ////do nothing
            //}
        }
        else{
            Meteor.globals.dangerGrowl("Must enter username and password");
        }
    } ,
    renderInfo(){
        if(this.data.currentUser && this.data.currentUser.isAdmin) {
            return <div>
                <div className="col-md-4 col-sm-4 col-xs-3 text-center">
                    <a href="/admin" className="header-btn" onClick={this.admin}>Admin</a>
                </div>
                <div className="col-md-3 col-sm-3 pull-right">
                    Welcome, {Meteor.user().username}
                    <a href="#" className="logout-btn" onClick={this.logout}>Logout</a>
                </div>
            </div>
        }
        else if(this.data.currentUser){
            return <div className="col-md-3 col-sm-3 pull-right">
                Welcome, {Meteor.user().username}
                <a href="#" className="logout-btn" onClick={this.logout}>Logout</a>
            </div>
        }
        else{
            return  <div className="col-md-2 col-sm-2 pull-right">
                <a href="#" className="login-btn header-btn" onClick={this.showLogin}>Login</a>
            </div>
        }
    } ,
    signUpBtn(){
        if(!this.data.currentUser){
            return <div className="row header-row">
                <a href="#" className="btn btn-primary signup-btn header-btn" onClick={this.signup}>Sign Up</a>
            </div>
        }
    },
    render() {
        return (
            <div className="header">
                <header>
                    <div className="row">
                    <div className="col-md-4 col-sm-4 col-xs-5">
                    <h1>
                        FantasyOptimize
                    </h1>
                    </div>
                        {this.renderInfo()}
                    </div>
                </header>
                <div className="overlayMessage text-center">
                    <div className="row header-row">
                        Welcome to FantasyOptimize
                    </div>
                    <div className="row header-row">
                        Can't seem to find the right Daily Fantasy Sports lineup?
                    </div>
                    <div className="row header-row">
                        We rely on statistics and data to find the optimal one.
                    </div>
                    {this.signUpBtn()}
                </div>
                <div className="overlay text-center">
                    Here at FantasyOptimize we crunch all the data for the players in order to form the optimal lineup.
                    Don't be fooled though, as we still allow you tools to customize your lineups. We encourage you
                    to explore different lineups until you find one you like.
                </div>
                <div className="loginModal modal fade" role="dialog">
                    <div className="modal-dialog">
                        <div className="modal-content">
                            <div className="modal-header">
                                <button type="button" className="close" data-dismiss="modal">&times;</button>
                                <h4 className="modal-title">Login</h4>
                            </div>
                            <div className="modal-body">
                                <div className="row login-row">
                                    <div className="input-group">
                                        <span className="input-group-addon"><i className="fa fa-user"></i></span>
                                        <input type="text" className="username login-form form-control" placeholder="Username"/>
                                    </div>
                                </div>
                                <div className="row login-row">
                                    <div className="input-group">
                                        <span className="input-group-addon"><i className="fa fa-lock"></i></span>
                                        <input type="password" className="password login-form form-control" placeholder="Password"/>
                                    </div>
                                </div>
                            </div>
                            <div className="modal-footer">
                                <a href="#" className="btn btn-success round-btn" type="button" onClick={this.login}>Login</a>
                            </div>
                        </div>

                    </div>
                </div>
                <div className="newUserModal modal fade" role="dialog">
                    <div className="modal-dialog">
                        <div className="modal-content">
                            <div className="modal-header">
                                <button type="button" className="close" data-dismiss="modal">&times;</button>
                                <h4 className="modal-title">New User</h4>
                            </div>
                            <div className="modal-body">
                                <div className="history-container">
                                    <input type="text" className="new-username input-form" placeholder="Username"/>
                                    <input type="text" className="new-email input-form" placeholder="Email"/>
                                    <input type="password" className="new-password input-form" placeholder="Password"/>
                                    <input type="password" className="new-password-confirm input-form" placeholder="Confirm Password"/>
                                </div>
                            </div>
                            <div className="modal-footer">
                                <a href="#" className="btn btn-success round-btn" type="button" onClick={this.createUser}>Create</a>
                            </div>
                        </div>

                    </div>
                </div>
                <div className="processing modal fade" data-backdrop="static" data-keyboard="false" tabIndex="-1" role="dialog" aria-hidden="true">
                    <div className="modal-dialog modal-m">
                        <div className="modal-content">
                            <div className="modal-header"><h3 style={{margin:0}}>Processing</h3></div>
                            <div className="modal-body">
                                <div className="progress progress-striped active" style={{marginBottom:0}}><div className="progress-bar" style={{width: "100%"}}></div></div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        )
    }
});

function validateEmail(email) {
    var re = /^([\w-]+(?:\.[\w-]+)*)@((?:[\w-]+\.)*\w[\w-]{0,66})\.([a-z]{2,6}(?:\.[a-z]{2})?)$/i;
    return re.test(email);
}

function resetForm(){
    $(".new-username").val("");
    $(".new-email").val("");
    $(".new-password").val("");
    $(".new-password-confirm").val("");
}
