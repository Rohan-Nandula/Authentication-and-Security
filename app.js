
const express = require("express");
const ejs = require("ejs");
const mongoose = require("mongoose");
// const mongooseEncryption = require("mongoose-encryption");//import mongoose-encryption
const md5 = require("md5");
const app = express();

app.set('view engine', 'ejs');
app.use(express.urlencoded({extended: true}));
app.use(express.static("public"));

mongoose.connect("mongodb://localhost:27017/userDB");

const userSchema = new mongoose.Schema({ //new mongoose.Schema object
    email : {
        type : String,
        required : true
    },
    password : {
        type : String,
        required : true
    }
});


const userModel = mongoose.model("User",userSchema);


app.get("/",function (req,res){
    res.render("home");
});

app.get("/login",function (req,res){
    res.render("login");
});
app.post("/login",function(req,res){
    const username = req.body.username;
    const password = md5(req.body.password);

    userModel.findOne({email : username}, function (err,foundUser){
        if(err){
            console.log(err);
        }else{
            if (foundUser){
                if(foundUser.password === password){
                    res.render("secrets");
                }
            }
        }
    });
});

app.get("/register",function (req,res){
    res.render("register");
});
app.post("/register",function (req,res){
    const newUser = new userModel({
        email : req.body.username,
        password :  md5(req.body.password)
    });
    newUser.save(function (err){
        if(err){
            console.log(err);
        }else{
            res.render("secrets");
        }
    });

});

app.listen(3000, function() {
    console.log("Server started on port 3000");
  });