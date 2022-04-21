import { asyncRunLuaImpl } from "lua-bundle.js";

const factory = new LuaFactory();
async function asyncRunLua(input, code) {
	return asyncRunLuaImpl(input, code);
};
