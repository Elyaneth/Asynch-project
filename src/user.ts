import LevelDb from './leveldb'
import WriteStream from 'level-ws'
export class User {

    public username: string
    public email: string
    private password: string = ""
  
    constructor(username: string, email: string, password: string, passwordHashed: boolean = false) {
      this.username = username
      this.email = email
  
      if (!passwordHashed) {
        this.setPassword(password)
      } else this.password = password
    }

    //Method used to return a user from the db
    //( true = PASSWORD NOT ENCRYPTED ) => password is already encrypted in DB
    static fromDb(username:any, data: any): User {
      const [ password, email] = data.split(":")

      return new User(username,email,password, true)
    }
    
    //Encrypts given password
    //Only to use one user creation
    public setPassword(toSet: string): void {
      // Hash and set password
      const bcrypt = require('bcrypt');
      const saltRounds = 10;

      var salt = bcrypt.genSaltSync(saltRounds);
      var hash = bcrypt.hashSync(toSet, salt);

      this.password = hash
    }
    
    //Basic getter
    public getPassword(): string {
       return this.password
    }
    
    //Checks if the password given is equal to the crypted one
    // (password given from form, crypted password from DB)
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

  //Checks DB for the username
  //If username is found in the DB, returns a User object (using fromDB)
  public get(username: string, callback: (err: Error | null, result?: User) => void) {
    this.db.get(`user:${username}`, function (err: Error, data: any) {
      //removed to prevent header error
      //if (err) callback(err)
      if (data === undefined) callback(null, data)
      else{
        callback(null, User.fromDb(username, data))
      } 
    })
  }

  //Saves user into DB
  //returns nothing
  public save(user: User, callback: (err: Error | null) => void) {
    this.db.put(`user:${user.username}`, `${user.getPassword()}:${user.email}`)
  }

  //Deletes user from DB
  //Returns null
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

  //Reads all users in DB
  //Mostly used for testing
  public readall(username: string, callback: (err: Error | null, result?: User[]) => void) {
    const stream = this.db.createReadStream()

    var results: User[] = []

    stream.on('error', callback)
    stream.on('end', function() {callback(null, results) })
    stream.on('data', (data:any) => {
        const [ , k] = data.key.split(":")
        const [pass, mail] = data.value.split(":")
         results.push(new User(k, mail, pass, true))
        
    })
  }

  constructor(path: string) {
    this.db = LevelDb.open(path)
  }
}



  
