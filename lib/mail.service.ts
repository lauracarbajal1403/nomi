import _ from 'lodash';
import nodemailer from 'nodemailer';
import { Attachment } from 'nodemailer/lib/mailer';

const emailRegex =
  /(?:[a-z0-9!#$%&'*+/=?^_`{|}~-]+(?:\.[a-z0-9!#$%&'*+/=?^_`{|}~-]+)*|"(?:[\x01-\x08\x0b\x0c\x0e-\x1f\x21\x23-\x5b\x5d-\x7f]|\\[\x01-\x09\x0b\x0c\x0e-\x7f])*")@(?:(?:[a-z0-9](?:[a-z0-9-]*[a-z0-9])?\.)+[a-z0-9](?:[a-z0-9-]*[a-z0-9])?|\[(?:(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.){3}(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?|[a-z0-9-]*[a-z0-9]:(?:[\x01-\x08\x0b\x0c\x0e-\x1f\x21-\x5a\x53-\x7f]|\\[\x01-\x09\x0b\x0c\x0e-\x7f])+)\])/;

export interface SentMessageInfo {
  accepted: string[];
  rejected: string[];
  envelopeTime: number;
  messageTime: number;
  messageSize: number;
  response: string;
  envelope: {
    from: string;
    to: string[];
  };
  messageId: string;
}

export interface SendMailOptions {
  to: string | string[];
  subject: string;
  html: string;
  attachments?: Attachment[];
  replyTo?: string;
  from?: string;
}

export class MailService {
  private static transporter: nodemailer.Transporter | null = null;
  private instanceTransporter: nodemailer.Transporter | null = null;

  private static async GetInstance() {
    if (!this.transporter) {
      if (!process.env.SMTP_USER || !(process.env.SMTP_PASSWORD || process.env.SMTP_PASS)) {
        console.warn('MailService: SMTP credentials not configured.');
      }

      this.transporter = nodemailer.createTransport({
        host: process.env.SMTP_HOST || 'smtp.gmail.com',
        port: parseInt(process.env.SMTP_PORT || '587'),
        secure: process.env.SMTP_SECURE === 'true',
        auth: {
          user: process.env.SMTP_USER,
          pass: process.env.SMTP_PASSWORD || process.env.SMTP_PASS,
        },
      });
    }

    return this.transporter;
  }

  private async getInstanceTransporter() {
    if (!this.instanceTransporter) {
      if (!process.env.SMTP_USER || !(process.env.SMTP_PASSWORD || process.env.SMTP_PASS)) {
        console.warn('MailService instance: SMTP credentials not configured.');
      }

      this.instanceTransporter = nodemailer.createTransport({
        host: process.env.SMTP_HOST || 'smtp.gmail.com',
        port: parseInt(process.env.SMTP_PORT || '587'),
        secure: process.env.SMTP_SECURE === 'true',
        auth: {
          user: process.env.SMTP_USER,
          pass: process.env.SMTP_PASSWORD || process.env.SMTP_PASS,
        },
      });
    }

    return this.instanceTransporter;
  }

  static async SendMail(content: SendMailOptions): Promise<SentMessageInfo> {
    const transporter = await this.GetInstance();

    const recipients = Array.isArray(content.to) ? content.to : [content.to];

    const mailOptions: any = {
      from: content.from || process.env.DELIVERY_EMAIL || process.env.SMTP_FROM || process.env.SMTP_USER,
      to: _.uniq(recipients)
        .filter((x) => x)
        .filter((x) => emailRegex.test(x.toLowerCase()))
        .join(', '),
      subject: content.subject || 'Notificación',
      html: content.html,
      attachments: content.attachments || [],
    };

    if (content.replyTo && emailRegex.test(content.replyTo.toLowerCase())) {
      mailOptions.replyTo = content.replyTo;
    } else if (!content.replyTo && process.env.SMTP_USER) {
      mailOptions.replyTo = process.env.SMTP_USER;
    }

    return transporter.sendMail(mailOptions);
  }

  static FormatHTMLWithVariables(html: string, variables: Record<string, string>) {
    return Object.keys(variables).reduce((acc, key) => {
      return acc.replace(new RegExp(`{{\\.${key}}}`, 'g'), variables[key] ?? '');
    }, html);
  }

  async sendMail(content: SendMailOptions): Promise<SentMessageInfo> {
    const transporter = await this.getInstanceTransporter();

    const recipients = Array.isArray(content.to) ? content.to : [content.to];

    const mailOptions: any = {
      from: content.from || process.env.DELIVERY_EMAIL || process.env.SMTP_FROM || process.env.SMTP_USER,
      to: _.uniq(recipients)
        .filter((x) => x)
        .filter((x) => emailRegex.test(x.toLowerCase()))
        .join(', '),
      subject: content.subject || 'Notificación',
      html: content.html,
      attachments: content.attachments || [],
    };

    if (content.replyTo && emailRegex.test(content.replyTo.toLowerCase())) {
      mailOptions.replyTo = content.replyTo;
    } else if (!content.replyTo && process.env.SMTP_USER) {
      mailOptions.replyTo = process.env.SMTP_USER;
    }

    return transporter.sendMail(mailOptions);
  }

  async verifyConnection(): Promise<boolean> {
    try {
      const transporter = await this.getInstanceTransporter();
      await transporter.verify();
      return true;
    } catch (error) {
      console.error('MailService verification failed:', error);
      return false;
    }
  }

  static async VerifyConnection(): Promise<boolean> {
    try {
      const transporter = await this.GetInstance();
      await transporter.verify();
      return true;
    } catch (error) {
      console.error('MailService static verification failed:', error);
      return false;
    }
  }
}

let mailServiceInstance: MailService | null = null;

export function getMailService(): MailService {
  if (!mailServiceInstance) {
    mailServiceInstance = new MailService();
  }
  return mailServiceInstance;
}