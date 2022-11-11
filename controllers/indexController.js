const indexView = (req, res) => {
    res.render("index", {
        title: "testing"
    } );
}

module.exports =  {
    indexView
};