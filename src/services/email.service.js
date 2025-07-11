import nodemailer from 'nodemailer';
import dotenv from 'dotenv';
dotenv.config({ path: './.env' });

const transporter = nodemailer.createTransport({
    host: process.env.EMAIL_HOST,
    port: 465,
    secure: true, 
    auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
    },
});

const sendRegistrationEmail = async (to, name, password) => {
    const subject = "Welcome to Klab Program Manager!";
    const htmlBody = `
        <h1>Hi ${name},</h1>
        <p>Welcome to the Klab Program Manager platform! An account has been created for you.</p>
        <p>You can log in using the following credentials:</p>
        <ul>
            <li><strong>Email:</strong> ${to}</li>
            <li><strong>Password:</strong> ${password}</li>
        </ul>
        <p>It is highly recommended that you change your password after your first login.</p>
        <p>Best regards,<br>The Klab Team</p>
    `;

    const mailOptions = {
        from: `"Klab Program Manager" <${process.env.EMAIL_USER}>`,
        to: to,
        subject: subject,
        html: htmlBody,
    };

    try {
        const info = await transporter.sendMail(mailOptions);
        console.log(`Registration email sent to ${to}: ${info.messageId}`);
    } catch (error) {
        console.error(`Error sending email to ${to}:`, error);
       
    }
};

export { sendRegistrationEmail };