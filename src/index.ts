import { MessageEmbed } from "discord.js";
import { GallowsBotInterface } from "./main";
import { HamsterCoinScema } from "./Scemas/scema";

GallowsBotInterface.start()

GallowsBotInterface.subscribe(GallowsBotInterface.EVENTS.WON, async (user, state, client) => {
    if(client){
        const DBUser = await HamsterCoinScema.findOne({id: user.Discord_id})
     
        const embeda = new MessageEmbed()
        .setColor("RED")
        .setTitle("[LOG] Окончание игры в Виселица победой")
        .setDescription(
          `**Пользователь: ${user.userName}\nЗакончил игру в виселица со выигрышем: ${DBUser.currentcoins}**`
        )
        //@ts-ignore
        client.channels.cache.get(process.env.CHANEL_FOR_LOGS).send(embeda);   
           
        await HamsterCoinScema.findOneAndUpdate(
            { id: user.Discord_id },
            {
              $inc: {
                balance: +DBUser.currentcoins,
                currentcoins: 0,
                winvic: +1,
              },
            },
            { new: true, upsert: true }
          );

          await HamsterCoinScema.findOneAndUpdate(
            { id: user.Discord_id },
            {
              $set: {
                currentcoins: 0,
              },
            },
            { new: true, upsert: true }
          );
    }    
})
GallowsBotInterface.subscribe(GallowsBotInterface.EVENTS.START, async (user, state, client) => {
    if(client && state.message){
        const commandWithArgs = state.message.split('/')
        const command = commandWithArgs.length > 1 ? commandWithArgs[1].split(' ')[0] : commandWithArgs      
        const args = commandWithArgs.length > 1 ? commandWithArgs[1].split(' ').filter((_1, i) => i !== 0) : []      
        
        const embeda = new MessageEmbed()
      .setColor("RED")
      .setTitle("[LOG] Старт игры в Виселица")
      .setDescription(
        `**Пользователь: ${user.userName}\nНачал игру в виселица со ставкой: ${args[0]}\n
        Количество букв в слове: ${state.word.chars.length}**
        Слово: ${state.word.text}`
      );
    //@ts-ignore
    client.channels.cache.get(process.env.CHANEL_FOR_LOGS).send(embeda);   
    }       
})
GallowsBotInterface.subscribe(GallowsBotInterface.EVENTS.LOSE, async (user, state, client) => {
    if(client){
        const DBUser = await HamsterCoinScema.findOne({id: user.Discord_id})
        const embeda = new MessageEmbed()
              .setColor("RED")
              .setTitle("[LOG] Окончание игры в Виселица поражением")
              .setDescription(
                `**Пользователь: ${user.userName}\nЗакончил игру в виселица и проиграл удвоенный выигрыш: ${DBUser.currentcoins}**`
              );

            //@ts-ignore
            client.channels.cache.get(process.env.CHANEL_FOR_LOGS).send(embeda);   
           
            await HamsterCoinScema.findOneAndUpdate(
              { id: user.Discord_id },
              {
                $inc: {
                  currentcoins: 0,
                  losevic: +1,
                },
              },
              { new: true, upsert: true }
            );

            await HamsterCoinScema.findOneAndUpdate(
              { id: user.Discord_id },
              {
                $set: {
                  currentcoins: 0,
                },
              },
              { new: true, upsert: true }
            );
    }
})