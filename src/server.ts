import express = require('express')
import bodyparser = require('body-parser')
import { MetricsHandler } from './metrics'

const app = express()
const port: string = process.env.PORT || '8080'

const dbMetrics = new MetricsHandler ("./db")

app.use(bodyparser.json())
app.use(bodyparser.urlencoded())

app.get('/', (req: any, res: any) => {
  res.write('Hello Bob')
  res.end()
})

app.get('/metrics/:id', (req: any, res: any) => {
  dbMetrics.get(req.params.id, (err: Error | null, result?: any) => {
    if (err) {
      throw err
    }
    res.json(result)
  })
})

app.post('/metrics/:id', (req: any, res: any) => {
  console.log(req.body)
  dbMetrics.save(req.params.id, req.body, (err: Error | null, result?: any) => {
    if (err) {
      res.status(500).send(err.message)
    }
    res.status(200).send()
  })
})

app.post('/metrics/delete/:id', (req: any, res: any) => {
  console.log(req.body)
  dbMetrics.del(req.params.id, (err: Error | null, result?: any) => {
    if (err) {
      res.status(500).send(err.message)
    }
    res.status(200).send()
  })
})

app.listen(port, (err: Error) => {
  if (err) {
    throw err
  }
  console.log(`server is listening on port ${port}`)
})