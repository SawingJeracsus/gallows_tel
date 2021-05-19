import Discord from 'discord.js'
import dotenv from 'dotenv'
import fs from 'fs'
import path from 'path'
import Dictionary from './dictionary'

dotenv.config()
if(!process.env.BOT_TOKEN){
    console.error("Discord token is not defined!")
    process.exit()
}

type UserState = {[key: string]: any}

class Dumb{
    static readonly path = path.join(__dirname, '../', 'dumb.json')
    getDumb(): DiscordUser[]{
        try {
            //@ts-ignore
            return JSON.parse(fs.readFileSync(Dumb.path).toString('utf-8'))            
        } catch (error) {
            this.setDumb([])
            return []
        }
    }
    setDumb(newDumb: DiscordUser[]){
        try {
            fs.writeFileSync(Dumb.path, JSON.stringify(newDumb))
            return true
        } catch (error) {
            return false            
        }
    }
}

class DiscordUser{
    public state: UserState = {}
    constructor(
        public readonly Discord_id: string,
        public readonly firstName: string,
        public readonly lastName: string,
        public readonly userName: string,
    ){}
}
const dumb = new Dumb()
class UseresColection{
    constructor(
        private users: DiscordUser[]
    ){}
    private push(user: DiscordUser){
        this.users.push(user)
        dumb.setDumb(this.users)        
    }
    public softPush(newUser: DiscordUser): boolean{
        const isUserNew = this.users.filter(user => user.Discord_id === newUser.Discord_id).length === 0
        if(isUserNew){
            this.push(newUser)
        }
        return isUserNew
    }
    setState(tel_id: string, callback: (prev: UserState) => UserState){
        this.users.map(user => {
            if(user.Discord_id === tel_id){
                user.state = callback(user.state)
            }
            return user
        })
    }
    getState(tel_id: string){
        this.users.filter( user => user.Discord_id === tel_id)[0] || false
    }
}


const UsersManager = new UseresColection(dumb.getDumb())


const client = new Discord.Client()
client.on('ready', () => {
    console.log(`Logged in as ${client.user?.tag}`);
    
})

client.on('message', msg => {
    // msg.
//   const command = msg.content.split('/')[1] || false
//   if(!command){
//       return
//   }

//   switch(command){
//       case 'start':
//         msg.reply(Dictionary.getWord())    
//       break;
//   }
});

client.login(process.env.BOT_TOKEN)