import Discord from 'discord.js'
import dotenv from 'dotenv'
import fs from 'fs'
import path from 'path'
import Dictionary from './dictionary'
import {Game, Word} from './game'

dotenv.config()

if(!process.env.BOT_TOKEN){
    console.error("Discord token is not defined!")
    process.exit()
}

type UserState = {[key: string]: any, isGameGoing: boolean, word: Word}

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
    public state: UserState = {
        isGameGoing: false,
        word: new Word('', [])
    }
    constructor(
        public readonly Discord_id: string,
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
    getState(tel_id: string): UserState{
        return this.users.filter( user => user.Discord_id === tel_id)[0].state || false
    }
}


const UsersManager = new UseresColection(dumb.getDumb())


const client = new Discord.Client()
const GameEngine = new Game()

client.on('ready', () => {
    console.log(`Logged in as ${client.user?.tag}`);
    
})

client.on('message', msg => {
    const isNewUser = UsersManager.softPush(new DiscordUser(
        msg.author.id,
        msg.author.username
    ))

    const CurrentState = UsersManager.getState(msg.author.id) || {}
    const command = msg.content.split('/')[1].split(' ')[0] || false
    if(!command){
        return
    }
    const args = msg.content.split('/')[1].split(' ')[0] || []
    switch(command){
        case 'start':
          if(CurrentState.isGameGoing === false){
            const newWord =  GameEngine.createWord(Dictionary.getWord())

            UsersManager.setState(msg.author.id, (prev) => ({...prev, word: newWord, isGameGoing: true}))
            msg.guild?.channels.create('Гра Шибинеця [TEMP]', {
                type: 'text',
                permissionOverwrites: [
                    {
                        id: msg.author.id,
                        allow: ["VIEW_CHANNEL", "SEND_MESSAGES", "READ_MESSAGE_HISTORY"]
                    }
                ]
            }).then((Chanel) => {
                Chanel.send("Гра буде іти тут! Прошу перейти у цей канал!")
                UsersManager.setState(msg.author.id, (prev) => ({...prev, chanelID: Chanel.id}))
            })
          }else{
            msg.reply("Ви уже запустили гру!")  
          }
        break;
        case 'g':
            try {
                const word = GameEngine.openLetter(Word.from(CurrentState.word), args[0])   
                UsersManager.setState(msg.author.id, (prev) => ({...prev, word}))
                msg.reply(word.text)             
            } catch (error) {
                msg.reply('Ви ввели некоректні дані або ж даної букви немає у слові!')   
            }
        break;
    }
});

client.login(process.env.BOT_TOKEN)