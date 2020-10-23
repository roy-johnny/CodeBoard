const express = require('express');
const router = express.Router();
const crypto = require('crypto');

const db = require('../db/db');
const account = db.account;

const project = require('./project');
const users = require('../db/users');
const File = require('../db/file');
const invitecode = 'YOUR_INVITE_CODE';

var Recaptcha = require('express-recaptcha').RecaptchaV2;
var recaptcha = new Recaptcha('YOUR_RECAPTCHA_PUBLIC_KEY', 'YOUR_RECAPTCHA_PRIVATE_KEY',{callback:'cb'});

/* GET home page. */
router.get('/', recaptcha.middleware.render, function (req, res, next) {
    if (req.session.user != null) {
        project.getProjectList(req.session.user._id,function (o) {
            res.render('home',{
                project_list:o,
            });
        });
    }
    else {
        if(!req.session.signup)
            req.session.signup = 0;
        res.render('index', {
            captcha:res.recaptcha
        });
    }
});

router.post('/login', recaptcha.middleware.verify, users.checkNoAuth, function (req, res, next) {
    if (!req.recaptcha.error) {
        try {
            var email = req.body['email'].toLowerCase();
            account.findOne({email: email}, function (e, o) {
                if (o === null) {
                    res.render('index', {ok: 'wrong pass'});
                } else {
                    var checkpass = sha512(req.body['pass'], o.salt);
                    if (checkpass.pass === o.pass) {
                        req.session.user = o;
                        account.update(
                            {email: email},
                            {$set: {'lastdate': new Date()}, $unset: {'resetid': ''}},
                            false,
                            true);
                        res.redirect('/');
                    } else {
                        res.render('index', {ok: 'wrong pass'});
                    }
                }
            });
        } catch (e) {
            console.log(e);
            res.render('index', {ok: 'wrong pass'});
        }
    }
    else
        res.render('index', {ok: 'wrong recaptcha'});
});

router.get('/signup', recaptcha.middleware.render, users.checkNoAuth,  function (req, res, next) {
    res.render('signup');
});

router.get('/setting', users.checkAuth, function (req, res, next) {
    res.render('setting',{email:req.session.user.email});
});

function checkPass(req, res, next){
    if(req.body['pass']===req.body['pass2'])
        return next();
    res.status(400).send('invalid operation');
}

router.post('/setting', users.checkAuth, users.checkEmail, checkPass, function (req, res, next) {
    var email = req.body['email'].toLowerCase();
    if (req.email_unique) {
        var checkpass = sha512(req.body['oldpass'],req.session.user.salt);
        if(checkpass.pass === req.session.user.pass){
            var newpass = req.session.user.pass;
            if(req.body['pass']!=='')
                newpass=sha512(req.body['pass'],req.session.user.salt).pass;
            account.update(
                {email : req.session.user.email},
                {$set: {'email':email, 'pass':newpass}},
                false,
                true);
            req.session.user.email=email;
            req.session.user.pass=newpass;
            res.status(200).send();
        }
        else {
            res.status(400).send('wrong password');
        }
    }
    else
        res.status(400).send('invalid email');
});

router.post('/signup', recaptcha.middleware.verify, users.checkNoAuth, users.checkEmail, function (req, res, next) {
    if (!req.recaptcha.error) {
        try {
            if (req.body['invite'] === invitecode) {
                var email = req.body['email'].toLowerCase();
                if (!req.email_unique || req.body['pass'] === '') {
                    res.render('index', {ok: 'invalid email'});
                } else {
                    var newdata = saltHashPassword(req.body['pass']);
                    newdata.email = email;
                    newdata.regdate = new Date();
                    newdata.lastdate = newdata.regdate;
                    account.insert(newdata, {safe: true}, function (e) {
                        if (e) {
                            res.render('index', {ok: 'db error'});
                        } else {
                            res.render('index', {ok: 'ok'});
                        }
                    });
                }
            } else {
                res.render('index', {ok: 'invite error'});
            }
        } catch (e) {
            res.render('index', {ok: 'db error'});
        }
    }
    else
        res.render('index', {ok: 'wrong recaptcha'});
});

router.get('/logout', users.checkAuth, function (req, res, next) {
    req.session.user=null;
    res.redirect('/');
});

function checkPrjAuth(id, userid, success){
    db.project.findOne({id:id},function (e,o) {
        if(o){//if the prj exist
            if(o.user===userid){//if the prj belongs to the usr
                success();
            }
        }
    })
}

router.post('/edit', users.checkAuth, function (req, res, next) {
    if(req.body['name'] && req.body['name']!=='') {
        checkPrjAuth(req.body['id'], req.session.user._id, () => {
            db.project.update(
                {id: req.body['id']},
                {$set: {name: req.body['name']}},
                false,
                true);
        });
    }
    res.redirect('/');
});

router.post('/delete', users.checkAuth, function (req, res, next) {
    checkPrjAuth(req.body['id'], req.session.user._id, () => {
        db.project.remove({id:req.body['id']});
        File.removeFiles(req.body['id']);
    });
    res.redirect('/');
});

router.post('/lost-password', users.checkNoAuth, users.checkEmail, function (req, res, next) {
    if (req.email_unique)
        res.status(400).send('no email');
    else {
        users.resetpass(req.body['email']);
        res.status(200).send();
    }
});

var genRandomString = function (length) {
    return crypto.randomBytes(Math.ceil(length / 2))
        .toString('hex')
        .slice(0, length);
};
var sha512 = function (password, salt) {
    var hash = crypto.createHmac('sha512', salt);
    hash.update(password);
    var value = hash.digest('hex');
    return {
        salt: salt,
        pass: value
    };
};

function saltHashPassword(userpassword) {
    var salt = genRandomString(16);
    return sha512(userpassword, salt);
}

router.sha512 = sha512;
module.exports = router;