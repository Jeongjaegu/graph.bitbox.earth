import { getDB } from "../index";

const DB = getDB();

//#region schemas
const BLOCK_SCHEMA = DB.Schema({
  height: Number,
});
//#endregion schemas

//#region models
const Block = DB.model('Block', BLOCK_SCHEMA);
//#endregion models

module.exports = {
  Block,
};
