import Discord, { Client, DiscordAPIError, MessageEmbed, User, UserManager } from 'discord.js'
import dotenv from 'dotenv'
import fs from 'fs'
import path from 'path'
import { animation } from './animation'
import Dictionary from './dictionary'
import {Game, Word} from './game'
import { HamsterCoinScema } from './Scemas/scema'

const mongoose = require("mongoose");
const {MongooseAutoIncrementID} = require("mongoose-auto-increment-reworked");

dotenv.config()

if(!process.env.BOT_TOKEN){
    console.error("Discord token is not defined!")
    process.exit()
}

mongoose.connect(
    process.env.DATABASE_URL,
    {
      useNewUrlParser: true,
      useUnifiedTopology: true,
      useCreateIndex: true,
      useFindAndModify: false,
    },
    (err: any) => {
      if (err) throw err;
      console.log("[Database] База данных Mongo успешно подключена.");
    }
  );
MongooseAutoIncrementID.initialize(mongoose.connection);
  

type UserState = {[key: string]: any, isGameGoing: boolean, word: Word, lifes: number, lastActive: Date, message: string}

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
        lifes: 7,
        lastActive: new Date(),
        message: ''
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
    getUsersByParram(param: keyof UserState, value: any): DiscordUser[]{
        const result = this.users.filter(user => this.getState(user.Discord_id)[param] === value)
        return result || []
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
type GallowClaback = (user: DiscordUser, state: UserState, client? : Discord.Client) => void

export class GallowsBotInterface{
    private static subcribers: {[key: string]: GallowClaback[]} = {}
    private static client: Discord.Client | undefined

    static EVENTS = EVENTS
    static subscribe(event: GallowsBotInterface, callback: GallowClaback){
        //@ts-ignore
        this.subcribers[event] = this.subcribers[event] ? [...this.subcribers[event], callback] : [callback]  
    }
    static dispatch(event: GallowBotEvent, user: DiscordUser, state: UserState){
        if(this.subcribers[event]){
            this.subcribers[event].forEach((callback) => {
                this.client ? callback(user, state, this.client) : callback(user, state) 
            })
        }
    }
    static startDeamon(ms: number, UsersManager: UseresColection, msg: Discord.Message){
        setInterval(() => {
            const activeUsers = UsersManager.getUsersByParram('isGameGoing', true)
            activeUsers.map(user => {
                const state = UsersManager.getState(user.Discord_id)
                const timeDelta = (new Date().getTime() - new Date(state.lastActive).getTime())/1000 
                
                if(timeDelta > 180){
                    //неактивний уже 180 секунд
                    msg.guild?.channels.cache.get(state.chanelID)?.delete()
                    GallowsBotInterface.dispatch(GallowsBotInterface.EVENTS.CHANEL_DELETED, user, state)
                    GallowsBotInterface.dispatch(GallowsBotInterface.EVENTS.LOSE, user, state)
                    UsersManager.setState(msg.author.id, (prev) => ({...prev, isGameGoing: false}))
                    console.log(`${user.userName} game was deleted (time has expired)`);
                    
                }

            })
        }, ms)  
    }
    static start(){
    const dumb = new Dumb()    
    const UsersManager = new UseresColection(dumb.getDumb(), dumb)
        
    const client = new Discord.Client()
    const GameEngine = new Game()
     
    client.on('ready', () => {
        console.log(`Logged in as ${client.user?.tag}`);
    })
    
    client.on('message', async msg => {
        if(!msg?.member?.id){
            return
        }

        const DBUser = await HamsterCoinScema.findOne({id: msg.member.id})
        
        
        if(msg.channel.id !== process.env.CHANEL){
            return
        }
        if(!DBUser){
            return
        }
        //@ts-ignore
        if(msg.author.id === client.user.id && client) return
        
        this.startDeamon(2000, UsersManager, msg)    
        
        const CurrentUser = new DiscordUser(
            msg.author.id,
            msg.author.username
        )
        const isNewUser = UsersManager.softPush(CurrentUser)
        UsersManager.setState(CurrentUser.Discord_id, (prev) => ({...prev, lastActive: new Date(), message: msg.content}))
        const CurrentState = UsersManager.getState(msg.author.id) || {}
        
        GallowsBotInterface.dispatch(GallowsBotInterface.EVENTS.MESSAGE, CurrentUser, CurrentState)

        const commandWithArgs = msg.content.split('/')
        const command = commandWithArgs.length > 1 ? commandWithArgs[1].split(' ')[0] : commandWithArgs      
        const args = commandWithArgs.length > 1 ? commandWithArgs[1].split(' ').filter((_1, i) => i !== 0) : []      
        
        if(!command){
            // if()
            return
        }
        const guessLogic = (guess: string) => {
            if(!CurrentState.isGameGoing){ return }
            GallowsBotInterface.dispatch(GallowsBotInterface.EVENTS.GUESS, CurrentUser, CurrentState)
            try {
                const word = GameEngine.openLetter(Word.from(CurrentState.word), guess)   
                UsersManager.setState(msg.author.id, (prev) => ({...prev, word, isGameGoing: !word.isOppened, lifes: CurrentState.lifes + 1 > 7 ? 7 : CurrentState.lifes + 1}))
                if(word.isOppened){
                    GallowsBotInterface.dispatch(GallowsBotInterface.EVENTS.WON, CurrentUser, CurrentState)
                    msg.reply("Вы угадали слово это: - "+word.text)

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
Этой буквы нету. Осталось жизней! - ${CurrentState.lifes - 1}`) 
                }else{
                    GallowsBotInterface.dispatch(GallowsBotInterface.EVENTS.LOSE, CurrentUser, CurrentState)
                    msg.reply('Вы проиграли! Это было слово! "'+CurrentState.word.word+'"')
                    UsersManager.setState(msg.author.id, (prev) => ({...prev, isGameGoing: false}))
                    setTimeout(() => {
                        msg.guild?.channels.cache.get(CurrentState.chanelID)?.delete()
                        GallowsBotInterface.dispatch(GallowsBotInterface.EVENTS.CHANEL_DELETED, CurrentUser, CurrentState)
                    }, 2000)
                }
            }            
        }


        if(msg.channel.id === CurrentState.chanelID){
            guessLogic(msg.content)
            return
        }
        
        
        // if()
        switch(command){
            case 'start':
            msg.delete()
            let bet = 0

            try {
                bet = parseInt(args[0])
            } catch (error) {
                msg.reply("Указаний параметр не являеться числом");
                return
            }

            if (bet < 1) {
                msg.reply("Укажите значение больше 0");
                console.log(msg.member.id);
                return;
              }
  
              if (!args[0]) {
                msg.reply("Укажите сумму для начала");
                return;
              }
  
             
              if (!DBUser) {
                msg.reply(
                  "Вы не зарегистрированы в базе! \n Используйте: /register"
                );
                return;
              }
              if (DBUser.balance < args[0]){
                msg.reply("У вас не хватает средств!");
                return 
              }
            
            await HamsterCoinScema.findOneAndUpdate({
                id: msg.author.id,
                balance: DBUser.balance - bet,
                currentcoins: bet * 2,
              });
            


            if(CurrentState.isGameGoing === false){
                const newWord =  GameEngine.createWord(Dictionary.getWord())
                UsersManager.setState(msg.author.id, (prev) => ({...prev, word: newWord, isGameGoing: true, lifes: 7}))
                msg.guild?.channels.create(`Игра виселица [${CurrentUser.userName}]`, {
                    type: 'text',
                    permissionOverwrites: [
                        {
                            id: msg.guild.roles.everyone,
                            deny: ["VIEW_CHANNEL", "SEND_MESSAGES", "READ_MESSAGE_HISTORY"]
                        },
                        {
                            id: msg.author.id,
                            allow: ["VIEW_CHANNEL", "SEND_MESSAGES", "READ_MESSAGE_HISTORY"]
                        }
                    ],

                }).then((Chanel) => {
                    GallowsBotInterface.dispatch(GallowsBotInterface.EVENTS.CHANEL_CREATED, CurrentUser, CurrentState)
                    msg.reply(`Ваша игра готова! <#${Chanel.id}>`)
                    Chanel.send("Игра будет происходить в этом канале!")
                    Chanel.send("Длина слова - "+newWord.chars.length)
                    
                    if(isNewUser){
                        Chanel.send(
                            new MessageEmbed()
                          .setColor("#E74C3C")
                          .setTitle("**Информация по игре**")
                          .setDescription(
                            "**1. Продолжительность игры: 180 секунд, не успели ввести правильный ответ - вы проиграли\n2. Находясь в данном канале, любое сообщение, написанное вами будет восприниматься, как ответ на вопрос\n3. Вводить ответ нужно СТРОГО 1 буквой русского языка с МАЛЕНЬКОЙ буквы.**"
                          )
                        )//rules here
                    }
                    UsersManager.setState(msg.author.id, (prev) => ({...prev, chanelID: Chanel.id}))
                    GallowsBotInterface.dispatch(GallowsBotInterface.EVENTS.START, CurrentUser, UsersManager.getState(CurrentUser.Discord_id))

                })
              }else{
                msg.reply("Вы уже запустили игру!")  //
              }
            break;
            case 'g':
                guessLogic(args[0])
            break;
        }
    });
    this.client = client

    client.login(process.env.BOT_TOKEN)

    }    
}