import { KlasaClient, KlasaMessage } from "klasa";
import { TextChannel, User, Message } from "discord.js";
import GiveawayEmbed from "./GiveawayEmbed";
import Util from "../util/util";
import { Second, Minute } from "../util/constants";

interface GiveawayFinishData {
	title?: string;
	wCount?: number;
	reroll?: boolean
}

interface GiveawayCreateData {
	message: Message;
	time: number;
	wCount: number;
	title: string;
}

export interface GiveawayUpdateData {
	channel: string;
	message: string;
	wCount: number;
	title: string;
	endAt: number;
}

export default class GiveawayManager {
	public client: KlasaClient;

	constructor(client: KlasaClient) {
		this.client = client;
	}

	public async finish(msg: KlasaMessage, { reroll, title, wCount }: GiveawayFinishData) {
		const winners: User[] = [];

		if (!title || !wCount) {
			title = msg.embeds[0].title;
			wCount = parseInt(msg.embeds[0]?.fields[0]?.value) || 1;
		}
		
		if (!reroll) {
			await msg.guildSettings.update('giveaways.finished', msg.id)
			await msg.guildSettings.update('giveaways.running', msg.id, { arrayAction: 'remove' });
		}

		if(msg.reactions.get('🎉')!.count < 2) {
			const embed2 = new GiveawayEmbed(msg)
				.setTitle(title)
				.setLocaleDescription('not_enough_reactions')
				.setTimestamp()
				.addField(msg.language.get('winner_count'), wCount);
			return msg.edit(embed2);
		}
		else {
			const users = await msg.reactions.get('🎉')!.users.fetch();
			const list = users.filter(u => u.id !== this.client.user!.id).array();
			for (let i = 0; i < wCount; i++) {
				const x = this.draw(list);
				if (!winners.includes(x)) winners.push(x);
			}
			const winner =  winners.filter(u => u !== undefined && u !== null).map(u => u.toString()).join(', ');
			const embed3 = new GiveawayEmbed(msg)
				.setTitle(title)
				.setDescription(`**Winner: ${winner}**`)
				.setTimestamp()
				.addField(msg.language.get('winner_count'), wCount);
	
			msg.edit(embed3);
			return msg.channel.send(msg.language.get('giveaway_won', winner, title));
		}
	}

	public shuffle(arr: any[]): any[] {
		for (let i = arr.length; i; i--) {
			const j = Math.floor(Math.random() * i);
			[arr[i - 1], arr[j]] = [arr[j], arr[i - 1]];
		}
		return arr;
	}

	public draw(list: any[]): any {
		const shuffled = this.shuffle(list);
		return shuffled[Math.floor(Math.random() * shuffled.length)];
	}

	public async validate(msg: string, chan: string): Promise<KlasaMessage | undefined> {
		const channel = await this.client.channels.fetch(chan) as TextChannel;
		const mess = await channel.messages.fetch(msg);

		return mess as KlasaMessage;
	}

	public async update({ message, channel, endAt, title, wCount }: GiveawayUpdateData) {
		const msg = await this.validate(message, channel);
		if(!msg) return;

		if (endAt <= Date.now()) return this.finish(msg, { title, wCount });

		return msg.edit(new GiveawayEmbed(msg)
		.setTitle(title)
		.setLocaleDescription('giveaway_description', wCount, Util.ms(endAt - Date.now())))
		.then(() => this.create({
			message: msg,
			title,
			wCount,
			time: endAt
		}));
	}

	public create({ message, title, wCount, time }: GiveawayCreateData) {
		return this.client.schedule.create('giveaway', this.nextRefresh(time - Date.now()), {
			data: {
				channel: message.channel.id,
				message: message.id,
				endAt: time,
				title,
				wCount
			},

			catchUp: true
		});
	}

	private nextRefresh(remaining: number) {
		if (remaining < 5 * Second) return Date.now() + Second;
		if (remaining < 30 * Second) return Date.now() + Math.min(remaining - (6 * Second ), 5 * Second);
		if (remaining < 2 * Minute) return Date.now() + (15 * Second);
		if (remaining < 5 * Minute) return Date.now() + (20 * Second);
		
		if (remaining < 15 * Minute) return Date.now() + Minute;
		if (remaining < 30 * Minute) return Date.now() + (2 * Minute);
		return Date.now() + (5 * Minute);
	}
};