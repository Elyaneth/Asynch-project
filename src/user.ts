import LevelDb from './leveldb'
import WriteStream from 'level-ws'
export class User {

    public username: string
    public email: string
    //HAD TO CHANGE TO PUBLIC GETTERS NOT WORKING
    private password: string = ""
  
    constructor(username: string, email: string, password: string, passwordHashed: boolean = false) {
      this.username = username
      this.email = email
  
      if (!passwordHashed) {
        this.setPassword(password)
      } else this.password = password
    }

    //given data is the value of a database object (contains pass and email)
    //method used to return a new user with all required field (DO NOT ENCRYPT PASSWORD TWICE)
    static fromDb(username:any, data: any): User {
      const [ password, email] = data.split(":")

      return new User(username,email,password, true)
    }
    
    //encrypt given password
    public setPassword(toSet: string): void {
      // Hash and set password
      const bcrypt = require('bcrypt');
      const saltRounds = 10;

      var salt = bcrypt.genSaltSync(saltRounds);
      var hash = bcrypt.hashSync(toSet, salt);

      this.password = hash
    }
    
    //useless
    public getPassword(): string {
       return this.password
    }
    
    //check if the password given (toValidate) is equal to the crypted one
    public validatePassword(toValidate: String): boolean {
      const bcrypt = require('bcrypt');

      var test = bcrypt.compareSync(toValidate, this.password);

      console.log("test")
      console.log(bcrypt.compareSync(toValidate, this.password))

      return test
    }
}


export class UserHandler {
  public db: any

  //Checks db for the username
  public get(username: string, callback: (err: Error | null, result?: User) => void) {
    this.db.get(`user:${username}`, function (err: Error, data: any) {
      //removed to prevent header error
      //if (err) callback(err)
      if (data === undefined) callback(null, data)
      else{
        //console.log(data)
        callback(null, User.fromDb(username, data))
      } 
    })
  }

  //save user into db
  public save(user: User, callback: (err: Error | null) => void) {
    this.db.put(`user:${user.username}`, `${user.getPassword()}:${user.email}`)
  }

  //delete user from db
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

  //reads all users in db, with one sucess 
  public readall(username: string, callback: (err: Error | null, result?: User[]) => void) {
    const stream = this.db.createReadStream()

    var results: User[] = []

    stream.on('error', callback)
    stream.on('end', function() {callback(null, results) })
    stream.on('data', (data:any) => {
        const [ , k] = data.key.split(":")
        const [pass, mail] = data.value.split(":")
        const value = data.value
        if(k != username){
            results.push(new User(k, mail, pass, true))
        }
        else{
         results.push(new User(k, mail, pass, true))
        }
    })
  }

  constructor(path: string) {
    this.db = LevelDb.open(path)
  }
}



  
