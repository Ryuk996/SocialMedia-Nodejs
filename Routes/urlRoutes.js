const express= require('express')
const router = express();

const urlauth = require('../Authentication/urlauthenticate')
const urlModule = require('../urlModule')



router.post('/createUrl',urlauth, urlModule.createUrl)

router.get('/showUrl', urlModule.showUrl)

router.get('/:urlId', urlModule.showUrlid)

router.get('/delete/:id', urlModule.deleteUrlid)



module.exports= router  