Admin = React.createClass({
    render(){
        return (
            <div className="sports"><div className="all-sports-container">
                <div className="sport-container">
                    <div className="row admin-sport-title text-center">
                        <div className="col-md-4 col-md-offset-4"><u><b>NFL</b></u></div>
                    </div>
                    <div className="sport-contents text-center">
                        We take a look at nearly every aspect of football to value our players and
                        help you find the optimal lineup for this Sunday. Opinions and beliefs are
                        thrown out the window, because the numbers don't lie!
                        <div className="row text-center sport-contents">
                            <a href="/admin/nfl" className="btn btn-primary">Admin</a>
                        </div>
                    </div>
                </div>
                <div className="sport-container">
                    <div className="row admin-sport-title text-center">
                        <div className="col-md-4 col-md-offset-4"><u><b>NBA</b></u></div>
                    </div>
                    <div className="sport-contents text-center">Coming Soon</div>
                </div>
                <div className="sport-container">
                    <div className="row admin-sport-title text-center">
                        <div className="col-md-4 col-md-offset-4"><u><b>MLB</b></u></div>
                    </div>
                    <div className="sport-contents text-center">Coming Soon</div>
                </div>
                <div className="sport-container">
                    <div className="row admin-sport-title text-center">
                        <div className="col-md-4 col-md-offset-4"><u><b>NHL</b></u></div>
                    </div>
                    <div className="sport-contents text-center">Coming Soon</div>
                </div>
            </div>
            </div>
        )
    }
})