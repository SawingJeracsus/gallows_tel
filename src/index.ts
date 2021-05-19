import dotenv from 'dotenv'
import fs from 'fs'
import path from 'path'

dotenv.config()
if(!process.env.BOT_TOKEN){
    console.error("Telegram token is not defined!")
    process.exit()
}

type UserState = {[key: string]: any}
class Dumb{
    static readonly path = path.join(__dirname, '../', 'dumb.json')
    getDumb(): TelegramUser[]{
        try {
            //@ts-ignore
            return JSON.parse(fs.readFileSync(Dumb.path).toString('utf-8'))            
        } catch (error) {
            this.setDumb([])
            return []
        }
    }
    setDumb(newDumb: TelegramUser[]){
        try {
            fs.writeFileSync(Dumb.path, JSON.stringify(newDumb))
            return true
        } catch (error) {
            return false            
        }
    }
}

class TelegramUser{
    public state: UserState = {}
    constructor(
        public readonly telegram_id: string,
        public readonly firstName: string,
        public readonly lastName: string,
        public readonly userName: string,
    ){}
}
const dumb = new Dumb()
class UseresColection{
    constructor(
        private users: TelegramUser[]
    ){}
    private push(user: TelegramUser){
        this.users.push(user)
        dumb.setDumb(this.users)        
    }
    public softPush(newUser: TelegramUser): boolean{
        const isUserNew = this.users.filter(user => user.telegram_id === newUser.telegram_id).length === 0
        if(isUserNew){
            this.push(newUser)
        }
        return isUserNew
    }
    setState(tel_id: string, callback: (prev: UserState) => UserState){
        this.users.map(user => {
            if(user.telegram_id === tel_id){
                user.state = callback(user.state)
            }
            return user
        })
    }
    getState(tel_id: string){
        this.users.filter( user => user.telegram_id === tel_id)[0] || false
    }
}


const UsersManager = new UseresColection(dumb.getDumb())

