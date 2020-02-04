import { Command, CommandStore, KlasaMessage, KlasaClient } from 'klasa';
import { GiveawayClient } from '../..';

export default class extends Command {

	public constructor(client: KlasaClient, store: CommandStore, file: string[], directory: string) {
		super(client, store, file, directory, {
			permissionLevel: 5,
			runIn: ['text'],
			usageDelim: ' ',
			usage: '[message:message]',
			description: lang => lang.get('COMMAND_REROLL_DESCRIPTION')
		});
	}

	public async run(msg: KlasaMessage, [message]: [KlasaMessage | null]): Promise<KlasaMessage | KlasaMessage[] | null> {
		if (!message) {
			message = await msg.channel.messages
				.fetch(msg.guildSettings.get('giveaways.finished') as string) as KlasaMessage;
		}

		const winners = await (this.client as GiveawayClient).giveawayManager.reroll(message);

		return msg.send(`🎉 **New winner(s) are**: ${winners.map(w => w.toString()).join(', ')}`);
	}

}