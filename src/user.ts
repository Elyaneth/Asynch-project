import LevelDb from './leveldb'
import WriteStream from 'level-ws'
export class User {

    public username: string
    public email: string
    //HAD TO CHNAGE TO PUBLIC GETTERS NOT WORKING
    public password: string = ""
  
    constructor(username: string, email: string, password: string, passwordHashed: boolean = false) {
      this.username = username
      this.email = email
  
      if (!passwordHashed) {
        this.setPassword(password)
      } else this.password = password
    }

    static fromDb(username:any, value: any): User {
        const [ password, email] = value.value.split(":")

        return new User(username,email,password)
    }
    
    public setPassword(toSet: string): void {
      // Hash and set password
      const bcrypt = require('bcrypt');
      const saltRounds = 10;

      var salt = bcrypt.genSaltSync(saltRounds);
      var hash = bcrypt.hashSync(toSet, salt);

      this.password = hash
    }
    
    //useless
    //public getPassword(): string {
    //    return this.password
    //}
    
    public validatePassword(toValidate: String): boolean {
      const bcrypt = require('bcrypt');

      bcrypt.compareSync(toValidate, this.password);

      return this.password === toValidate
    }
}


export class UserHandler {
  public db: any

  public get(username: string, callback: (err: Error | null, result?: User) => void) {
    this.db.get(`user:${username}`, function (err: Error, data: any) {
      if (err) callback(err)
      if (data === undefined) callback(null, data)
      else callback(null, User.fromDb(username, data))
    })
  }

  public save(user: User, callback: (err: Error | null) => void) {
    this.db.put(`user:${user.username}`, `${user.password}:${user.email}`)
  }

  public delete(username: string, callback: (err: Error | null) => void) {
    const stream = this.db.createReadStream()

    stream.on('error', callback)
    stream.on('end', (err: Error) => {callback(null)})
    stream.on('data', (data:any) => {
        const [ , k] = data.key.split(":")
        if(k == username){
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

  public readall(username: string, callback: (err: Error | null, result?: string) => void) {
    const stream = this.db.createReadStream()

    var info = "keys found: \n"

    stream.on('error', callback)
    stream.on('end', function() {callback(null, info) })
    stream.on('data', (data:any) => {
        const [ , k] = data.key.split(":")
        const [pass, mail] = data.value.split(":")
        const value = data.value
        if(k != username){
            info += `${data.key} \n `
        }
        else{
         console.log(`levedb success: ${data.key} key does match`)
         console.log(k+", "+ pass +", "+ mail)
         info += `${data.key}, `
        }
      console.log(info)
    })
      
  }

  constructor(path: string) {
    this.db = LevelDb.open(path)
  }
}



  
