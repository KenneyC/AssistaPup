import { Markup, BaseScene } from 'telegraf';

import connection from '../../utils/connections/database';
import { telegramErrorWrapper } from '../../utils/errors';
import { minutesTemplateFactory } from '../../utils/files/minutesTemplateFactory';
import { AgendaInformation } from './types';

export const generateMinutesTemplate = async (ctx) => {
	const agendaItems = (await connection.getAgendaItems() as any)[0];

	if (!agendaItems) {
		ctx.reply('Ruh Roh 😱! Seems like you tried to generate a document without starting an agenda collection, please start one by messaging me "/newagenda"');
		return;
	}

	const minutesTemplate: Buffer = await minutesTemplateFactory.createNewMinutesTemplate(agendaItems);
	await ctx.replyWithDocument({source: Buffer.from(minutesTemplate), filename: `Meeting_Minutes_${(new Date(agendaItems.dateTriggered)).toDateString().replace(/\s/g, "_")}.docx`});
	await connection.endAgendaCollection();
	delete ctx.session.newAgenda;
}

export const NEW_AGENDA_MEETING_TYPE = 'NEW_AGENDA_MEETING_TYPE';

export const NEW_AGENDA_DATE = 'NEW_AGENDA_DATE';

export const newAgendaMeetingType = new BaseScene(NEW_AGENDA_MEETING_TYPE);

newAgendaMeetingType.enter(async (ctx) => {
	const currentAgendaItems: AgendaInformation = (await connection.getAgendaItems() as any)[0];
	if (currentAgendaItems) {
		ctx.reply(`Uh oh! Seems like an agenda collection has already been triggered by ${currentAgendaItems.organizer} 😱. Please contact ${currentAgendaItems.organizer}!`)
		return ctx.scene.leave();
	}
	ctx.reply('Whoopee! A new agenda! Please enter the meeting type.')
})

newAgendaMeetingType.on('message', (ctx) => {
	if ((ctx as any).session.agendaSetUp.meetingType == "") {
		(ctx as any).session.agendaSetUp.meetingType = ctx.message.text;
		ctx.reply(`Awesome! Is ${ctx.message.text} correct?`, Markup.inlineKeyboard([
			Markup.callbackButton('Yep!', 'accept_meeting_type'),
			Markup.callbackButton('Nope!', 'reject_meeting_type'),
		]).extra())
	} else {
		ctx.reply(`Uh Oh! Seems like you've already entered ${(ctx as any).session.meetingType}. Please confirm that entry by pressing "Yep!" or "Nope!"`)
	}
})

newAgendaMeetingType.action('accept_meeting_type', (ctx: any) => {
	ctx.reply(`Roger that! The meeting type is set as ${ctx.session.agendaSetUp.meetingType}.\n\n Please enter the time of meeting.`);
	return ctx.scene.enter(NEW_AGENDA_DATE);
});

newAgendaMeetingType.action('reject_meeting_type', (ctx: any) => {
	ctx.reply(`Poof! Now its gone! Please enter another meeting type 😊`);
	ctx.session.agendaSetUp.meetingType = "";
})

export const newAgendaDate = new BaseScene(NEW_AGENDA_DATE);

newAgendaDate.on('message' ,(ctx) => {
	if ((ctx as any).session.agendaSetUp.meetingDate == "") {
		(ctx as any).session.agendaSetUp.meetingDate = ctx.message.text;
		ctx.reply(`Awesome! Is ${ctx.message.text} correct?`, Markup.inlineKeyboard([
			Markup.callbackButton('Yep!', 'accept_meeting_date'),
			Markup.callbackButton('Nope!', 'reject_meeting_date'),
		]).extra())
	} else {
		ctx.reply(`Uh Oh! Seems like you've already entered ${(ctx as any).session.meetingType}. Please confirm that entry by pressing "Yep!" or "Nope!"`)
	}
});

newAgendaDate.action('accept_meeting_date', async (ctx: any) => {
	ctx.reply(`Roger that! The meeting date is ${ctx.session.agendaSetUp.meetingDate}`);
	try {
		const currentChat = await ctx.getChat();
		const subscribedChatIds: any[] = await connection.getSubscribed();
		const currentDate = new Date();

		(ctx as any).session.newAgenda = {
			organizer: currentChat.first_name,
			id: `${currentChat.first_name}_${currentDate.toISOString()}`,
			triggerDate: currentDate,
			meetingDate: ctx.session.agendaSetUp.meetingDate,
			agendaList: {},
			meetingType: ctx.session.agendaSetUp.meetingType
		} as AgendaInformation;

		if( await connection.createNewAgenda((ctx as any).session.newAgenda)) {
			subscribedChatIds.forEach(({_id}: {_id: number}) => {
				ctx.telegram.sendMessage(_id,
					`Howdy! ${currentChat.first_name} is trying to collect agenda items ruff! Do you have any agenda items for the next meeting? Press "Yep!" if you do to start submitting your agenda items! If not, you can ignore this message 🦴'`,
					Markup.inlineKeyboard([
						Markup.callbackButton('Yep!', 'start_agenda_collection'),
					]).extra()).catch((err) => {
						telegramErrorWrapper(err, {id: _id});
					}
				);
			})
	
			ctx.telegram.sendMessage(currentChat.id,'All done!! Wait a while for people to submit their agenda items, and before the meetin, Please press the "📄" button to generate the document!',
				Markup.inlineKeyboard(
					[Markup.callbackButton('📄', 'generate_minutes_template')]
				).extra()
			)
		} else {
			ctx.reply('Uh oh! Seems like an agenda collection has already been triggered 😱')
		}
	} catch(err) {
		console.log(err);
	}
	delete ctx.session.agendaSetUp;
	return ctx.scene.leave();
});

newAgendaDate.action('reject_meeting_date', (ctx) => {
	(ctx as any).session.agendaSetUp.meetingDate = "";
	ctx.reply(`Okay! Please enter another date!`);
});
