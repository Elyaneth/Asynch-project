import LevelDb from './leveldb'
import WriteStream from 'level-ws'

export class Metric {
  public timestamp: Date
  public value: number

  constructor(ts: string, v: number) {
    this.timestamp = new Date(ts)
    this.value = v
  }
}

export class MetricsHandler {
    public db: any 

    constructor(dbPath: string) {
      this.db = LevelDb.open(dbPath)
    }

    
  public get(key: string, callback: (error: Error | null, result?: Metric[]) => void) {
    const stream = this.db.createReadStream()

    console.log(key)

    var results: Metric[] = []

    stream.on('error', callback)
    stream.on('end', (err: Error) => {callback(null, results)})
    stream.on('data', (data:any) => {
        const [ , k, timestamp] = data.key.split(":")
        const value = data.value
        if(k != key){
        }
        else{
         results.push(new Metric(timestamp,value))
        }
    })
  }

  //save a key using the metric class
  public save(key: number, metrics: Metric[], callback: (error: Error | null) => void) {
      const stream = WriteStream(this.db)
  
      stream.on('error', callback)
      stream.on('close', callback)
      
      metrics.forEach(m => {
        stream.write({ key: `metric:${key}:${m.timestamp}`, value: m.value })
      })
  
       stream.end()
  }
  
  //save a key without using the metric class
  public registerusermetric(key: string, tt: string, val: string, callback: (error: Error | null) => void) {
    const stream = WriteStream(this.db)

    console.log(key)
  
    stream.on('error', callback)
    stream.on('close', callback)
    
    stream.write({ key: `metric:${key}:${tt}`, value: val })

    stream.end()
  }

  //delete a metric using its key
  public del(key: number, callback: (error: Error | null) => void) {
    const stream = this.db.createReadStream()

    stream.on('error', callback)
    stream.on('end', (err: Error) => {callback(null)})
    stream.on('data', (data:any) => {
        const [ , k, timestamp] = data.key.split(":")
        if(k == key){
          this.db.del(data.key, function(error){
            if(error != null){
              console.log("there was an error");
            }
            else{
              console.log(`delete was successful on ${data.key}`);
            }
          })
        }
    })
  }

    //delete a metric using its value
  public deletevalue(val: string, user: string, callback: (error: Error | null, result?: Metric[]) => void) {
    const stream = this.db.createReadStream()

    stream.on('error', callback)
    stream.on('end', (err: Error) => {callback(null)})
    stream.on('data', (data:any) => {
        const k = data.value
        const [ , key, timestamp] = data.key.split(":")
        if(k == val && key == user){
          console.log(data.value)
          console.log(data.key)
          this.db.del(data.key, function(error){
            if(error != null){
              console.log("there was an error");
            }
            else{
              console.log(`delete was successful on ${data.key}`);
            }
          })
        }
    })
  }
}