const router = require("express").Router();
const { checkUsernameExists, validateRoleName } = require('./auth-middleware');
const bcrypt = require("bcryptjs")
const userModel = require("../users/users-model")
const jwt = require("jsonwebtoken")
const { JWT_SECRET } = require("../secrets"); // use this secret!

const generateToken = (user) => {
  const payload = {
    subject: user.user_id,
    username: user.username,
    role_name: user.role_name
  }
  const options = {
    expiresIn: "1d"
  }
  return jwt.sign(payload,JWT_SECRET,options)
}

router.post("/register", validateRoleName, (req, res, next) => {
  const user = req.body
  const hash = bcrypt.hashSync(user.password,12)
  user.password = hash
  userModel.add(user).then(promise => {
    res.status(201).json(promise)
  })
  /**
    [POST] /api/auth/register { "username": "anna", "password": "1234", "role_name": "angel" }

    response:
    status 201
    {
      "user"_id: 3,
      "username": "anna",
      "role_name": "angel"
    }
   */
});


router.post("/login", checkUsernameExists, (req, res, next) => {
  let {username,password} = req.body
  userModel.findBy({username}).first().then( user => {
    if(bcrypt.compareSync(password, user.password)){
      const token = generateToken(user)     
      res.status(200).json({
        message: `${username} is back!`,
        token
      }) 
    }else{
      res.status(401).json({message: "Invalid credentials"})
    }

  })
  /**
    [POST] /api/auth/login { "username": "sue", "password": "1234" }

    response:
    status 200
    {
      "message": "sue is back!",
      "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.ETC.ETC"
    }

    The token must expire in one day, and must provide the following information
    in its payload:

    {
      "subject"  : 1       // the user_id of the authenticated user
      "username" : "bob"   // the username of the authenticated user
      "role_name": "admin" // the role of the authenticated user
    }
   */
});

module.exports = router;
