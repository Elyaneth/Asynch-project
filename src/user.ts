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

  public delete(username: string, callback: (err: Error | null) => void) {
    // TODO
  }

  constructor(path: string) {
    this.db = LevelDb.open(path)
  }
}


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

    static fromDb(username:any, value: any): User {
        // Parse db result and return a User
        const [ password, email] = value.value.split(":")

        return new User(username,email,password)
    }
    
    public setPassword(toSet: string): void {
        // Hash and set password
        // check bcrypt
        this.password = toSet
    }
    
    public getPassword(): string {
        return this.password
    }
    
    public validatePassword(toValidate: String): boolean {
        // return comparison with hashed password
        //return this.password.tovalidate
        return false
    }
}
  
