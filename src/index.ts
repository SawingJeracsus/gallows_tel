import { GallowsBotInterface } from "./main";

GallowsBotInterface.start()

GallowsBotInterface.subscribe(GallowsBotInterface.EVENTS.MESSAGE, (user, state) => {
    console.log(user, state, GallowsBotInterface.EVENTS.MESSAGE);
})
GallowsBotInterface.subscribe(GallowsBotInterface.EVENTS.CHANEL_CREATED, (user, state) => {
    console.log(user, state, GallowsBotInterface.EVENTS.CHANEL_CREATED);
})
GallowsBotInterface.subscribe(GallowsBotInterface.EVENTS.GUESS, (user, state) => {
    console.log(user, state, GallowsBotInterface.EVENTS.GUESS);
})
GallowsBotInterface.subscribe(GallowsBotInterface.EVENTS.START, (user, state) => {
    console.log(user, state, GallowsBotInterface.EVENTS.START);
})
GallowsBotInterface.subscribe(GallowsBotInterface.EVENTS.WON, (user, state) => {
    console.log(user, state, GallowsBotInterface.EVENTS.WON);
})
GallowsBotInterface.subscribe(GallowsBotInterface.EVENTS.CHANEL_DELETED, (user, state) => {
    console.log(user, state, GallowsBotInterface.EVENTS.CHANEL_DELETED);
})