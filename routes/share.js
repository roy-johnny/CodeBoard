const express = require('express');
const router = express.Router();
const editor = require('./editor');
function pre_share(req, res, next){
    req.body['code_id']=req.params.ID;
    next();
}
router.get('/:ID', pre_share, editor.checkShareCodeExist, function (req, res, next) {
    res.redirect('/proj/'+req.body['code_id']);
});
module.exports = router;