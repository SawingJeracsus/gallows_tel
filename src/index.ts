import { GallowsBotInterface } from "./main";

GallowsBotInterface.start()

GallowsBotInterface.subscribe(GallowsBotInterface.EVENTS.WON, (user, state) => {
    console.log(user, state);
})