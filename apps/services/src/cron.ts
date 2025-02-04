import cron from 'node-cron';
import { updateAllPrices } from './index';

cron.schedule('0 */6 * * *', updateAllPrices);
console.log('Cron job scheduled');