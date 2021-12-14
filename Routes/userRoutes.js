const express= require('express')
const router = express();

const userModule = require('../userModule')
const auth = require('../Authentication/authenticate')

router.post('/register', userModule.register)

router.post('/activation', userModule.activateEmail)

router.post('/login', userModule.login)

router.post('/refresh_token', userModule.getAccessToken)

router.post('/forgotpwd', userModule.forgotPassword)

router.post('/resetpwd',auth, userModule.resetPassword)

router.get('/logout', userModule.logout)

router.get('/getuser',auth,userModule.getUsers)

router.get('/getuserInfo',auth,userModule.getUserInfo)

router.put('/updateuser',auth,userModule.updateUser)

router.get('/getalluser',auth,userModule.getAllUsers)

module.exports= router
