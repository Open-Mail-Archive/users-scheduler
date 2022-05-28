import {RabbitMqHelper} from '@open-mail-archive/rabbitmq-helper';
import {
  GenericPayload,
  DeletePayload,
  InsertPayload,
  RealtimeHelper,
} from '@open-mail-archive/realtime-helper';
import {
  UserChannel,
  UserPayload,
  UserQueue,
  UserQueueJobData,
} from '@open-mail-archive/types';
import {RealtimeSubscription} from '@supabase/realtime-js';

RealtimeHelper.client.connect();
await RabbitMqHelper.init();

const channel = RealtimeHelper.client.channel(
  UserChannel,
) as RealtimeSubscription;

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
    new UserQueueJobData(payload.type, {user: messagePayload}).toJson(),
  );
});

channel.subscribe();
