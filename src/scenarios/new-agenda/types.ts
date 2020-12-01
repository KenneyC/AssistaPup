export interface AgendaInformation {
	organizer: string,
	id: string,
	date: Date,
	agendas: Record<string, Array<string>>
};