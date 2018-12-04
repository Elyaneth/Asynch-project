#!/usr/bin/env ts-node

import { MetricsHandler, Metric } from '../src/metrics'

const dbMet = new MetricsHandler('db/metrics')

const met = [
  new Metric('2013-11-05 14:00 UTC', 12)
]

const met2 = [
  new Metric('2013-11-04 14:10 UTC', 13)
]

dbMet.save(12, met, (err: Error | null) => {
  if (err) throw err
  console.log('Metrics saved')
})

dbMet.save(13, met2, (err: Error | null) => {
  if (err) throw err
  console.log('Metrics saved')
})