/* eslint-disable @typescript-eslint/no-unsafe-assignment */
import Pusher from "pusher";

import { env } from "@help-desk/env/server";

export const pusher = new Pusher({
  appId: env.PUSHER_APP_ID,
  key: env.NEXT_PUBLIC_PUSHER_KEY,
  secret: env.PUSHER_SECRET,
  cluster: env.NEXT_PUBLIC_PUSHER_CLUSTER,
  useTLS: true,
});
