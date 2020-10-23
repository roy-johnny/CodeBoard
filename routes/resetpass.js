const express = require('express');
const router = express.Router();
const db = require('../db/db');
const account = db.account;
const index = require('./index');

router.get('/:ID', function (req, res, next) {
    const id=req.params.ID;
    account.findOne({resetid:id}, function (e, o) {
        if(o)
            res.render('resetpass');
        else
            res.redirect('../');
    })
});

router.post('/:ID', function (req, res, next) {
    const id=req.params.ID;
    const pass=req.body['pass'];
    if(pass===''||!pass) return res.status(400).send();
    account.findOne({resetid:id}, function (e, o) {
        if(o){
            console.log(o)
            account.update(
                {resetid:id},
                {$set:{'pass':index.sha512(pass,o.salt).pass},$unset:{'resetid':''}},
                false,
                true);
            res.status(200).send();
        }
        else
            res.status(400).send();
    })
});
module.exports = router;