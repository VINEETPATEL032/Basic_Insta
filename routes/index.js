var express = require('express');
var router = express.Router();
var userModel = require("./users");
const passport = require('passport');
var postModel = require("./posts");
var multer = require("multer");
var path = require("path");
var fs = require("fs")
var crypto = require("crypto")
const mailer = require("../nodemailer");

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, './public/images/uploads')
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9) + path.extname(file.originalname);
    cb(null, uniqueSuffix)
  }
})

const upload = multer({ storage: storage })

const localStrategy = require("passport-local");
passport.use(new localStrategy(userModel.authenticate()));

router.get('/', function(req, res, next) {
  res.render('index');
});

router.get('/forgot', function(req, res, next) {
  res.render('forgot');
});

router.post('/forgot', async function (req, res, next) {
  var user = await userModel.findOne({email: req.body.email});
  if(!user){
    res.send("we've sent a mail, if email exists.");
  }
  else{
    crypto.randomBytes(80, async function(err, buff){
      let key = buff.toString("hex");
      mailer(req.body.email, user._id, key)
      .then(async function(){
        user.expirykey = Date.now() + 24*60*60*1000;
        user.key = key;
        await user.save();
        res.send("we've sent a mail, if email exists.")
      })
    })
  }
});

router.get('/forgot/:userid/:key', async function (req, res, next) {
  let user = await userModel.findOne({_id: req.params.userid});
  if(user.key === req.params.key && Date.now() < user.expirykey){
    res.render("reset", {user})
  }
  else{
    res.send("beta tej mat chalo")
  }
});

router.post('/resetpass/:userid', async function (req, res, next) {
  let user = await userModel.findOne({_id: req.params.userid});
  user.setPassword(req.body.password, async function(){
    user.key = "";
    await user.save();
    req.logIn(user, function(){
      res.redirect("/profile");
    })
  })
});  

router.post('/register', function(req, res, next) {
  var newUser = new userModel({
    name: req.body.name,
    username: req.body.username,
    age: req.body.age,
    email: req.body.email,
    image: req.body.image,
    })
    userModel.register(newUser, req.body.password)
    .then(function(u){
      passport.authenticate("local")(req, res, function(){
        res.redirect("/profile")
      })
    })
});

router.get('/profile', isLoggedIn,function(req, res, next) {
  userModel.findOne({username:req.session.passport.user})
  .populate("posts")
  .then(function(founduser){
  res.render('profile',{founduser});
  })
});

router.get('/edit', isLoggedIn,function(req, res, next) {
  userModel.findOne({username:req.session.passport.user})
  .then(function(founduser){
  res.render('edit',{founduser});
  })
});

router.get('/check/:username',function(req, res, next) {
  userModel.findOne({username:req.params.username})
  .then(function(getuser){
    if(getuser){
      res.json(true)
    }
    else{
      res.json(false)
    }  
  }) 
});

router.post('/update', isLoggedIn,function(req, res, next) {
  userModel.findOneAndUpdate({username:req.session.passport.user},{username: req.body.username},{new:true})
  .then(function(updateduser){
    req.login(updateduser, function(err) {
      if (err) { return next(err); }
      return res.redirect('/profile');
    });
  })
});

router.post('/upload', isLoggedIn,upload.single("image"), function(req, res, next) {
  userModel.findOne({ username: req.session.passport.user })
  .then(function (founduser) {
    if (founduser.image !== 'def.png') {
      fs.unlinkSync(`./public/images/uploads/${founduser.image}`);
    }
    founduser.image = req.file.filename;
    founduser.save()
    .then(function () {
      res.redirect("back");
    })
  });
});

router.post('/post',isLoggedIn,function(req, res, next) {
  userModel.findOne({username: req.session.passport.user})
  .then(function(user){
    postModel.create({
      userid: user._id,
      data: req.body.data
})
    .then(function(post){
      user.posts.push(post._id);
      user.save()
      .then(function(){
        res.redirect("back")
      })
    })
  })
});


router.get('/feed', isLoggedIn, function (req, res, next){
  userModel.findOne({username: req.session.passport.user})
  .then(function(user){
    postModel.find()
    .populate("userid")
      .then(function (allposts) {
        res.render("feed", { allposts, user });
      });
  })
});

router.get('/like/:postid',isLoggedIn, function(req, res, next){
  userModel.findOne({username: req.session.passport.user})
  .then(function(user){
  postModel.findOne({_id: req.params.postid})
  .then(function(post){
    if(post.likes.indexOf(user._id) === -1){
      post.likes.push(user._id);
    }
    else{
      post.likes.splice(post.likes.indexOf(user._id) , 1);
    }
    post.save()
    .then(function(){
      res.redirect("back");
    })
  })
})
});

router.post('/login',passport.authenticate("local",{
  successRedirect: "/profile",
  failureRedirect: "/login"
}),function(req, res, next) {});

router.get('/login',function(req, res, next) {
  res.render('login');
});

router.get('/logout', function(req, res, next) {
  req.logout(function(err) {
    if (err) { return next(err); }
    res.redirect('/login');
  });
});

function isLoggedIn(req, res, next){
  if(req.isAuthenticated()){
    return next();
  }
  else{
    res.redirect("/login")
  }
}

module.exports = router;
