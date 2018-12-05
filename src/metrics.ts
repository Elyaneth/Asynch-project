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

  //Basic method to find a row in the db
  //Returns a Metric object  
  public get(key: string, callback: (error: Error | null, result?: Metric[]) => void) {
    const stream = this.db.createReadStream()

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

  
  //Save a key using the metric class
  //Does not return anything 
  public save(key: number, metrics: Metric[], callback: (error: Error | null) => void) {
      const stream = WriteStream(this.db)
  
      stream.on('error', callback)
      stream.on('close', callback)
      
      metrics.forEach(m => {
        stream.write({ key: `metric:${key}:${m.timestamp}`, value: m.value })
      })
  
       stream.end()
  }
  
  //Save a key without using the metric class
  //AVoids the creation of a metric object for nothing
  //Does not return anything 
  public registerusermetric(key: string, tt: string, val: string, callback: (error: Error | null) => void) {
    const stream = WriteStream(this.db)
  
    stream.on('error', callback)
    stream.on('close', callback)
    
    stream.write({ key: `metric:${key}:${tt}`, value: val })
    console.log(`save was successful on ${key}`);

    stream.end()
  }
  
  //Updates a metric using its value
  //Deletes the old metric and builds a new one.
  //If the user tries to update a metric that doesnt exists, it will simply create a new metric
  //Does not return anything 
  public updatevalue(newval: string, oldval: string, updatedtt:string, user: string, callback: (error: Error | null, result?: Metric[]) => void) {

    this.deletevalue(oldval, user, (err: Error | null) => {
      //res.status(200).send("metric deleted")
    })

    this.registerusermetric(user, updatedtt, newval, (err: Error | null, result?: any) => {
    })
  }

  //Deletes a metric using its key
  //Does not return anything 
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

  //Deletes a metric using its key
  //Does not return anything 
  //Note: later key is used to identify the owner of the metric.
  //so we need to to value instead
  //checks both user & value to never delete someone elses metric
  public deletevalue(val: string, user: string, callback: (error: Error | null, result?: Metric[]) => void) {
    const stream = this.db.createReadStream()

    stream.on('error', callback)
    stream.on('end', (err: Error) => {callback(null)})
    stream.on('data', (data:any) => {
        const k = data.value
        const [ , key, timestamp] = data.key.split(":")
        if(k == val && key == user){
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