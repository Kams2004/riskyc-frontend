"use client";

import { Client, IMessage, StompSubscription } from "@stomp/stompjs";
import { useEffect, useRef } from "react";
import { API_BASE_URL } from "./apiClient";
import { useAdminStore } from "./adminStore";
import { ChatMessage, AppNotification, Order } from "./types";

interface ConversationReadStatus {
  conversationId: string;
  customerReadAt: string | null;
  adminReadAt: string | null;
}

function wsUrl() {
  return API_BASE_URL.replace(/^http/, "ws") + "/ws";
}

type Listener = (frame: IMessage) => void;

let sharedClient: Client | null = null;
/** Every topic some mounted component wants, with its listeners — survives reconnects. */
const listeners = new Map<string, Set<Listener>>();
/** The live STOMP subscription per topic on the *current* connection; emptied whenever a new connection opens. */
const active = new Map<string, StompSubscription>();

function subscribeTopic(client: Client, topic: string) {
  if (!client.connected || active.has(topic)) return;
  active.set(
    topic,
    client.subscribe(topic, (frame) => listeners.get(topic)?.forEach((listener) => listener(frame)))
  );
}

/**
 * One shared STOMP connection for the whole app. The server only lets an admin's connection hear admin channels
 * (orders with customer phone/address, admin notifications), so the admin token goes in the CONNECT frame and the
 * connection is re-opened whenever someone logs in or out. Every wanted topic is (re)subscribed on each connect.
 */
function getClient(): Client {
  if (!sharedClient) {
    const client = new Client({
      brokerURL: wsUrl(),
      reconnectDelay: 3000,
      heartbeatIncoming: 10000,
      heartbeatOutgoing: 10000,
      beforeConnect: () => {
        const token = useAdminStore.getState().session?.token;
        client.connectHeaders = token ? { Authorization: `Bearer ${token}` } : {};
      },
      onConnect: () => {
        active.clear();
        listeners.forEach((_, topic) => subscribeTopic(client, topic));
      },
    });
    sharedClient = client;
    client.activate();

    let lastToken = useAdminStore.getState().session?.token;
    useAdminStore.subscribe((state) => {
      const token = state.session?.token;
      if (token === lastToken) return;
      lastToken = token;
      client.deactivate().then(() => client.activate());
    });
  }
  return sharedClient;
}

/** Listens to one topic for as long as the calling component is mounted; `null` listens to nothing. */
function useTopic(topic: string | null, onFrame: Listener) {
  const handlerRef = useRef(onFrame);
  handlerRef.current = onFrame;

  useEffect(() => {
    if (!topic) return;
    const client = getClient();
    const listener: Listener = (frame) => handlerRef.current(frame);
    if (!listeners.has(topic)) listeners.set(topic, new Set());
    listeners.get(topic)!.add(listener);
    subscribeTopic(client, topic);

    return () => {
      const set = listeners.get(topic);
      set?.delete(listener);
      if (set && set.size === 0) {
        listeners.delete(topic);
        const subscription = active.get(topic);
        active.delete(topic);
        if (subscription && client.connected) {
          try {
            subscription.unsubscribe();
          } catch {
            // The connection dropped between the check and the call — nothing left to unsubscribe from.
          }
        }
      }
    };
  }, [topic]);
}

/** New messages in one conversation (`/topic/conversations/{id}`) — pushed, no polling. */
export function useConversationSocket(conversationId: string | null | undefined, onMessage: (msg: ChatMessage) => void) {
  useTopic(conversationId ? `/topic/conversations/${conversationId}` : null, (frame) => onMessage(JSON.parse(frame.body)));
}

/**
 * `/topic/conversations/{id}/read` — fires whenever either side opens this thread, so the other side's tick marks
 * (1 sent / 2 read) update live instead of only on next reload.
 */
export function useConversationReadStatusSocket(
  conversationId: string | null | undefined,
  onUpdate: (status: ConversationReadStatus) => void
) {
  useTopic(conversationId ? `/topic/conversations/${conversationId}/read` : null, (frame) => onUpdate(JSON.parse(frame.body)));
}

/** Live admin notifications — platform staff get every one; a seller's admin only their own shop's channel. */
export function useAdminNotificationSocket(onNotification: (n: AppNotification) => void) {
  const session = useAdminStore((s) => s.session);
  const topic = !session
    ? null
    : session.enterpriseId
      ? `/topic/notifications/admin/enterprise/${session.enterpriseId}`
      : "/topic/notifications/admin";
  useTopic(topic, (frame) => onNotification(JSON.parse(frame.body)));
}

/**
 * Live order updates whenever anyone changes an order's status or packaging state, so "who's doing what" stays in
 * sync without a refresh. Platform staff hear every order; a seller's admin only their own shop's.
 */
export function useOrdersSocket(onOrderUpdate: (order: Order) => void) {
  const session = useAdminStore((s) => s.session);
  const topic = !session ? null : session.enterpriseId ? `/topic/orders/enterprise/${session.enterpriseId}` : "/topic/orders";
  useTopic(topic, (frame) => onOrderUpdate(JSON.parse(frame.body)));
}

/** Live `{ online: number }` presence count from `/topic/sessions`. */
export function useSessionSocket(onUpdate: (online: number) => void) {
  useTopic("/topic/sessions", (frame) => onUpdate(JSON.parse(frame.body).online));
}
