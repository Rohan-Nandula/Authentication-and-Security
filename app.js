
const express = require("express");
const ejs = require("ejs");
const mongoose = require("mongoose");
const session = require("express-session");//New Step
const passport = require("passport");//New Step
const passportLocalMongoose = require("passport-local-mongoose"); //New Step
const app = express();

app.set('view engine', 'ejs');
app.use(express.urlencoded({extended: true}));
app.use(express.static("public"));

app.use(session({
    secret: 'Gareth Bale.',
    resave: false,
    saveUninitialized: false
  })); //New steps : Check Docs of Passport.js(This has to be placed exactly where it is)

app.use(passport.initialize());//New Step
app.use(passport.session());//New Step

mongoose.connect("mongodb://localhost:27017/userDB");

const userSchema = new mongoose.Schema({ //new mongoose.Schema object
    email : {
        type : String
    },
    password : {
        type : String
    }
});

userSchema.plugin(passportLocalMongoose);//New Step

const userModel = mongoose.model("User",userSchema);

passport.use(userModel.createStrategy());//New Step
passport.serializeUser(userModel.serializeUser());//New Step
passport.deserializeUser(userModel.deserializeUser());//New Step


app.get("/",function (req,res){
    res.render("home");
});

app.get("/login",function (req,res){
    res.render("login");
});
app.post("/login",function(req,res){
    const user = new userModel({
        username : req.body.username,
        password : req.body.password
    });
    req.login(user,function(err){
        if(err){
            console.log(err);
        }else{
            passport.authenticate("/local")(req,res,function(){
                res.redirect("/secrets");
            });
        }
    });

});

app.get("/secrets",function(req,res){
    if(req.isAuthenticated()){
        res.render("secrets");
    }else{
        res.redirect('/login');
    }
});

app.get("/register",function (req,res){
    res.render("register");
});

app.post("/register",function (req,res){
    userModel.register({username : req.body.username},req.body.password , function(err,User){
        if(err){
            console.log(err);
            res.redirect("/register");
        }else{
            passport.authenticate("local")(req,res,function(){
                res.redirect("/secrets");
            });
        }
    });
});

app.get("/logout",function(req,res){
    req.logout(function(err){
        if(err){
            console.log("err");
        }
    });
    res.redirect('/');
});

app.listen(3000, function() {
    console.log("Server started on port 3000");
  });