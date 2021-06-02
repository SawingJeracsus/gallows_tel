"use strict";
const hamstercoin = require("./Schema");
const { MessageEmbed } = require("discord.js");

var __assign =
  (this && this.__assign) ||
  function () {
    __assign =
      Object.assign ||
      function (t) {
        for (var s, i = 1, n = arguments.length; i < n; i++) {
          s = arguments[i];
          for (var p in s)
            if (Object.prototype.hasOwnProperty.call(s, p)) t[p] = s[p];
        }
        return t;
      };
    return __assign.apply(this, arguments);
  };
var __spreadArray =
  (this && this.__spreadArray) ||
  function (to, from) {
    for (var i = 0, il = from.length, j = to.length; i < il; i++, j++)
      to[j] = from[i];
    return to;
  };
var __importDefault =
  (this && this.__importDefault) ||
  function (mod) {
    return mod && mod.__esModule ? mod : { default: mod };
  };
Object.defineProperty(exports, "__esModule", { value: true });
exports.GallowsBotInterface = void 0;
var discord_js_1 = __importDefault(require("discord.js"));
var dotenv_1 = __importDefault(require("dotenv"));
var fs_1 = __importDefault(require("fs"));
var path_1 = __importDefault(require("path"));
var animation_1 = require("./animation");
var dictionary_1 = __importDefault(require("./dictionary"));
var game_1 = require("./game");

dotenv_1.default.config();
if (!process.env.BOT_TOKEN) {
  console.error("Discord token is not defined!");
  process.exit();
}
var Dumb = /** @class */ (function () {
  function Dumb() {}
  Dumb.prototype.getDumb = function () {
    try {
      //@ts-ignore
      return JSON.parse(fs_1.default.readFileSync(Dumb.path).toString("utf-8"));
    } catch (error) {
      this.setDumb([]);
      return [];
    }
  };
  Dumb.prototype.setDumb = function (newDumb) {
    try {
      fs_1.default.writeFileSync(Dumb.path, JSON.stringify(newDumb));
      return true;
    } catch (error) {
      return false;
    }
  };
  Dumb.path = path_1.default.join(__dirname, "../", "dumb.json");
  return Dumb;
})();
var DiscordUser = /** @class */ (function () {
  function DiscordUser(Discord_id, userName) {
    this.Discord_id = Discord_id;
    this.userName = userName;
    this.state = {
      isGameGoing: false,
      word: new game_1.Word("", []),
      lifes: 7,
    };
  }
  return DiscordUser;
})();
var UseresColection = /** @class */ (function () {
  function UseresColection(users, DumbManager) {
    this.users = users;
    this.DumbManager = DumbManager;
  }
  UseresColection.prototype.push = function (user) {
    this.users.push(user);
    this.DumbManager.setDumb(this.users);
  };
  UseresColection.prototype.softPush = function (newUser) {
    var isUserNew =
      this.users.filter(function (user) {
        return user.Discord_id === newUser.Discord_id;
      }).length === 0;
    if (isUserNew) {
      this.push(newUser);
    }
    return isUserNew;
  };
  UseresColection.prototype.setState = function (tel_id, callback) {
    this.users.map(function (user) {
      if (user.Discord_id === tel_id) {
        user.state = callback(user.state);
      }
      return user;
    });
    this.DumbManager.setDumb(this.users);
  };
  UseresColection.prototype.getState = function (tel_id) {
    return (
      this.users.filter(function (user) {
        return user.Discord_id === tel_id;
      })[0].state || false
    );
  };
  return UseresColection;
})();
var EVENTS;
(function (EVENTS) {
  EVENTS["START"] = "START";
  EVENTS["GUESS"] = "GUESS";
  EVENTS["CHANEL_CREATED"] = "CHANEL_CREATED";
  EVENTS["CHANEL_DELETED"] = "CHANEL_DELETED";
  EVENTS["MESSAGE"] = "MESSAGE";
  EVENTS["WON"] = "WON";
  EVENTS["LOSE"] = "LOSE";
})(EVENTS || (EVENTS = {}));
var GallowsBotInterface = /** @class */ (function () {
  function GallowsBotInterface() {}
  GallowsBotInterface.subscribe = function (event, callback) {
    //@ts-ignore
    this.subcribers[event] = this.subcribers[event]
      ? __spreadArray(__spreadArray([], this.subcribers[event]), [callback])
      : [callback];
  };
  GallowsBotInterface.dispatch = function (event, user, state) {
    if (this.subcribers[event]) {
      this.subcribers[event].forEach(function (callback) {
        callback(user, state);
      });
    }
  };
  GallowsBotInterface.start = function () {
    var dumb = new Dumb();
    var UsersManager = new UseresColection(dumb.getDumb(), dumb);
    var client = new discord_js_1.default.Client();
    var GameEngine = new game_1.Game();
    client.on("ready", function () {
      var _a;
      console.log(
        "Logged in as " +
          ((_a = client.user) === null || _a === void 0 ? void 0 : _a.tag)
      );
    });
    client.on("message", async function (msg) {
      let user = await hamstercoin.findById(msg.author.id);
      var _a;
      //@ts-ignore
      if (msg.author.id === client.user.id && client) return;
      var CurrentUser = new DiscordUser(msg.author.id, msg.author.username);
      var isNewUser = UsersManager.softPush(CurrentUser);
      var CurrentState = UsersManager.getState(msg.author.id) || {};
      GallowsBotInterface.dispatch(
        GallowsBotInterface.EVENTS.MESSAGE,
        CurrentUser,
        CurrentState
      );
      var commandWithArgs = msg.content.split("/");
      var command =
        commandWithArgs.length > 1
          ? commandWithArgs[1].split(" ")[0]
          : commandWithArgs;
      var args =
        commandWithArgs.length > 1
          ? commandWithArgs[1].split(" ").filter(function (_1, i) {
              return i !== 0;
            })
          : [];
      if (!command) {
        // if()
        return;
      }
      var guessLogic = async function (guess) {
        if (!CurrentState.isGameGoing) {
          return;
        }
        GallowsBotInterface.dispatch(
          GallowsBotInterface.EVENTS.GUESS,
          CurrentUser,
          CurrentState
        );
        try {
          var word_1 = GameEngine.openLetter(
            game_1.Word.from(CurrentState.word),
            guess
          );
          UsersManager.setState(msg.author.id, function (prev) {
            return __assign(__assign({}, prev), {
              word: word_1,
              isGameGoing: !word_1.isOppened,
              ///   lifes: CurrentState.lifes + 1 > 7 ? 7 : CurrentState.lifes + 1,
            });
          });
          if (word_1.isOppened) {
            GallowsBotInterface.dispatch(
              GallowsBotInterface.EVENTS.WON,
              CurrentUser,
              CurrentState
            );
            msg.reply("Вы угадали слово это: - " + word_1.text);
            await hamstercoin.findByIdAndUpdate(
              msg.author.id,
              {
                $inc: {
                  balance: user.currentdice * 2,
                  currentdice: -user.currentdice,
                },
              },
              { new: true, upsert: true }
            );
            setTimeout(function () {
              var _a, _b;
              (_b =
                (_a = msg.guild) === null || _a === void 0
                  ? void 0
                  : _a.channels.cache.get(CurrentState.chanelID)) === null ||
              _b === void 0
                ? void 0
                : _b.delete();
              GallowsBotInterface.dispatch(
                GallowsBotInterface.EVENTS.CHANEL_DELETED,
                CurrentUser,
                CurrentState
              );
            }, 2000);
            return;
          }
          msg.reply(word_1.text);
        } catch (error) {
          if (CurrentState.lifes > 1) {
            UsersManager.setState(CurrentUser.Discord_id, function (prev) {
              return __assign(__assign({}, prev), {
                lifes: CurrentState.lifes - 1,
              });
            });
            msg.reply(
              "\n" +
                animation_1.animation[CurrentState.lifes - 1] +
                "\n\u042D\u0442\u043E\u0439 \u0431\u0443\u043A\u0432\u044B \u043D\u0435\u0442\u0443. \u041E\u0441\u0442\u0430\u043B\u043E\u0441\u044C \u0436\u0438\u0437\u043D\u0435\u0439! - " +
                (CurrentState.lifes - 1)
            );
          } else {
            GallowsBotInterface.dispatch(
              GallowsBotInterface.EVENTS.LOSE,
              CurrentUser,
              CurrentState
            );
            msg.reply(
              'Вы проиграли! Это было слово! "' + CurrentState.word.word + '"'
            );
            UsersManager.setState(msg.author.id, function (prev) {
              return __assign(__assign({}, prev), { isGameGoing: false });
            });
            setTimeout(function () {
              var _a, _b;
              (_b =
                (_a = msg.guild) === null || _a === void 0
                  ? void 0
                  : _a.channels.cache.get(CurrentState.chanelID)) === null ||
              _b === void 0
                ? void 0
                : _b.delete();
              GallowsBotInterface.dispatch(
                GallowsBotInterface.EVENTS.CHANEL_DELETED,
                CurrentUser,
                CurrentState
              );
            }, 2000);
          }
        }
      };
      if (msg.channel.id === CurrentState.chanelID) {
        guessLogic(msg.content);
        return;
      }
      switch (command) {
        case "start":
          if (args[0] < 1) {
            msg.reply("Укажите значение больше 0");
            return;
          }

          if (
            await hamstercoin.findOne({
              balance: user.balance < args[0],
              currentdice: 0,
            })
          ) {
            msg.reply("Недостаточно средств!");
            return;
          }

          if (!args[0]) {
            msg.reply("Укажите сумму для начала");
            return;
          }

          msg.delete();
          //   await hamstercoin.findByIdAndUpdate(
          //     msg.author.id,
          //     {
          //       $inc: {
          //         currentdice: args[0],
          //       },
          //     },
          //     { new: true, upsert: true }
          //   );
          if (CurrentState.isGameGoing === false) {
            var newWord_1 = GameEngine.createWord(
              dictionary_1.default.getWord()
            );
            UsersManager.setState(msg.author.id, function (prev) {
              return __assign(__assign({}, prev), {
                word: newWord_1,
                isGameGoing: true,
                lifes: 7,
              });
            });
            (_a = msg.guild) === null || _a === void 0
              ? void 0
              : _a.channels
                  .create(
                    "\u0418\u0433\u0440\u0430 \u0432\u0438\u0441\u0435\u043B\u0438\u0446\u0430 [" +
                      CurrentUser.userName +
                      "]",
                    {
                      type: "text",
                      permissionOverwrites: [
                        {
                          id: msg.guild.roles.everyone,
                          deny: [
                            "VIEW_CHANNEL",
                            "SEND_MESSAGES",
                            "READ_MESSAGE_HISTORY",
                          ],
                        },
                        {
                          id: msg.author.id,
                          allow: [
                            "VIEW_CHANNEL",
                            "SEND_MESSAGES",
                            "READ_MESSAGE_HISTORY",
                          ],
                        },
                      ],
                    }
                  )
                  .then(function (Chanel) {
                    GallowsBotInterface.dispatch(
                      GallowsBotInterface.EVENTS.CHANEL_CREATED,
                      CurrentUser,
                      CurrentState
                    );
                    Chanel.send("Игра будет происходить в этом канале!");
                    Chanel.send("Длина слова - " + newWord_1.chars.length);
                    Chanel.send(
                      new MessageEmbed()
                        .setColor("#E74C3C")
                        .setTitle("**Информация по игре**")
                        .setDescription(
                          "**1. Продолжительность игры: 180 секунд, не успели ввести правильный ответ - вы проиграли\n2. Находясь в данном канале, любое сообщение, написанное вами будет восприниматься, как ответ на вопрос\n3. Вводить ответ нужно СТРОГО 1 буквой русского языка с МАЛЕНЬКОЙ буквы.**"
                        )
                    ); //rules here
                    UsersManager.setState(msg.author.id, function (prev) {
                      return __assign(__assign({}, prev), {
                        chanelID: Chanel.id,
                      });
                    });
                    GallowsBotInterface.dispatch(
                      GallowsBotInterface.EVENTS.START,
                      CurrentUser,
                      UsersManager.getState(CurrentUser.Discord_id)
                    );
                  });
          } else {
            msg.reply("Вы уже запустили игру!"); //
          }
          break;
        //  case "g":
        //    guessLogic(args[0]);
        //    break;
      }
    });
    client.login(process.env.BOT_TOKEN);
  };
  GallowsBotInterface.subcribers = {};
  GallowsBotInterface.EVENTS = EVENTS;
  return GallowsBotInterface;
})();
exports.GallowsBotInterface = GallowsBotInterface;
