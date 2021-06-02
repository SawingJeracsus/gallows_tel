import { GallowsBotInterface } from "./main";

GallowsBotInterface.start()

GallowsBotInterface.subscribe(GallowsBotInterface.EVENTS.WON, (user, state) => {
    console.log(user, state);
})

GallowsBotInterface.subscribe(GallowsBotInterface.EVENTS.START, (user, state) => {
    console.log(`${user.userName} started game with word ${state.word.word}`)
})