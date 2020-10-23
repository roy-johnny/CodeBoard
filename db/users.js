const express = require('express');
const router = express.Router();
const sendmail = require('sendmail')({silent: true});
const uuidv4 = require('uuid/v4');
const db = require('../db/db');
const account = db.account;
const stutemp = db.stutemp;
const websitelink = 'YOUR_WEBSITE_LINK';

/* GET users listing. */
router.get('/', function(req, res, next) {
  res.send('respond with a resource');
});
router.checkAuth = (req, res, next) => {
  if (req.session.user) {
    if(req.session.user._id) {
      next();
    }
    else
      res.redirect('/');
  } else {
    res.redirect('/');
  }
};
router.checkNoAuth = (req, res, next) => {
  if (req.session.user) {
    if(!req.session.user._id)
      req.session.user=null;
    res.redirect('/');
  } else {
    next();
  }
};
router.updateSocket = (user_id, socket_id) => {
  account.update(
      {_id : user_id},
      { $set: { 'socket' : socket_id}},
      false,
      true);
};
router.checkEmail = (req, res, next) => {
  if(req.body['email']) {
    req.email_unique=false;
    account.findOne({email: req.body['email']}, function (e, o) {
      if(o){
        if(req.session.user){
          if(req.session.user._id){
            if(req.session.user._id===o._id.toString()){
              req.email_unique=true;
            }
          }
        }
      }
      else
        req.email_unique=true;
      next();
    });
  }
  else
    res.redirect('/')
};
router.resetpass = (email) => {
    var resetid=uuidv4();
    account.update(
        {email:email},
        {$set: {resetid:resetid}},
        false,
        true);
    sendmail({
      from: 'do-not-reply@'+websitelink,
      to: email,
      subject: 'Password Reset',
      text: 'Please open this link to reset your password: https://'+ websitelink + '/resetpass/' + resetid
    });
}
module.exports = router;
