import { AlignmentType, Document, HeadingLevel, Packer, Paragraph } from "docx";
import { AgendaInformation } from '../../scenarios/new-agenda/types';

// TODO: Change to template populating
class MinutesTemplateFactory {
	
	createNewMinutesTemplate(agendaItems: AgendaInformation): Promise<Buffer> {
		const doc = new Document();

		const title: Paragraph[] = [
			new Paragraph({
				text: `VUUM ${agendaItems.meetingType} ${agendaItems.meetingType.toLowerCase().includes('meeting') ? "" : "meeting"}`,
				alignment: AlignmentType.CENTER,
				heading: HeadingLevel.HEADING_1
			}),
			new Paragraph({
				text: "Meeting minutes",
				alignment: AlignmentType.CENTER,
				heading: HeadingLevel.HEADING_2
			}),
			new Paragraph({
				text: `${agendaItems.meetingDate}`,
				alignment: AlignmentType.CENTER,
			}),
			new Paragraph({
				text: ""
			}),
			new Paragraph({
				text: ""
			}),
			new Paragraph({
				text: ""
			})
		]

		const meetingInformation: Paragraph[] = [
			new Paragraph({
				text: "Location: "
			}),
			new Paragraph({
				text: "Attendees: "
			}),
			new Paragraph({
				text: "Note taker: "
			}),
			new Paragraph({
				text: "Meeting minutes approval: "
			}),
			new Paragraph({
				text: "Starting time: "
			}),
			new Paragraph({
				text: "Meeting Adjourn time: "
			}),
			new Paragraph({
				text: ""
			}),
			new Paragraph({
				text: ""
			}),
			new Paragraph({
				text: ""
			})
		]

		const agenda: Paragraph[] = [
			new Paragraph({
				text: "Agenda",
				alignment: AlignmentType.CENTER,
				heading: HeadingLevel.HEADING_3
			})
		];

		Object.keys(agendaItems.agendaList).map((presentor: string) => {
			const items: Array<string> = agendaItems.agendaList[presentor];
			agenda.push(new Paragraph({
				text: `Presentor : ${presentor.replace("_", " ")}`
			}));
			items.forEach((agendaItem: string) => {
				agenda.push(new Paragraph({
					text: agendaItem,
					bullet: {
						level: 0
					}
				}))
			});
			agenda.push(new Paragraph({text: ""}),new Paragraph({text: "Action Items:"}));
			agenda.push(new Paragraph({text: ""}),new Paragraph({text: ""}));
		});

		doc.addSection({
			properties: {},
			children: [
				...title,
				...meetingInformation,
				...agenda
			]
		})

		return Packer.toBuffer(doc);
	}
}

export const minutesTemplateFactory = new MinutesTemplateFactory();

