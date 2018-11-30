import LevelDb from './leveldb'
import WriteStream from 'level-ws'

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
    this.db.put(`user:${user.username}`, `${user.getPassword}:${user.email}`)
  }

  public register(user: User, callback: (err: Error | null) => void) {

    var test = user.password

    console.log(test)
    
    user.setPassword

    console.log(test)

    this.db.put(`user:${user.username}`, `${user.password}:${user.email}`)
  }


  public delete(username: string, callback: (err: Error | null) => void) {
    // TODO
    this.db.del(username);
  }

  constructor(path: string) {
    this.db = LevelDb.open(path)
  }
}


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

      //Reading test
      //var bob = bcrypt.compareSync("bambi", hash);
      //console.log(bob)

      this.password = toSet
    }
    
    //useless
    public getPassword(): string {
        return this.password
    }
    
    public validatePassword(toValidate: String): boolean {
      const bcrypt = require('bcrypt');

      bcrypt.compareSync(toValidate, this.password);

      return this.password === toValidate
    }
}
  
