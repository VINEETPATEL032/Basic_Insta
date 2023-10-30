const nodemailer = require("nodemailer");
const googleapis = require("googleapis");

const REDIRECT_URI = `https://developers.google.com/oauthplayground`;
const CLIENT_ID = `1006382141438-dl7sq8nb8u83r00smffg869jpk4httd2.apps.googleusercontent.com`;
const CLIENT_SECRET = `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`;
const REFRESH_TOKEN =`1//04SE5eGmYNoTpCgYIARAAGAQSNwF-L9IrZ-owueO18q2ZsfJ9qFA73vIFmdSEwNcpDTN5lBFSsJGch2t2hrs6KbXPiFECTiULU58`;

const authClient = new googleapis.google.auth.OAuth2(CLIENT_ID, CLIENT_SECRET, REDIRECT_URI);
authClient.setCredentials({refresh_token: REFRESH_TOKEN});

async function mailer(receiver, id, key){
    try{
        const ACCESS_TOKEN = await authClient.getAccessToken();
        const transport = nodemailer.createTransport({
            service: "gmail",
            auth: {
                type: "OAuth2",
                user: "vineet2002patel@gmail.com",
                clientId: CLIENT_ID,
                clientSecret: CLIENT_SECRET,
                refreshToken: REFRESH_TOKEN,
                accessToken: ACCESS_TOKEN
            }
        })
        const details = {
            from: "vineet patel <vineet2002patel@gmail.com>",
            to: receiver,
            subject: "helllllllo hii....hii hellllllo",
            text: "message text",
            html: `hey you can recover your account by clicking following link <a href="http://localhost:3000/forgot/${id}/${key}">localhost:3000/forgot/${id}/${key}</a>`
        }
        const result = await transport.sendMail(details);
        return result;
    }
    catch(err){
        return err;
    }
}
module.exports = mailer;
