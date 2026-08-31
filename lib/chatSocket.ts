"use client";

import { Client, IMessage } from "@stomp/stompjs";
import { useEffect, useRef } from "react";
import { API_BASE_URL } from "./apiClient";
import { ChatMessage, AppNotification, Order } from "./types";

interface ConversationReadStatus {
  conversationId: string;
  customerReadAt: string | null;
  adminReadAt: string | null;
}

function wsUrl() {
  return API_BASE_URL.replace(/^http/, "ws") + "/ws";
}

let sharedClient: Client | null = null;

/** One shared STOMP connection for the whole app — subscriptions are cheap to add/remove on top of it. */
function getClient(): Client {
  if (!sharedClient) {
    sharedClient = new Client({
      brokerURL: wsUrl(),
      reconnectDelay: 3000,
      heartbeatIncoming: 10000,
      heartbeatOutgoing: 10000,
    });
    sharedClient.activate();
  }
  return sharedClient;
}

/**
 * Subscribes to real-time messages for one conversation
 * (`/topic/conversations/{id}`) — mirrors the `useMessageSocket` hook
 * pattern: connect once, receive pushed messages, no polling.
 */
export function useConversationSocket(conversationId: string | null | undefined, onMessage: (msg: ChatMessage) => void) {
  const handlerRef = useRef(onMessage);
  handlerRef.current = onMessage;

  useEffect(() => {
    if (!conversationId) return;
    const client = getClient();
    let subscription: { unsubscribe: () => void } | null = null;
    let cancelled = false;

    const subscribe = () => {
      if (cancelled) return;
      subscription = client.subscribe(`/topic/conversations/${conversationId}`, (frame: IMessage) => {
        handlerRef.current(JSON.parse(frame.body));
      });
    };

    if (client.connected) {
      subscribe();
    } else {
      client.onConnect = subscribe;
    }

    return () => {
      cancelled = true;
      subscription?.unsubscribe();
    };
  }, [conversationId]);
}

/**
 * Subscribes to `/topic/conversations/{id}/read` — fires whenever either
 * side opens this thread, so the other side's tick marks (1 sent / 2 read)
 * update live instead of only on next reload.
 */
export function useConversationReadStatusSocket(
  conversationId: string | null | undefined,
  onUpdate: (status: ConversationReadStatus) => void
) {
  const handlerRef = useRef(onUpdate);
  handlerRef.current = onUpdate;

  useEffect(() => {
    if (!conversationId) return;
    const client = getClient();
    let subscription: { unsubscribe: () => void } | null = null;
    let cancelled = false;

    const subscribe = () => {
      if (cancelled) return;
      subscription = client.subscribe(`/topic/conversations/${conversationId}/read`, (frame: IMessage) => {
        handlerRef.current(JSON.parse(frame.body));
      });
    };

    if (client.connected) {
      subscribe();
    } else {
      client.onConnect = subscribe;
    }

    return () => {
      cancelled = true;
      subscription?.unsubscribe();
    };
  }, [conversationId]);
}

/** Subscribes to `/topic/notifications/admin` — every connected admin session gets these live. */
export function useAdminNotificationSocket(onNotification: (n: AppNotification) => void) {
  const handlerRef = useRef(onNotification);
  handlerRef.current = onNotification;

  useEffect(() => {
    const client = getClient();
    let subscription: { unsubscribe: () => void } | null = null;
    let cancelled = false;

    const subscribe = () => {
      if (cancelled) return;
      subscription = client.subscribe("/topic/notifications/admin", (frame: IMessage) => {
        handlerRef.current(JSON.parse(frame.body));
      });
    };

    if (client.connected) {
      subscribe();
    } else {
      client.onConnect = subscribe;
    }

    return () => {
      cancelled = true;
      subscription?.unsubscribe();
    };
  }, [onNotification]);
}

/**
 * Subscribes to `/topic/orders` — every connected admin session gets the
 * updated order live whenever anyone changes its status or packaging state,
 * so "who's doing what" stays in sync without a manual refresh.
 */
export function useOrdersSocket(onOrderUpdate: (order: Order) => void) {
  const handlerRef = useRef(onOrderUpdate);
  handlerRef.current = onOrderUpdate;

  useEffect(() => {
    const client = getClient();
    let subscription: { unsubscribe: () => void } | null = null;
    let cancelled = false;

    const subscribe = () => {
      if (cancelled) return;
      subscription = client.subscribe("/topic/orders", (frame: IMessage) => {
        handlerRef.current(JSON.parse(frame.body));
      });
    };

    if (client.connected) {
      subscribe();
    } else {
      client.onConnect = subscribe;
    }

    return () => {
      cancelled = true;
      subscription?.unsubscribe();
    };
  }, [onOrderUpdate]);
}

/** Live `{ online: number }` presence count from `/topic/sessions`. */
export function useSessionSocket(onUpdate: (online: number) => void) {
  const handlerRef = useRef(onUpdate);
  handlerRef.current = onUpdate;

  useEffect(() => {
    const client = getClient();
    let subscription: { unsubscribe: () => void } | null = null;
    let cancelled = false;

    const subscribe = () => {
      if (cancelled) return;
      subscription = client.subscribe("/topic/sessions", (frame: IMessage) => {
        handlerRef.current(JSON.parse(frame.body).online);
      });
    };

    if (client.connected) {
      subscribe();
    } else {
      client.onConnect = subscribe;
    }

    return () => {
      cancelled = true;
      subscription?.unsubscribe();
    };
  }, [onUpdate]);
}
