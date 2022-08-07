require("dotenv").config();
const express = require("express");
const ejs = require("ejs");
const mongoose = require("mongoose");
const session = require("express-session");
const passport = require("passport");
const passportLocalMongoose = require("passport-local-mongoose"); 
const GoogleStrategy = require('passport-google-oauth20').Strategy;//New Step
const findOrCreate = require('mongoose-findorcreate'); //New Step
const { Strategy } = require("passport-local");
const facebookStrategy = require("passport-facebook").Strategy;//New Step
const app = express();

app.set('view engine', 'ejs');
app.use(express.urlencoded({extended: true}));
app.use(express.static("public"));

app.use(session({
    secret: 'Gareth Bale.',
    resave: false,
    saveUninitialized: false
  })); //New steps : Check Docs of Passport.js(This has to be placed exactly where it is)

app.use(passport.initialize());
app.use(passport.session());

mongoose.connect("mongodb://localhost:27017/userDB");

const userSchema = new mongoose.Schema({ //new mongoose.Schema object
    email : {
        type : String
    },
    password : {
        type : String
    },
    googleId:String, //New Step to preserve the status of a old user
    facebookId:String,
    secret : String,
});

userSchema.plugin(passportLocalMongoose);
userSchema.plugin(findOrCreate);//New Step

const userModel = mongoose.model("User",userSchema);

passport.use(userModel.createStrategy());
passport.serializeUser(function (user,done){
    done(null , user.id)
}); //New Step
passport.deserializeUser(function (id,done){
    userModel.findById(id,function(err,user){
        done(err,user);
    });
}); //New Step

passport.use(new GoogleStrategy({
    clientID: process.env.CLIENT_ID,//New Step
    clientSecret: process.env.CLIENT_SECRET,//New Step
    callbackURL: "http://localhost:3000/auth/google/secrets",//New Step --Helps google recognize the App that we want it to identify.
    userProfileURL: "https://www.googleapis.com/oauth2/v3/userinfo" //New Step to circumvent the GOOGLE+ deprecation for profile elicitation
  },
  function(accessToken, refreshToken, profile, cb) {
    console.log(profile);
    userModel.findOrCreate({ 
        googleId: profile.id 
    }, function (err, user) {
      return cb(err, user);
    });
  }
)); //New Step for google based Authentication

passport.use(new facebookStrategy({
    clientID: process.env.FACEBOOK_APP_ID,
    clientSecret: process.env.FACEBOOK_APP_SECRET,
    callbackURL: "http://localhost:3000/auth/facebook/secrets"
  },
  function(accessToken, refreshToken, profile, cb) {
    console.log(profile.id);
    userModel.findOrCreate({ 
        facebookId: profile.id 
    }, function(err, user) {
      return cb(err, user);
    });
  }
)); //New Step for facebook based Authentication

// *******************************************************************************

app.get("/",function (req,res){
    res.render("home");
});

app.get('/auth/google',
  passport.authenticate('google', { scope: ['profile'] })
); //New Steps


app.get('/auth/google/secrets', 
  passport.authenticate('google', { failureRedirect: '/login' }),
  function(req, res) {
    // Successful authentication, redirect to secrets.
    res.redirect('/secrets');
});//NewSteps

app.get("/auth/facebook",
    passport.authenticate("facebook")
);//New Steps

app.get("/auth/facebook/secrets",
    passport.authenticate("facebook", { failureRedirect: "/login" }),
    function(req, res) {
      // Successful authentication, redirect to secrets.
      res.redirect("/secrets");
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
            passport.authenticate("local")(req,res,function(){
                res.redirect("/secrets");
            });
        }
    });

});

app.get("/secrets",function(req,res){
    userModel.find({"secret": {$ne: null}}, function(err, foundUsers){ //$ne = not equal ===it is basically used here to show all the secrets.
        if (err){
          console.log(err);
        } else {
          if (foundUsers) {
            res.render("secrets", {usersWithSecrets: foundUsers});
          }
        }
      });
});
app.get("/submit",function(req,res){
    if(req.isAuthenticated()){ //Only accesing the page /secrets if the user is authenticated and has cookies and sessions
        res.render("submit");
    }else{
        res.redirect('/login');
    }
});
app.post("/submit", function(req, res){
    const submittedSecret = req.body.secret;
  
  //Once the user is authenticated and their session gets saved, their user details are saved to req.user.
    // console.log(req.user.id);
  
    userModel.findById(req.user.id, function(err, foundUser){
      if (err) {
        console.log(err);
      } else {
        if (foundUser) {
          foundUser.secret = submittedSecret;
          foundUser.save(function(){
            res.redirect("/secrets");
          });
        }
      }
    });
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