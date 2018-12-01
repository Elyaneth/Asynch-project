import express = require('express')
import morgan = require('morgan')
import bodyparser = require('body-parser')
import session = require('express-session')
import levelSession = require('level-session-store')
import path = require('path')
import { UserHandler, User } from './user'
import { MetricsHandler } from './metrics'


const LevelStore = levelSession(session)

const app = express()
const port: string = process.env.PORT || '8080'

const dbMetrics = new MetricsHandler ("./db")

app.use(bodyparser.json())
app.use(bodyparser.urlencoded())

app.use(morgan('dev'))

app.use(session({
  secret: 'this is a very secret phrase',
  store: new LevelStore('./db/sessions'),
  resave: true,
  saveUninitialized: true
}))


app.set('views', __dirname + '/views')
app.set('view engine', 'ejs')

app.use('/', express.static(path.join( __dirname, '/../node_modules/jquery/dist')))
app.use('/', express.static(path.join( __dirname, '/../node_modules/bootstrap/dist')))


const authCheck = function (req: any, res: any, next: any) {
  if (req.session.loggedIn) {
    next()
  } else res.redirect('/login')
}

app.get('/', authCheck, (req: any, res: any) => {
  console.log(req.session.user.username)
  res.render('index', { name: req.session.user.username })
})

//USERS
const userRouter = express.Router()
const dbUser: UserHandler = new UserHandler('./db/users')

//BUG VOIR SLIDES UPDATES
// erreur : cant set headers after they are sent
userRouter.get('/:username', function (req: any, res: any, next: any) {
  dbUser.get(req.params.username, function (err: Error | null, result?: User) {
    if (err || result === undefined) {
      //res.status(404).send("user not found")
    } else res.status(200).json(result)
  })
})

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

//SAUVERGARDER USER (test)
userRouter.get('/save/:username&:mail&:password', function (req: any, res: any, next: any) {
    var us = new User(req.params.username,req.params.mail,req.params.password)

    console.log(us.username)
    console.log(us.email)
    console.log(us.password)

    dbUser.save(us, (err: Error | null) => {
      if (err) next(err)
      res.status(200).send("user registered")
    })
})

//DELETE USER
userRouter.delete('/:username', function (req: any, res: any, next: any) {

  dbUser.delete(req.params.username, (err: Error | null) => {
    if (err) next(err)
    res.status(200).send("user deleted")
  })
})

//read all the user db, check for one username
userRouter.get('/read/:username', function (req: any, res: any, next: any) {

  dbUser.readall(req.params.username, (err: Error | null, result?: string) =>{
    if (err) next(err)
    //res.status(200).send(result)
    console.log("data =" + result)
    res.render('readdb', { data: result })
  })
})

app.use('/user', userRouter)


//AUTHENTICATION
const Authrouter = express.Router()

Authrouter.get('/login', function(req: any, res: any) {
  res.render('login')
})

Authrouter.post('/login', (req: any, res: any, next: any) => {
  dbUser.get(req.body.username, function(err: Error | null, result?: User){
    if (err) next(err)
    //console.log(result)
    //console.log(req.body.password)

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

Authrouter.get('/signup', function(req: any, res: any) {
  res.render('signup')
})

Authrouter.get('/logout', function (req: any, res: any) {
  if (req.session.loggedIn) {
    delete req.session.loggedIn
    delete req.session.user
  }
  res.redirect('/login')
})

app.use(Authrouter)

//ROUTE
const router = express.Router()

router.use(function (req: any, res: any, next: any) {
  console.log('router: '  + req.method + ' on ' + req.url)
  next()
})

router.get('/', (req: any, res: any) => {
  res.write('Hello Bob')
  res.end()
})


//METRICS
router.get('/:id', (req: any, res: any, next:any) => {
  dbMetrics.get(req.params.id, (err: Error | null, result?: any) => {
    if (err) next(err)
    res.json(result)
  })
})

router.post('/:id', (req: any, res: any, next:any) => {
  console.log(req.body)
  dbMetrics.save(req.params.id, req.body, (err: Error | null, result?: any) => {
    if (err) next(err)
    res.status(200).send()
  })
})

router.delete('/:id', (req: any, res: any, next:any) => {
  console.log(req.body)
  dbMetrics.del(req.params.id, (err: Error | null, result?: any) => {
    if (err) next(err)
    res.status(200).send()
  })
})

app.use('/metrics', authCheck, router)

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