import { Extra } from 'telegraf';
import { TelegrafContext } from 'telegraf/typings/context';

const subscribeMenu = Extra
  .markdown()
  .markup((m) => m.inlineKeyboard([
	  m.urlButton('🐶', 'http://t.me/AssistaPupBot')
  ]))


export const subscribeCommand = (ctx: TelegrafContext) => {
	ctx.reply(`@channel Hey everyone! ${ctx.message.author_signature} is asking for all of you to subscribe to me so that I can send you messages to assist him! If you haven't yet, please press the 🐶 button below and press start!`, subscribeMenu)
}