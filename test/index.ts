import { KlasaClient } from 'klasa';
import { GiveawayClient } from '../src';
import { config } from './config';

KlasaClient.use(GiveawayClient);
const client = new KlasaClient(config);

// eslint-disable-next-line @typescript-eslint/no-floating-promises
client.login('TOKEN GOES HERE');
