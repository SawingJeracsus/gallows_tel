const { Schema, model } = require("mongoose");

const HamsterCoin = new Schema(
  {
    id: String,
    balance: Number,
    currentcoins: Number,
    guild_id: String,
    winvic: Number,
    losevic: Number,
  },
  { versionkey: false }
);

export const HamsterCoinScema = model("HamsterCoin", HamsterCoin);
