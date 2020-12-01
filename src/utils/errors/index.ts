import connection from '../connections/database';

export const telegramErrorWrapper = (error: any, information: Record<string, any>) => {
	switch (error.code) {
		case 400:
			switch (error.description) {
				case 'Bad Request: chat not found':
					console.log("Chat not found, deleting current char Id: ", information.id);
					connection.removeSubscription(information.id);
					break;
			}
		break;
	}
}