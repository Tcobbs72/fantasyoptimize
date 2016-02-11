LoggingOut = React.createClass({
    render(){
        return (
            <div className="home-container">
                <div className="row">
                    <div className="col-md-6 col-md-offset-3 col-sm-6 col-sm-offset-3 col-xs-8 col-xs-offset-2 text-center">
                        <h4 className="logout-message">Logging out of your account now</h4>
                    </div>
                </div>
                <div className="row">
                    <div className="col-md-6 col-md-offset-3 col-sm-6 col-sm-offset-3 col-xs-8 col-xs-offset-2 logout-message text-center">
                        <i className="fa fa-cog fa-spin"></i>
                    </div>
                </div>
            </div>
        )
    }
});