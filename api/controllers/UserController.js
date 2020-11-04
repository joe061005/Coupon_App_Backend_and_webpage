/**
 * UserController
 *
 * @description :: Server-side actions for handling incoming requests.
 * @help        :: See https://sailsjs.com/docs/concepts/actions
 */

module.exports = {

    login: async function (req, res) {

        if (req.method == "GET") return res.view('user/login');

        if (!req.body.username || !req.body.password) return res.badRequest();

        var user = await User.findOne({ username: req.body.username });

        if (!user) return res.status(401).json("User not found");

        var match = await sails.bcrypt.compare(req.body.password, user.password);

        if (!match) return res.status(401).json("Wrong Password");

        //Reuse existing session 
        if (!req.session.username) {
            req.session.username = user.username;
            req.session.iden = user.id;
            req.session.role = user.role;
            
            return res.json(user);
        }

        // Start a new session for the new login user
        req.session.regenerate(function (err) {

            if (err) return res.serverError(err);

            req.session.username = user.username;
            req.session.iden = user.id;
            req.session.role = user.role;
            return res.json(user);
        });
    },

    logout: async function (req, res) {

        req.session.destroy(function (err) {

            if (err) return res.serverError(err);

            return res.redirect("/login");
        });
    },

    populate: async function (req, res) {

        var user = await User.findOne(req.params.id).populate("clients");

        if (!user) return res.notFound();

        return res.json(user);
    },

    add: async function (req, res) {

        if (!await User.findOne(req.params.id)) return res.status(404).json("User not found.");

        var thatRest = await Restaurant.findOne(req.params.fk).populate("consultants", { id: req.params.id });

        if (!thatRest) return res.status(404).json("Restaurant not found.");

        if (thatRest.consultants.length > 0)
            return res.status(409).json("Already added.");   // conflict

        await User.addToCollection(req.params.id, "clients").members(req.params.fk);

        return res.redirect("/");

    },
    
    remove: async function (req, res) {

        if (!await User.findOne(req.params.id)) return res.status(404).json("User not found.");
        
        var thatRest = await Restaurant.findOne(req.params.fk).populate("consultants", {id: req.params.id});
        
        if (!thatRest) return res.status(404).json("Restaurant not found.");
    
        if (thatRest.consultants.length == 0)
            return res.status(409).json("Nothing to delete.");    // conflict
    
        await User.removeFromCollection(req.params.id, "clients").members(req.params.fk);
    
        return res.redirect("/");
    },


};

