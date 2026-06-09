import type { NotificationType } from "../enums/notificationEnums";

export interface InternalNotification {
  notificationId: string;
  recipientProfileId: string;
  actorProfileId?: string;
  notificationType: NotificationType;
  relatedPostId?: string;
  relatedRequestId?: string;
  relatedInvitationId?: string;
  title: string;
  body: string;
  readAt?: string;
  createdAt: string;
}
