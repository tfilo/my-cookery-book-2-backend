import nodemailer from 'nodemailer';
import SMTPTransport from 'nodemailer/lib/smtp-transport';

const options: SMTPTransport.Options = {
    host: process.env.EMAIL_HOST,
    port: process.env.EMAIL_PORT ? parseInt(process.env.EMAIL_PORT) : 587,
    secure: process.env.EMAIL_SECURE === 'true'
};

if (process.env.EMAIL_USER && process.env.EMAIL_PASS) {
    options.auth = {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS
    };
}

const transporter = nodemailer.createTransport(options);

export const sendMail = async (
    to?: string,
    subject?: string,
    text?: string,
    html?: string
): Promise<SMTPTransport.SentMessageInfo | false> => {
    if (!to || !subject) {
        return false;
    }
    return transporter.sendMail({
        from: process.env.EMAIL_FROM,
        to: to,
        subject: subject,
        text,
        html
    });
};

export default transporter;
