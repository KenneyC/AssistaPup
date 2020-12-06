import { Db, MongoClient } from 'mongodb';
import * as dotenv from 'dotenv';
import { Chat } from 'telegraf/typings/telegram-types';
import { AgendaInformation } from '../../scenarios/new-agenda/types';
dotenv.config();

class MongoConnection {
	public instance: MongoConnection;
	public database: Db;

	async connect() {
		
		const connection = await MongoClient.connect(process.env.MONGO_URI, {useNewUrlParser: true, useUnifiedTopology: true});

		this.database = connection.db('bot');

		console.log('Database connected');

		this.instance = this;
	}

	async getUserSubscriptionDetails(firstName: string): Promise<any> {
		return await this.database.collection('subscription').findOne({_id: firstName});
	}

	async getSubscribed(): Promise<Array<any>> {
		return await this.database.collection('subscription').find({}).toArray();
	}

	async subscribeUser(chatInfo: Chat): Promise<void> {
		await this.database.collection('subscription').updateOne(
			{ _id: chatInfo.id },
			{ $set: { username: chatInfo.username, firstName: chatInfo.first_name}},
			{ upsert: true }
		)
		console.log(`Subscribed user: ${chatInfo.username}, chatId: ${chatInfo.id}`);
		return;
	}

	async removeSubscription(chatId: string): Promise<void> {
		await this.database.collection('subscription').deleteOne({"_id": chatId});
	}

	async createNewAgenda(agendaInformation: AgendaInformation): Promise<boolean> {
		const existingAgenda = await this.database.collection('agendas').find(
			{ active: true },
			{ sort: { dateTriggered: -1 } },
		).toArray();

		if (!existingAgenda[0]) {
			await this.database.collection('agendas').insertOne({
				_id: agendaInformation.id,
				dateTriggered: agendaInformation.triggerDate.toISOString(),
				meetingType: agendaInformation.meetingType,
				meetingDate: agendaInformation.meetingDate,
				active: true,
				organizer: agendaInformation.organizer,
				agendaList: {}
			});
			return true;
		} else {
			return false;
		}
	}

	async updateNewAgenda(contributor: string, agendaList: string[]): Promise<void> {
		await this.database.collection('agendas').findOneAndUpdate(
			{ active: true },
			{ $set: {[`agendaList.${contributor}`]: agendaList} },
			{ sort: { dateTriggered: -1 } },
		);
	}

	async getAgendaItems(): Promise<Array<any>> {
		return await this.database.collection('agendas').find(
			{ active: true },
			{ sort: { dateTriggered: -1 } }
		).limit(1).toArray();
	}

	async endAgendaCollection(): Promise<void> {
		await this.database.collection('agendas').findOneAndUpdate(
			{ active: true },
			{ $set: { active: false }},
			{ sort: { dateTriggered: -1 } }
		)
	}
}

const connection = new MongoConnection();

connection.connect();

export default connection;
