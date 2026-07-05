/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

// This file contains the Firebase Cloud Function code as requested.
// To deploy: 
// 1. Initialize Firebase Functions in your project: `firebase init functions`
// 2. Copy this code into `functions/index.js`
// 3. Set environment variables: `firebase functions:config:set email.user="your@email.com" email.pass="yourpassword"`
// 4. Deploy: `firebase deploy --only functions`

const functions = require('firebase-functions');
const admin = require('firebase-admin');
const nodemailer = require('nodemailer');

// Initialize Admin SDK
if (admin.apps.length === 0) {
  admin.initializeApp();
}

/**
 * Trigger: When a document in 'visitor_logs' is updated.
 * Logic: If status transitions from 'Expected' to 'Checked In', notify the host.
 */
exports.onVisitorArrival = functions.firestore
  .document('visitor_logs/{logId}')
  .onUpdate(async (change, context) => {
    const newValue = change.after.data();
    const previousValue = change.before.data();

    // Condition: Transition from 'Expected' to 'Checked In'
    if (previousValue.status === 'Expected' && newValue.status === 'Checked In') {
      const { guestName, hostName, hostEmail } = newValue;

      console.log(`[SECURITY_ALERT] Arrival detected: Guest=${guestName}, Host=${hostName}, Email=${hostEmail}`);

      try {
        // --- 1. EMAIL NOTIFICATION ---
        // Accessing config via functions.config()
        const emailUser = functions.config().email?.user;
        const emailPass = functions.config().email?.pass;

        if (emailUser && emailPass) {
          const transporter = nodemailer.createTransport({
            service: 'gmail',
            auth: {
              user: emailUser,
              pass: emailPass
            }
          });

          const mailOptions = {
            from: '"Security Nexus" <noreply@security-nexus.com>',
            to: hostEmail,
            subject: '🚨 Secure Alert: Visitor Arrival',
            text: `Secure Alert: Your guest ${guestName} has arrived at the reception and is waiting for you.`,
            html: `
              <div style="font-family: sans-serif; padding: 20px; border: 1px solid #eee; border-radius: 10px;">
                <h2 style="color: #2563eb;">Guest Arrival Notification</h2>
                <p><strong>Secure Alert:</strong> Your guest <strong>${guestName}</strong> has arrived at the reception and is waiting for you.</p>
                <hr style="border: 0; border-top: 1px solid #eee; margin: 20px 0;">
                <p style="font-size: 12px; color: #666;">This is an automated security protocol from CORE_ADMIN.</p>
              </div>
            `
          };

          await transporter.sendMail(mailOptions);
          console.log(`[MAIL_SUCCESS] Notification dispatched to ${hostEmail}`);
        } else {
          console.warn('[MAIL_SKIPPED] Nodemailer credentials not configured in firebase functions:config');
        }

        // --- 2. MOCK TEAMS/SLACK WEBHOOK ---
        const MOCK_WEBHOOK_URL = 'https://outlook.office.com/webhook/MOCK_GUID/IncomingWebhook/MOCK_ID';
        console.log(`[WEBHOOK_TRIGGER] Notifying Mock Webhook: ${MOCK_WEBHOOK_URL}`);
        
        // Simulating webhook payload assembly
        const payload = {
          "@type": "MessageCard",
          "@context": "http://schema.org/extensions",
          "themeColor": "0076D7",
          "summary": "Guest Arrival Alert",
          "sections": [{
            "activityTitle": `Secure Alert: Arrival Detected`,
            "activitySubtitle": `Guest: ${guestName}`,
            "facts": [
              { "name": "Host", "value": hostName },
              { "name": "Status", "value": "Checked In" },
              { "name": "Location", "value": "Primary Reception" }
            ],
            "markdown": true
          }]
        };
        
        console.log('[WEBHOOK_SUCCESS] Teams/Slack notification data ready for transmission.');
        console.log(`[PROTOCOL_COMPLETE] Operations for LogID ${context.params.logId} finalized.`);

      } catch (error) {
        console.error(`[CRITICAL_FAILURE] Failed to process arrival notifications for ${guestName}:`, error);
        throw new functions.https.HttpsError('internal', 'Notification protocols failed.');
      }
    }

    return null;
  });
