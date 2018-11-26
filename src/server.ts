import express = require('express')
import bodyparser = require('body-parser')
import { MetricsHandler } from './metrics'

const app = express()
const port: string = process.env.PORT || '8080'

const dbMetrics = new MetricsHandler ("./db")

app.use(bodyparser.json())
app.use(bodyparser.urlencoded())

app.use(function (req: any, res: any, next: any) {
  console.log(req.method + ' on ' + req.url)
  next()
})


const router = express.Router()

router.use(function (req: any, res: any, next: any) {
  console.log('router: '  + req.method + ' on ' + req.url)
  next()
})


router.get('/', (req: any, res: any) => {
  res.write('Hello Bob')
  res.end()
})

router.get('/:id', (req: any, res: any) => {
  dbMetrics.get(req.params.id, (err: Error | null, result?: any) => {
    if (err) {
      throw err
    }
    res.json(result)
  })
})

router.post('/:id', (req: any, res: any) => {
  console.log(req.body)
  dbMetrics.save(req.params.id, req.body, (err: Error | null, result?: any) => {
    if (err) {
      res.status(500).send(err.message)
    }
    res.status(200).send()
  })
})

//change that post into a delete thing
router.post('/delete/:id', (req: any, res: any) => {
  console.log(req.body)
  dbMetrics.del(req.params.id, (err: Error | null, result?: any) => {
    if (err) {
      res.status(500).send(err.message)
    }
    res.status(200).send()
  })
})

app.use('/metrics', router)

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