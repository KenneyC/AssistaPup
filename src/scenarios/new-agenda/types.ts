export interface AgendaInformation {
	organizer: string,
	id: string,
	triggerDate: Date,
	meetingDate: string,
	agendaList: Record<string, Array<string>>,
	meetingType: string,
};