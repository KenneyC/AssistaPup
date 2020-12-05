import { Telegraf, session, Stage } from 'telegraf';
import * as dotenv from 'dotenv';
import express from 'express';

import { newAgendaMeetingType, newAgendaDate, generateMinutesTemplate, NEW_AGENDA_MEETING_TYPE } from './scenarios/new-agenda';
import { askForAgendaScene, ASK_FOR_AGENDA_ID, } from './scenarios/ask-for-agenda';
import { subscribeCommand } from './scenarios/ask-for-subs';
import connection from './utils/connections/database';

dotenv.config();
const app = express();

const PORT = process.env.PORT || 8080;
const URL = process.env.HOST_URL; 
const ENV = process.env.ENVIRONMENT;

const bot = new Telegraf(process.env.BOT_TOKEN);

if (ENV === "PROD") {
	bot.telegram.setWebhook(`${URL}/bot${process.env.BOT_TOKEN}`)
	app.use(bot.webhookCallback(`/bot${process.env.BOT_TOKEN}`));
}

const stage = new Stage([newAgendaMeetingType, newAgendaDate, askForAgendaScene]);

bot.start(async (ctx) => {
	const chat = await ctx.getChat();
	connection.subscribeUser(chat);
	ctx.reply(
		'Hello! My name is AssistaPup and I\'m here to help you with you with your VUUM endeavours. '
		+ 'By starting a conversation with me, you have subscribed to notifications from me! \n\n'
		+ 'You can type:'
		+ '\n - /newagenda: I will help you create a new agenda document for your next document! Woofles!'
		+ '\n - /askforsubs (for groups): I will ask the group to subscribe to me by providing a link to chat to me. '
		+ '\n - /addtocurrentagenda: If you have subscribed late and an agenda collection has already started, but you'
		+ ' haven\'t recieved the collection message, I will help you submit your agenda to the next meeting. '
	)
});
bot.use(session());
bot.use(stage.middleware());

bot.command('askforsubs', subscribeCommand );
bot.command('newagenda', (ctx: any) => {
	(ctx as any).session.agendaSetUp = {
		meetingType: "",
		meetingDate: "",
	}
	return ctx.scene.enter(NEW_AGENDA_MEETING_TYPE)
});

bot.action('start_agenda_collection', (ctx: any) => ctx.scene.enter(ASK_FOR_AGENDA_ID));
bot.action('generate_minutes_template', generateMinutesTemplate)

bot.launch(); // start

app.get('/', (_req, res) => {
	res.send('Hello! Please start messaging the bot on telegram :)');
});

app.listen(PORT, () => {
	console.log(`Server running on port ${PORT}`);
});
