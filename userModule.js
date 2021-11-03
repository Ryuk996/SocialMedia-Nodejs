const Users = require('./userModel');
const bcryptjs = require('bcryptjs');
const jwt = require('jsonwebtoken')

const {CLIENT_URL}= process.env
const sendMail = require('./sendMail')

const userModule ={
    register : async (req,res) => { 
        try {
            const {firstName,lastName,userName,password} = req.body;

            if(!firstName || !lastName || !userName || !password)
                return res.status(400).json({msg: "Please fill in all fields."})

            if(!validateEmail(userName))
                return res.status(400).json({msg: "Invalid emails."})

            const user = await Users.findOne({userName})
            if(user) return res.status(400).json({msg: "This email already exists."})

            if(password.length < 6)
                return res.status(400).json({msg: "Password must be at least 6 characters."})

                let salt = bcryptjs.genSaltSync(10);
                let hash = bcryptjs.hashSync(req.body.password, salt);
                req.body.password=hash;

                const newUser = {
                    firstName, lastName,userName, password: hash
                }
                const activation_token = createActivationToken(newUser)
                const url = `${CLIENT_URL}/user/activate/${activation_token}`
                //=>sending mail with activation_token ->for activating through email verification
                sendMail(userName, url,"verify your emailID")
                console.log(newUser)
                res.json({msg: "Register Success! Please activate your email to start."})
                
        } catch (error) {
            res.status(500).json({msg:"internal server error"})
        }
    },
    activateEmail: async (req, res) => {
        try {
            const {activation_token} = req.body
            
            const user = jwt.verify(activation_token, process.env.ACTIVATION_TOKEN_SECRET)
            

            const {firstName, lastName,userName, password} = user

            const check = await Users.findOne({userName})
            if(check) return res.status(400).json({msg:"This email already exists."})

            const newUser = new Users({
                firstName, lastName,userName, password
            })
            //=>After activation through email store data in dB ->for storing
            await newUser.save()

            res.json({msg: "Account has been activated!"})

        } catch (err) {
            return res.status(500).json({msg: err.message})
        }
    },
    login: async (req, res) => {
        try {
            const {userName, password} = req.body
            const user = await Users.findOne({userName})
            if(!user) return res.status(400).json({msg: "This email does not exist."})

            const matchPassword = bcryptjs.compareSync(req.body.password, user.password);
            if(!matchPassword) return res.status(400).json({msg: "Username/Password is incorrect."})
            // console.log(user)
            const refresh_token = createRefreshToken({id: user._id})
            
            res.cookie('refreshtoken', refresh_token, {
                httpOnly: true,
                path: '/user/refresh_token',
               // maxAge: 7*24*60*60*1000 // 7 days
            })
            // console.log(refresh_token)
            const rf_token = refresh_token
            //  console.log({rf_token})
             if(!rf_token) return res.status(400).json({msg: "Please login now!"})
            // console.log(rf_token)
            jwt.verify(rf_token, process.env.REFRESH_TOKEN_SECRET, (err, user) => {
                if(err) return res.status(400).json({msg: "Please login now!"})
                // console.log(user)
                const access_token = createAccessToken({id: user.id})
                // console.log({access_token})
                //=>fecthing the access token to the clientside ->for authentication
                res.json({aToken: access_token})
             })
        } catch (err) {
            return res.status(500).json({msg: err.message})
        }
    },
    getAccessToken: async(req, res) => {
        try {
            
            console.log(refresh_token)
            const rf_token= req.refresh_token
            console.log(rf_token)
            // const rf_token = req.cookies.refreshtoken
            console.log({rf_token})
            
        } catch (err) {
            return res.status(500).json({msg: err.message})
        }
    },
    forgotPassword: async (req, res) => {
        try {
            const {userName} = req.body
            const user = await Users.findOne({userName})
            if(!user) return res.status(400).json({msg: "This email does not exist."})

            const access_token = createAccessToken({id: user._id})
            const url = `${CLIENT_URL}/user/reset/${access_token}`

            sendMail(userName, url, "Reset your password")
            res.json({msg: "Re-send the password, please check your email."})
        } catch (err) {
            return res.status(500).json({msg: err.message})
        }
    },
    resetPassword: async (req, res) => {
        try {
            
            const {password} = req.body
            if(password.length < 6)
                return res.status(400).json({msg: "Password must be at least 6 characters."})
            
            let salt = bcryptjs.genSaltSync(10);
                let hash = bcryptjs.hashSync(req.body.password, salt);
                req.body.password=hash;
            // console.log(req.user)
            await Users.findOneAndUpdate({_id: req.user.id}, {
                password: hash
            })

            res.json({msg: "Password successfully changed!"})
        } catch (err) {
            return res.status(500).json({msg: err.message})
        }
    },
    logout: async (req, res) => {
        try {
            res.clearCookie('refreshtoken', {path: '/user/refresh_token'})
            return res.json({msg: "Logged out."})
        } catch (err) {
            return res.status(500).json({msg: err.message})
        }
    },
    getUsers: async (req, res) => {
        try {
            const data = await Users.findById(req.user.id).select('-password')                  //todo=> userid
            console.log(data);
            res.json([data]);
        } catch (err) {
            return res.status(500).json({msg: err.message})
        }
    },
    getUserInfo: async (req, res) => {
        try {
            const data = await Users.findById(req.user.id)
            console.log(data);
            res.json(data);
        } catch (err) {
            return res.status(500).json({msg: err.message})  
        }
    },
    updateUser: async (req,res) => {
        try {
            const {firstName,profilePic,status} = req.body;
            const data = await Users.findOneAndUpdate({_id:req.user.id},{firstName,profilePic,status})
            res.json({msg: "Update Success"})
        } catch (err) {
            return res.status(500).json({msg: err.message})
        }
    }
}


function validateEmail(email) {
    const re = /^(([^<>()[\]\\.,;:\s@\"]+(\.[^<>()[\]\\.,;:\s@\"]+)*)|(\".+\"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;
    return re.test(email);
}

const createActivationToken = (payload) => {
    return jwt.sign(payload, process.env.ACTIVATION_TOKEN_SECRET, {expiresIn: '5m'})
}

const createAccessToken = (payload) => {
    return jwt.sign(payload, process.env.ACCESS_TOKEN_SECRET, {expiresIn: '15m'})
}

const createRefreshToken = (payload) => {
    return jwt.sign(payload, process.env.REFRESH_TOKEN_SECRET)
}

module.exports = userModule