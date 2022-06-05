import 'dotenv/config';
import {JobData, RabbitMqHelper} from '@open-mail-archive/rabbitmq-helper';
import {
  GenericPayload,
  DeletePayload,
  InsertPayload,
  RealtimeHelper,
} from '@open-mail-archive/realtime-helper';
import {UserChannel, UserPayload, UserQueue} from '@open-mail-archive/types';
import {RealtimeSubscription} from '@supabase/realtime-js';
import {Logger} from '@open-mail-archive/logger';

Logger.Instance.info({
  trace: 'UsersScheduler',
  message: 'Initializing helpers.',
});
RealtimeHelper.client.connect();
await RabbitMqHelper.init();
Logger.Instance.info({
  trace: 'UsersScheduler',
  message: 'Helpers initialized.',
});

Logger.Instance.info({
  trace: 'UsersScheduler',
  message: 'Creating the realtime subscription channel.',
});
const channel = RealtimeHelper.client.channel(
  UserChannel,
) as RealtimeSubscription;
Logger.Instance.debug({
  trace: 'UsersScheduler',
  message: 'Realtime channel created.',
  data: channel,
});

Logger.Instance.info({
  trace: 'UsersScheduler',
  message: 'Attaching hooks to channel.',
});
channel.on('*', async (payload: GenericPayload) => {
  let messagePayload: UserPayload;

  switch (payload.type) {
    case 'INSERT':
      messagePayload = (payload as InsertPayload<UserPayload>).record;
      break;
    case 'DELETE':
      messagePayload = (payload as DeletePayload<UserPayload>).old_record;
      break;
    case 'UPDATE':
      // nothing to do here
      return;
  }

  await RabbitMqHelper.send(
    UserQueue,
    new JobData<UserPayload>(payload.type, messagePayload).toJson(),
  );
});
Logger.Instance.info({
  trace: 'UsersScheduler',
  message: 'Hooks attached',
});

Logger.Instance.info({
  trace: 'UsersScheduler',
  message: 'Subscribing for events...',
});
channel.subscribe();
