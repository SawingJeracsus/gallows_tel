import { GallowsBotInterface } from "./main";

GallowsBotInterface.start()

GallowsBotInterface.subscribe(GallowsBotInterface.EVENTS.LOSE, (user, state) => {
    console.log('lose');
})