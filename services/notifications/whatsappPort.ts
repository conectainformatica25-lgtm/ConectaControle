/**
 * Placeholder para integração futura com WhatsApp (lembretes de parcelas).
 * Implementar conforme docs/business-rules.md sem acoplar UI.
 */
export type ReminderPayload = {
  customerPhone: string;
  message: string;
};

export type WhatsAppPort = {
  sendReminder: (p: ReminderPayload) => Promise<void>;
};

export const noopWhatsApp: WhatsAppPort = {
  sendReminder: async () => {},
};
