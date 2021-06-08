import { GallowsBotInterface } from "./main";
import dotenv from 'dotenv'
import { MessageEmbed } from "discord.js";
dotenv.config()

GallowsBotInterface.start()

GallowsBotInterface.subscribe(GallowsBotInterface.EVENTS.START, (user, state, client) => {
    if(!client){
        return
    }

    const embeda = new MessageEmbed()
    .setColor("RED")
    .setTitle("[LOG] Начало игры в Виселицэ")
    .setDescription(
      `**Пользователь: <@!${user.Discord_id}> \nНачал игру в виселица со ставкой: ${state.bet} с словом ${state.word.word}**`
    )
    const chanel = client.channels.cache.get(process.env.CHANEL_FOR_LOGS as string)
    if(chanel){
        //@ts-ignore
        chanel.send(embeda);  
    }
})


GallowsBotInterface.subscribe(GallowsBotInterface.EVENTS.LOSE, (user, state, client) => {
    if(!client){
        return
    }

    const embeda = new MessageEmbed()
    .setColor("RED")
    .setTitle("[LOG] Окончание игры в Виселица пройгрышем")
    .setDescription(
      `**Пользователь: <@!${user.Discord_id}> \nЗакончил игру в виселица со пройгрышем: ${state.bet}**`
    )
    const chanel = client.channels.cache.get(process.env.CHANEL_FOR_LOGS as string)
    if(chanel){
        //@ts-ignore
        chanel.send(embeda);  
    }
})


GallowsBotInterface.subscribe(GallowsBotInterface.EVENTS.WON, (user, state, client) => {
    if(!client){
        return
    }

    const embeda = new MessageEmbed()
    .setColor("RED")
    .setTitle("[LOG] Окончание игры в Виселица победой")
    .setDescription(
      `**Пользователь: <@!${user.Discord_id}> \nЗакончил игру в виселица со выигрышем: +${state.bet}**`
    )
    const chanel = client.channels.cache.get(process.env.CHANEL_FOR_LOGS as string)
    if(chanel){
        //@ts-ignore
        chanel.send(embeda);  
    }
})


GallowsBotInterface.subscribe(GallowsBotInterface.EVENTS.PAY, (user, state, client) => {
    if(!client){
        return
    }

    const embeda = new MessageEmbed()
    .setColor("RED")
    .setTitle("[LOG] Перевод Золотишка")
    .setDescription(
      `**Пользователь: <@!${user.Discord_id}> \n перевёл пользователю <@!${state.lastPaymentReciver}> сумму  ${state.lastPaymantAmount}**`
    )
    const chanel = client.channels.cache.get(process.env.CHANEL_FOR_LOGS as string)
    if(chanel){
        //@ts-ignore
        chanel.send(embeda);  
    }
})