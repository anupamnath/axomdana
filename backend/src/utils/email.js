const nodemailer = require('nodemailer');
const db = require('../config/database');

let transporter = null;

const getTransporter = async () => {
    if (transporter) return transporter;

    try {
        const result = await db.query("SELECT value FROM settings WHERE key = 'smtp_config'");
        if (result.rows.length === 0) {
            console.warn('SMTP not configured. Email sending disabled.');
            return null;
        }

        const config = JSON.parse(result.rows[0].value);

        if (!config.host || !config.port || !config.user || !config.pass) {
            console.warn('SMTP configuration incomplete. Email sending disabled.');
            return null;
        }

        transporter = nodemailer.createTransport({
            host: config.host,
            port: parseInt(config.port),
            secure: parseInt(config.port) === 465,
            auth: {
                user: config.user,
                pass: config.pass,
            },
        });

        return transporter;
    } catch (err) {
        console.error('Failed to create email transporter:', err.message);
        return null;
    }
};

const sendEmail = async ({ to, subject, html, text }) => {
    try {
        const transport = await getTransporter();
        if (!transport) {
            console.warn('Email not sent: SMTP not configured.');
            return { success: false, error: 'SMTP not configured' };
        }

        // Get from address from settings
        const fromResult = await db.query("SELECT value FROM settings WHERE key = 'smtp_from_email'");
        const fromEmail = fromResult.rows.length > 0
            ? fromResult.rows[0].value
            : 'noreply@axomdana.in';

        const info = await transport.sendMail({
            from: `"Axom Dana LLC" <${fromEmail}>`,
            to,
            subject,
            html,
            text,
        });

        console.log(`Email sent to ${to}: ${info.messageId}`);
        return { success: true, messageId: info.messageId };
    } catch (err) {
        console.error('Failed to send email:', err.message);
        return { success: false, error: err.message };
    }
};

const sendOrderConfirmation = async (order, userEmail, userName) => {
    const subject = `Order Confirmed - #${order.id} | Axom Dana LLC`;
    const html = `
        <div style="font-family: 'Inter', Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 2rem; background-color: #ffffff; border-radius: 12px;">
            <div style="text-align: center; margin-bottom: 2rem;">
                <div style="width: 56px; height: 56px; background-color: #1a8a3f; border-radius: 16px; display: flex; align-items: center; justify-content: center; margin: 0 auto 1rem; font-size: 1.75rem;">🌿</div>
                <h1 style="font-size: 1.5rem; font-weight: 700; color: #1d1d1f; margin: 0 0 0.25rem;">Order Confirmed!</h1>
                <p style="color: #6e6e73; font-size: 0.9375rem; margin: 0;">Thank you for your order, ${userName}!</p>
            </div>

            <div style="background-color: #f5f5f7; border-radius: 12px; padding: 1.5rem; margin-bottom: 1.5rem;">
                <h2 style="font-size: 1rem; font-weight: 600; color: #1d1d1f; margin: 0 0 1rem;">Order Summary</h2>
                <table style="width: 100%; border-collapse: collapse; font-size: 0.875rem;">
                    <tr>
                        <td style="padding: 0.5rem 0; color: #6e6e73;">Order #</td>
                        <td style="padding: 0.5rem 0; text-align: right; font-weight: 600;">${order.id}</td>
                    </tr>
                    <tr>
                        <td style="padding: 0.5rem 0; color: #6e6e73;">Status</td>
                        <td style="padding: 0.5rem 0; text-align: right; font-weight: 600; text-transform: capitalize;">${order.status}</td>
                    </tr>
                    <tr>
                        <td style="padding: 0.5rem 0; color: #6e6e73;">Total</td>
                        <td style="padding: 0.5rem 0; text-align: right; font-weight: 700; font-size: 1.125rem; color: #1a8a3f;">₹${parseFloat(order.total).toLocaleString('en-IN', { minimumFractionDigits: 2 })}</td>
                    </tr>
                    <tr>
                        <td style="padding: 0.5rem 0; color: #6e6e73;">Shipping Address</td>
                        <td style="padding: 0.5rem 0; text-align: right; font-weight: 500;">${order.shipping_address}</td>
                    </tr>
                </table>
            </div>

            <div style="text-align: center; padding-top: 1.5rem; border-top: 1px solid #e8e8ed;">
                <p style="font-size: 0.8125rem; color: #6e6e73; margin: 0;">
                    Axom Dana LLC — Beharbari, Guwahati, Assam, India<br/>
                    <a href="mailto:support@axomdana.in" style="color: #1a8a3f; text-decoration: none;">support@axomdana.in</a>
                </p>
            </div>
        </div>
    `;

    return sendEmail({ to: userEmail, subject, html });
};

const sendOrderStatusUpdate = async (order, userEmail, userName) => {
    const subject = `Order #${order.id} Status Updated - ${order.status} | Axom Dana LLC`;
    const statusEmojis = {
        pending: '⏳',
        confirmed: '✅',
        processing: '⚙️',
        shipped: '🚚',
        delivered: '📦',
        cancelled: '❌',
    };
    const emoji = statusEmojis[order.status] || '📋';

    const html = `
        <div style="font-family: 'Inter', Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 2rem; background-color: #ffffff; border-radius: 12px;">
            <div style="text-align: center; margin-bottom: 2rem;">
                <div style="font-size: 3rem; margin-bottom: 1rem;">${emoji}</div>
                <h1 style="font-size: 1.5rem; font-weight: 700; color: #1d1d1f; margin: 0 0 0.25rem;">Order Status Updated</h1>
                <p style="color: #6e6e73; font-size: 0.9375rem; margin: 0;">Hi ${userName}, your order #${order.id} has been updated.</p>
            </div>

            <div style="background-color: #f5f5f7; border-radius: 12px; padding: 1.5rem; margin-bottom: 1.5rem; text-align: center;">
                <p style="font-size: 0.875rem; color: #6e6e73; margin: 0 0 0.5rem;">Current Status</p>
                <p style="font-size: 1.5rem; font-weight: 700; color: #1d1d1f; margin: 0; text-transform: capitalize;">${emoji} ${order.status}</p>
            </div>

            <div style="text-align: center; padding-top: 1.5rem; border-top: 1px solid #e8e8ed;">
                <p style="font-size: 0.8125rem; color: #6e6e73; margin: 0;">
                    Axom Dana LLC — Beharbari, Guwahati, Assam, India<br/>
                    <a href="mailto:support@axomdana.in" style="color: #1a8a3f; text-decoration: none;">support@axomdana.in</a>
                </p>
            </div>
        </div>
    `;

    return sendEmail({ to: userEmail, subject, html });
};

module.exports = { sendEmail, sendOrderConfirmation, sendOrderStatusUpdate };
