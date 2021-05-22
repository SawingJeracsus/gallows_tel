import Discord, { User } from 'discord.js'
import dotenv from 'dotenv'
import fs from 'fs'
import path from 'path'
import { animation } from './animation'
import Dictionary from './dictionary'
import {Game, Word} from './game'

dotenv.config()

if(!process.env.BOT_TOKEN){
    console.error("Discord token is not defined!")
    process.exit()
}

type UserState = {[key: string]: any, isGameGoing: boolean, word: Word, lifes: number}

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
        word: new Word('', []),
        lifes: 7
    }
    constructor(
        public readonly Discord_id: string,
        public readonly userName: string,
    ){}
}

class UseresColection{
    constructor(
        private users: DiscordUser[],
        private DumbManager: Dumb
    ){}
    private push(user: DiscordUser){
        this.users.push(user)
        this.DumbManager.setDumb(this.users)        
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
        this.DumbManager.setDumb(this.users)
    }
    getState(tel_id: string): UserState{
        return this.users.filter( user => user.Discord_id === tel_id)[0].state || false
    }
}

enum EVENTS {
    START = 'START',
    GUESS = 'GUESS',
    CHANEL_CREATED = 'CHANEL_CREATED',
    CHANEL_DELETED = 'CHANEL_DELETED',
    MESSAGE = 'MESSAGE',
    WON = 'WON',
    LOSE = 'LOSE'
}
type GallowBotEvent = 'START' | 'GUESS' | 'CHANEL_CREATED' | 'CHANEL_DELETED' | 'MESSAGE' | 'WON' | 'LOSE'
type GallowClaback = (user: DiscordUser, state: UserState) => void

export class GallowsBotInterface{
    private static subcribers: {[key: string]: GallowClaback[]} = {}
    static EVENTS = EVENTS
    static subscribe(event: GallowsBotInterface, callback: GallowClaback){
        //@ts-ignore
        this.subcribers[event] = this.subcribers[event] ? [...this.subcribers[event], callback] : [callback]  
    }
    static dispatch(event: GallowBotEvent, user: DiscordUser, state: UserState){
        if(this.subcribers[event]){
            this.subcribers[event].forEach((callback) => {
                callback(user, state)
            })
        }
    }
    static start(){
    const dumb = new Dumb()    
    const UsersManager = new UseresColection(dumb.getDumb(), dumb)
        
        
    const client = new Discord.Client()
    const GameEngine = new Game()
        
    client.on('ready', () => {
        console.log(`Logged in as ${client.user?.tag}`);
    })
    
    client.on('message', msg => {
        const CurrentUser = new DiscordUser(
            msg.author.id,
            msg.author.username
        )
        const isNewUser = UsersManager.softPush(CurrentUser)
        
        const CurrentState = UsersManager.getState(msg.author.id) || {}
        
        GallowsBotInterface.dispatch(GallowsBotInterface.EVENTS.MESSAGE, CurrentUser, CurrentState)

        const commandWithArgs = msg.content.split('/')
        const command = commandWithArgs.length > 1 ? commandWithArgs[1].split(' ')[0] : commandWithArgs      
        const args = commandWithArgs.length > 1 ? commandWithArgs[1].split(' ').filter((_1, i) => i !== 0) : []      
        
        if(!command){
            return
        }

        switch(command){
            case 'start':
            GallowsBotInterface.dispatch(GallowsBotInterface.EVENTS.START, CurrentUser, CurrentState)
            
            if(CurrentState.isGameGoing === false){
                const newWord =  GameEngine.createWord(Dictionary.getWord())
                UsersManager.setState(msg.author.id, (prev) => ({...prev, word: newWord, isGameGoing: true, lifes: 7}))
                msg.guild?.channels.create('Гра Шибинеця [TEMP]', {
                    type: 'text',
                    permissionOverwrites: [
                        {
                            id: msg.author.id,
                            allow: ["VIEW_CHANNEL", "SEND_MESSAGES", "READ_MESSAGE_HISTORY"]
                        }
                    ]
                }).then((Chanel) => {
                    GallowsBotInterface.dispatch(GallowsBotInterface.EVENTS.CHANEL_CREATED, CurrentUser, CurrentState)
                    Chanel.send("Гра буде іти тут! Прошу перейти у цей канал!")
                    UsersManager.setState(msg.author.id, (prev) => ({...prev, chanelID: Chanel.id}))
                })
              }else{
                msg.reply("Ви уже запустили гру!")  //
              }
            break;
            case 'g':
                GallowsBotInterface.dispatch(GallowsBotInterface.EVENTS.GUESS, CurrentUser, CurrentState)
                try {
                    const word = GameEngine.openLetter(Word.from(CurrentState.word), args[0])   
                    UsersManager.setState(msg.author.id, (prev) => ({...prev, word, isGameGoing: !word.isOppened, lifes: CurrentState.lifes + 1 > 7 ? 7 : CurrentState.lifes + 1}))
                    if(word.isOppened){
                        GallowsBotInterface.dispatch(GallowsBotInterface.EVENTS.WON, CurrentUser, CurrentState)
                        msg.reply("Ура! Ви відкрили слово повністю! Це було - "+word.text)
                        setTimeout(() => {
                            msg.guild?.channels.cache.get(CurrentState.chanelID)?.delete()
                            GallowsBotInterface.dispatch(GallowsBotInterface.EVENTS.CHANEL_DELETED, CurrentUser, CurrentState)
                        }, 2000)
                        return
                    }
                    msg.reply(word.text)             
                } catch (error) { 
                    if(CurrentState.lifes > 1){
                        UsersManager.setState(CurrentUser.Discord_id, (prev) => ({...prev, lifes: CurrentState.lifes - 1}))
                        
                        msg.reply(`
${animation[CurrentState.lifes - 1]}
Даної літери немає у слові! Лишилось житів - ${CurrentState.lifes - 1}`) 
                    }else{
                        GallowsBotInterface.dispatch(GallowsBotInterface.EVENTS.LOSE, CurrentUser, CurrentState)
                        msg.reply('Ви програли!Загаданим словом було слово "'+CurrentState.word.word+'"')
                        UsersManager.setState(msg.author.id, (prev) => ({...prev, isGameGoing: false}))
                        setTimeout(() => {
                            msg.guild?.channels.cache.get(CurrentState.chanelID)?.delete()
                            GallowsBotInterface.dispatch(GallowsBotInterface.EVENTS.CHANEL_DELETED, CurrentUser, CurrentState)
                        }, 2000)
                    }
                }
            break;
        }
    });

    client.login(process.env.BOT_TOKEN)

    }    
}