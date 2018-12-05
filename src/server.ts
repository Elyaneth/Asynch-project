import express = require('express')
import https = require('https')
import morgan = require('morgan')
import bodyparser = require('body-parser')
import session = require('express-session')
import levelSession = require('level-session-store')
import path = require('path')
import { UserHandler, User } from './user'
import { MetricsHandler, Metric } from './metrics'

/*
require('dotenv').config()
console.log('name: ' + "ENVNAME")¨
*/

const LevelStore = levelSession(session)

const app = express()
const port: string = process.env.PORT || '8080'

app.use(session({
  secret: 'this is a very secret phrase',
  store: new LevelStore('./db/sessions'),
  resave: true,
  saveUninitialized: true
}))

app.use(bodyparser.json())
app.use(bodyparser.urlencoded())

app.use(morgan('dev'))

app.set('views', __dirname + '/views')
app.set('view engine', 'ejs')

app.use('/', express.static(path.join( __dirname, '/../node_modules/jquery/dist')))
app.use('/', express.static(path.join( __dirname, '/../node_modules/bootstrap/dist')))

const dbMetrics = new MetricsHandler ("./db")

const authCheck = function (req: any, res: any, next: any) {
  if (req.session.loggedIn) {
    next()
  } else res.redirect('/login')
}

//GET
//ROUTE TO INDEX PAGE
app.get('/', authCheck, (req: any, res: any) => {
    var query = new Array(20)

  res.render('index', { name: req.session.user.username})
})

// ----------------------------USERS---------------------------- //
// ----------------------------USERS---------------------------- //

const userRouter = express.Router()
const dbUser: UserHandler = new UserHandler('./db/users')

//GET
//CHECK IF USER IS IN DB
userRouter.get('/:username', function (req: any, res: any, next: any) {
  dbUser.get(req.params.username, function (err: Error | null, result?: User) {
    if (err || result === undefined) {
      //res.status(404).send("user not found")
    } else res.status(200).json(result)
  })
})

//POST
//
userRouter.post('/', (req: any, res: any, next: any) => {
  dbUser.get(req.body.username, (err: Error | null, result?: User) => {
    if (err) next(err)
    if (result !== undefined) {
      res.status(409).send("user already exists")
    }
    else {
      dbUser.save(req.body, (err: Error | null) => {
        if (err) next(err)
        res.status(200).send("user persisted")
      })
    }
  })
})

//GET
//READS ALL USERS IN DB
userRouter.get('/read/:username', function (req: any, res: any, next: any) {

  dbUser.readall(req.params.username, (err: Error | null, result?: User[]) =>{
    if (err) next(err)
    res.render('readdb', { data: result })
  })
})

app.use('/user', userRouter)


// ----------------------------AUTHENTICATION---------------------------- //
// ----------------------------AUTHENTICATION---------------------------- //

const Authrouter = express.Router()

//GET
//ROUTE TO LOGIN PAGE
Authrouter.get('/login', function(req: any, res: any) {
  res.render('login')
})

//POST
//LOGIN USER USING FORM
Authrouter.post('/login', (req: any, res: any, next: any) => {
  dbUser.get(req.body.username, function(err: Error | null, result?: User){
    if (err) next(err)

    if (result === undefined || !result.validatePassword(req.body.password)) {
      console.log("wrong password")
      res.redirect('/login')
    } else {
      req.session.loggedIn = true
      req.session.user = result
      res.redirect('/')
    }
  })
})

//GET
//ROUTE TO CREATE/DELETE USER PAGE
Authrouter.get('/signup', function(req: any, res: any) {
  res.render('createuser')
})

//POST
//CREATE USER USING FORM
Authrouter.post('/signup', (req: any, res: any, next:any) => {

  var us = new User(req.body.username,req.body.email,req.body.password)

  dbUser.save(us, (err: Error | null) => {
    if (err) next(err)
    res.status(200).send("user registered")
  })

  res.render('login')
})

//POST
//DELETE USER USING FORM
Authrouter.post('/signup/delete', (req: any, res: any, next:any) => {

  dbUser.delete(req.body.deleteusername, (err: Error | null) => {
    if (err) next(err)
    //removed due to header issues
    //res.status(200).send("user deleted")
  })

  res.render('login')
})

//GET
//LOGOUT USER, CLEAR SESSION
Authrouter.get('/logout', function (req: any, res: any) {
  if (req.session.loggedIn) {
    delete req.session.loggedIn
    delete req.session.user
  }
  res.redirect('/login')
})

app.use(Authrouter)

// ----------------------------ROUTE---------------------------- //
// ----------------------------ROUTE---------------------------- //
const router = express.Router()

router.use(function (req: any, res: any, next: any) {
  console.log('router: '  + req.method + ' on ' + req.url)
  next()
})

router.get('/', (req: any, res: any) => {
  res.write('Hello')
  res.end()
})


// ----------------------------METRICS---------------------------- //
// ----------------------------METRICS---------------------------- //

//GET
//GETS METRIC FROM METRICS DB
router.get('/:id', (req: any, res: any, next:any) => {
  dbMetrics.get(req.session.user.username, (err: Error | null, result?: any) => {
    if (err) next(err)
    
    res.json(result)
  })
})

//GET
//GET ALL THE CONNECTED USER METRICS
router.get('/user/:id', function (req: any, res: any, next: any) {
  dbMetrics.get(req.session.user.username, (err: Error | null, result?: any) =>{
    if (err) next(err)
    
    result.forEach(element => {
      console.log("element: " +element.timestamp+ " ,"+element.value)
    })

    res.render('displayusermetrics', {name: req.session.user.username, data: result })
  })
})

//GET
//ROUTE TO THE CREATE/DELETE PAGE
router.get('/save/:id', function (req: any, res: any, next: any) {
  res.render('createusermetrics', {name: req.session.user.username })
})

//POST
//CREATE METRIC USING FORM
router.post('/save', (req: any, res: any, next:any) => {

  dbMetrics.registerusermetric(req.session.user.username, req.body.timestamp, req.body.value, (err: Error | null, result?: any) => {
    if (err) next(err)
    
    console.log("save ok")
    res.render('index', { name: req.session.user.username})
  })
})

//POST
//UPDATE METRIC USING FORM
router.post('/update', (req: any, res: any, next:any) => {

  dbMetrics.updatevalue(req.body.updatevalue, req.body.oldvalue, req.body.updatetimestamp, req.session.user.username, (err: Error | null) => {
    if (err) next(err)

  })
  res.render('index', { name: req.session.user.username})
})

//POST
//DELETE METRIC USING FORM
router.post('/delete', (req: any, res: any, next:any) => {

  dbMetrics.deletevalue(req.body.deletevalue, req.session.user.username, (err: Error | null) => {
    if (err) next(err)
    //res.status(200).send("metric deleted")
  })

  res.render('index', { name: req.session.user.username})
})

//POST
//OLD TESTING FUNCTION FOR SAVING
router.post('/:id', (req: any, res: any, next:any) => {
  dbMetrics.save(req.params.id, req.body, (err: Error | null, result?: any) => {
    if (err) next(err)
    res.status(200).send()
  })
})

//DELETE
//OLD TESTING FUNCTION FOR DELETING
router.delete('/:id', (req: any, res: any, next:any) => {
  dbMetrics.del(req.params.id, (err: Error | null, result?: any) => {
    if (err) next(err)
    res.status(200).send()
  })
})

app.use('/metrics', authCheck, router)



// ----------------------------BASE---------------------------- //
// ----------------------------BASE---------------------------- //

app.use(function (err: Error, req: any, res: any, next: any) {
  console.error(err.stack)
  res.status(500).send('Something broke!')
})

app.listen(port, (err: Error) => {
  if (err) {
    throw err
  }
  console.log(`server is listening on port ${port}`)
})