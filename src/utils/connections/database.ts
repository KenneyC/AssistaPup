import { Db, MongoClient } from 'mongodb';
import * as dotenv from 'dotenv';
import { Chat } from 'telegraf/typings/telegram-types';
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

	async createNewAgenda(agendaId: string): Promise<void> {
		await this.database.collection('agendas').insertOne({_id: agendaId, agendaItems: {}});
	}

	async updateNewAgenda(agendaId: string, contributor: string, agendaItems: string[]): Promise<void> {
		await this.database.collection('agendas').updateOne({_id: agendaId }, {$set: {[`agendaItems.${contributor}`]: agendaItems}});
	}

	async getAgendaItems(agendaId: string): Promise<Array<any>> {
		return this.database.collection('agendas').findOne({_id: agendaId});
	}
}

const connection = new MongoConnection();

connection.connect();

export default connection;
