import { BaseScene, Markup } from 'telegraf';
import { Chat } from 'telegraf/typings/telegram-types';
import connection from '../../utils/connections/database';
import { AgendaInformation } from '../new-agenda/types';

export const ASK_FOR_AGENDA_ID = 'ASK_FOR_AGENDA';

export const askForAgendaScene = new BaseScene(ASK_FOR_AGENDA_ID);

askForAgendaScene.enter(async (ctx: any) => {
	const currentChat: Chat = await ctx.getChat();
	const currentAgendaItems: AgendaInformation = (await connection.getAgendaItems() as any)[0];
	if (!currentAgendaItems) {
		ctx.reply('Uh oh 😱. It seems like you tried to contribute to an agenda collection that has already ended. Please start a new agenda collection by messaging me "/newagenda".');
	}
	ctx.session.newAgenda.agendaList[currentChat.id] = {
		agendaItems: [],
		lastEnteredItem: ""
	}

	ctx.reply('Pawsome 🐾! Please enter your agenda items, send your items as separate messages one by one!');
})

askForAgendaScene.action('accept_agenda_item', async (ctx: any) => {
	const currentChat: Chat = await ctx.getChat();

	ctx.session.newAgenda.agendaList[currentChat.id].agendaItems.push(ctx.session.newAgenda.agendaList[currentChat.id].lastEnteredItem);

	let replyText = `Yay! I have entered "${ctx.session.newAgenda.agendaList[currentChat.id].lastEnteredItem}" as one of your agenda items. Your current items are: `;
	ctx.session.newAgenda.agendaList[currentChat.id].agendaItems.forEach((item: string) => {
		replyText = replyText.concat(`\n - ${item}`);
	})
	replyText = replyText.concat('\nKeep em coming! Or else you can click "I\'m done"')

	ctx.session.newAgenda.agendaList[currentChat.id].lastEnteredItem = "";
	ctx.reply(replyText,
	Markup.inlineKeyboard([
		Markup.callbackButton('I\'m done', 'end_agenda_collection')
	]).extra());
})

askForAgendaScene.action('reject_agenda_item', async (ctx: any) => {
	const currentChat: Chat = await ctx.getChat();
	
	let replyText = `Poof 💨! I have removed "${ctx.session.newAgenda.agendaList[currentChat.id].lastEnteredItem}", your current items are: \n`
	ctx.session.newAgenda.agendaList[currentChat.id].agendaItems.map((item: string) => {
		replyText = replyText.concat(`- ${item}\n`);
	})
	ctx.reply(replyText);

	ctx.session.newAgenda.agendaList[currentChat.id].lastEnteredItem = "";
	ctx.reply('Keep em coming! If you are done, feel free to click the "I\'m done" button',
	Markup.inlineKeyboard([
		Markup.callbackButton('I\'m done', 'end_agenda_collection')
	]).extra());
})

askForAgendaScene.action('end_agenda_collection', async (ctx: any) => {
	const currentChat: Chat = await ctx.getChat();
	connection.updateNewAgenda(
		`${currentChat.first_name}_${currentChat.last_name}`, 
		ctx.session.newAgenda.agendaList[currentChat.id].agendaItems
	)
	ctx.reply('Yay!! Thank you for entering your agenda items! Getcha self some Woofles 🧇');
	delete ctx.session.newAgenda.agendaList[currentChat.id];
	return ctx.scene.leave(ASK_FOR_AGENDA_ID);
})

askForAgendaScene.on('message', async (ctx: any) => {
	const currentChat: Chat = await ctx.getChat();
	if (ctx.session.newAgenda.agendaList[currentChat.id].lastEnteredItem !== "") {
		ctx.reply("Ruh Roh! It seems like you have entered an agenda item without confirming, please confirm that before entering a new one.")
		return;
	}
	ctx.session.newAgenda.agendaList[currentChat.id].lastEnteredItem = ctx.message.text;
	ctx.reply(`You have entered "${ctx.message.text}", is this correct?`, 
		Markup.inlineKeyboard([
			Markup.callbackButton('Yep!', 'accept_agenda_item'),
			Markup.callbackButton('Nope!', 'reject_agenda_item')
	]).extra())
})