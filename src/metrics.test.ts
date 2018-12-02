import { expect } from 'chai'
import { Metric, MetricsHandler } from './metrics'
import LevelDb from './leveldb'

const dbPath: string = 'db_test'
var dbMet: MetricsHandler
  
describe('Metrics', function () {
  before(function () {
    LevelDb.clear(dbPath)
    dbMet = new MetricsHandler(dbPath)
  })

  after(function () {
    dbMet.db.close()
  })

  describe('#get', function () {
    it('should get empty array on non existing group', function () {
      dbMet.get("yee haw", (err: Error | null, result?: Metric[]) => {
        expect(err).to.be.null
        expect(result).to.not.be.undefined
        expect(result).to.be.an('array')
        expect(result).to.be.empty
      })
    })
  })

  describe('#save', function () {
    it('should save data', function () {

      var test = Metric[1]

      test.push(new Metric("12/01/2015",1));
      
      dbMet.save(12, test , (err: Error | null) => {
        expect(err).to.be.null
      })
    })

    it('should update data', function () {
      // ?
    })
  })

  describe('#registerusermetric', function () {
    it('should register data', function () {
      dbMet.registerusermetric("nathan","02/12/2018","hello",  (err: Error | null) => {
        expect(err).to.be.null
      })
    })
  })

  describe('#del', function () {
    it('should delete data', function () {
      dbMet.del(1, (err: Error | null) => {
        expect(err).to.be.null
      })
    })
  })

  describe('#deletevalue', function () {
    it('should delete data', function () {
      dbMet.deletevalue("hello", (err: Error | null) => {
        expect(err).to.be.null
      })
    })
  })

})