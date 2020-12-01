import { Markup, BaseScene } from 'telegraf';
import { TelegrafContext } from 'telegraf/typings/context';
import { Chat } from 'telegraf/typings/telegram-types';

import connection from '../../utils/connections/database';
import { minutesTemplateFactory } from '../../utils/files/minutesTemplateFactory';
import { AgendaInformation } from './types';
import { telegramErrorWrapper } from '../../utils/errors';

export const ASK_FOR_AGENDA_ID = 'ASK_FOR_AGENDA';

const currentAgendaInformation: AgendaInformation = {
	organizer: "",
	id: "",
	date: undefined,
	agendas: {}
};

export const generateMinutesTemplate = async (ctx) => {
	const agendaItems = (await connection.getAgendaItems(currentAgendaInformation.id) as any).agendaItems;
	const minutesTemplate: Buffer = await minutesTemplateFactory.createNewAgenda(agendaItems, currentAgendaInformation);
	await ctx.replyWithDocument({source: Buffer.from(minutesTemplate), filename: `Meeting_Minutes_${currentAgendaInformation.date.toDateString().replace(/\s/g, "_")}.docx`})
	currentAgendaInformation.organizer = "";
	currentAgendaInformation.id = "";
	currentAgendaInformation.date = undefined;
	currentAgendaInformation.agendas = {};
}

export const newAgendaScene = async (ctx: TelegrafContext) => {
	if (currentAgendaInformation.organizer !== "") {
		ctx.reply(`Oh no! ${currentAgendaInformation.organizer} has already started collecting a new agenda 👻 Please contact him for more information`);	
		return;
	}
	ctx.reply('New agenda aye? Thats Pawsome! I\'ll send every subscribed user a notifcation!');

	try {
		const currentChat = await ctx.getChat();
		const subscribedChatIds: any[] = await connection.getSubscribed()
		currentAgendaInformation.organizer = currentChat.first_name;
		currentAgendaInformation.date = new Date();
		currentAgendaInformation.id = `${currentAgendaInformation.organizer}_${currentAgendaInformation.date.toISOString()}`;

		await connection.createNewAgenda(currentAgendaInformation.id);

		subscribedChatIds.forEach(({_id, username}: {_id: string, username: string}) => {
			ctx.telegram.sendMessage(_id,
				`Howdy ${username}! ${currentChat.first_name} is trying to collect agenda items ruff! Do you have any agenda items for the next meeting?'`,
				Markup.inlineKeyboard([
					Markup.callbackButton('Yep!', 'start_agenda_collection'),
					Markup.callbackButton('Nope!', 'stop_agenda_collection')
				]).extra()).catch((err) => {
					telegramErrorWrapper(err, {id: _id});
				});
		})

		ctx.telegram.sendMessage(currentChat.id,'All done!! Wait a while for people to submit their agenda items, and before the meetin, Please press the "📄" button to generate the document!',
			Markup.inlineKeyboard(
				[Markup.callbackButton('📄', 'generate_minutes_template')]
			).extra()
		)
	} catch(err) {
		console.log(err);
	}
};

export const askForAgendaScene = new BaseScene(ASK_FOR_AGENDA_ID);

askForAgendaScene.enter((ctx) => {
	ctx.reply('Pawsome 🐾! Please enter your agenda items, send your items as separate messages!');
})

askForAgendaScene.action('end_agenda_collection', async (ctx: any) => {
	const currentChat: Chat = await ctx.getChat();
	connection.updateNewAgenda(
		currentAgendaInformation.id, 
		`${currentChat.first_name}_${currentChat.last_name}`, 
		currentAgendaInformation.agendas[`${currentChat.first_name}_${currentChat.last_name}`]
	)
	ctx.reply('Yay!! Thank you for entering your agenda items! Getcha self some Woofles 🧇');
	return ctx.scene.leave(ASK_FOR_AGENDA_ID);
})

askForAgendaScene.on('message', async (ctx) => {
	const currentChat: Chat = await ctx.getChat();
	currentAgendaInformation.agendas[`${currentChat.first_name}_${currentChat.last_name}`] ?
		currentAgendaInformation.agendas[`${currentChat.first_name}_${currentChat.last_name}`].push(ctx.message?.text) 
		:
		currentAgendaInformation.agendas[`${currentChat.first_name}_${currentChat.last_name}`] = [ctx.message?.text];
	ctx.reply( `Yay! I have entered "${ctx.message.text}" as one of your agenda items. Keep em coming! Or else you can click "I'm done"`,
	Markup.inlineKeyboard([
		Markup.callbackButton('I\'m done', 'end_agenda_collection')
	]).extra());
})
