import { Telegraf, session, Stage } from 'telegraf';
import * as dotenv from 'dotenv';

import { newAgendaScene, askForAgendaScene, ASK_FOR_AGENDA_ID, generateMinutesTemplate } from './scenarios/new-agenda';
import { subscribeCommand } from './scenarios/ask-for-subs';
import connection from './utils/connections/database';

dotenv.config();

const bot = new Telegraf(process.env.BOT_TOKEN);

const stage = new Stage([askForAgendaScene]);

bot.start(async (ctx) => {
	const chat = await ctx.getChat();
	connection.subscribeUser(chat);
	ctx.reply(
		'Hello! My name is AssistaPup and I\'m here to help you with you with your VUUM agendas.'
		+ 'By starting a conversation with me, you have subscribed to notifications from me! \n\n'
		+ 'You can type:'
		+ '\n - /newagenda: I will help you create a new agenda document for your next document! Woofles!'
		+ '\n - /subscribe: I will subscribe you to messages and questions that will help your team mate with things like agenda items for the next meeting! Ruffles!'
	)
});
bot.use(session());
bot.use(stage.middleware());

bot.command('askforsubs', subscribeCommand );
bot.command('newagenda', newAgendaScene);

bot.action('start_agenda_collection', (ctx: any) => ctx.scene.enter(ASK_FOR_AGENDA_ID));
bot.action('generate_minutes_template', generateMinutesTemplate)

bot.launch(); // start
