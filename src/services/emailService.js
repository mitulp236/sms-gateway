import { Alert } from 'react-native';
import { BREVO_API_URL } from '../constants';
import { storageService } from './storage';

const emailTemplate = require('../email-template.json').template;

export const emailService = {
  async sendEmail(message, config) {
    try {
      let apiKey = config?.smtpPassword?.trim();
      let senderEmail = config?.smtpEmail?.trim();
      let targetEmail = config?.targetEmail?.trim();

      // Fallback to stored config if not provided
      if (!apiKey || !senderEmail || !targetEmail) {
        const storedConfig = await storageService.getConfig();
        if (storedConfig) {
          apiKey = apiKey || storedConfig.smtpPassword?.trim();
          senderEmail = senderEmail || storedConfig.smtpEmail;
          targetEmail = targetEmail || storedConfig.targetEmail;
        }
      }

      // Validate required fields
      if (!apiKey) {
        const msg = 'Brevo API key missing. Open app and save configuration.';
        console.warn('[emailService]', msg);
        Alert.alert('Email Error', msg);
        return false;
      }

      if (!senderEmail || !targetEmail) {
        const msg = 'Sender or target email missing in configuration.';
        console.warn('[emailService]', msg);
        Alert.alert('Email Error', msg);
        return false;
      }

      // Prepare email content
      const htmlContent = emailTemplate
        .replace('{{sender}}', message.sender)
        .replace('{{time}}', message.time)
        .replace('{{body}}', message.body);

      const payload = {
        sender: { name: 'SMS Gateway', email: senderEmail },
        to: [{ email: targetEmail, name: 'You' }],
        subject: `📱 SMS from ${message.sender}`,
        htmlContent,
        textContent: `From: ${message.sender}\nTime: ${message.time}\n\nMessage:\n${message.body}`,
      };

      const headers = {
        accept: 'application/json',
        'content-type': 'application/json',
        'api-key': apiKey,
      };

      const response = await fetch(BREVO_API_URL, {
        method: 'POST',
        headers,
        body: JSON.stringify(payload),
      });

      const rawText = await response.text();
      let parsed;
      try {
        parsed = JSON.parse(rawText);
      } catch (e) {
        parsed = { raw: rawText };
      }

      console.log('[emailService] status:', response.status, 'ok:', response.ok, 'body:', parsed);

      if (response.ok) {
        return true;
      } else {
        const brevoMsg = (parsed && (parsed.message || parsed.error || parsed.raw)) || `HTTP ${response.status}`;
        console.warn('Brevo rejected send:', brevoMsg);

        const hint = /auth|authentication|api[-_ ]?key/i.test(String(brevoMsg))
          ? 'Authentication error — check your Brevo API key in app settings.'
          : null;

        Alert.alert('Email Delivery Error', `${brevoMsg}${hint ? '\n\nHint: ' + hint : ''}`);
        return false;
      }
    } catch (error) {
      console.error('[emailService] Error:', error);
      Alert.alert('Email Error', `Failed to send: ${error.message || error}`);
      return false;
    }
  },
};
