package pl.ttrpgassistant.backend.auth;

import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import java.io.BufferedReader;
import java.io.BufferedWriter;
import java.io.InputStreamReader;
import java.io.OutputStreamWriter;
import java.net.Socket;
import java.nio.charset.StandardCharsets;
import java.util.Base64;
import javax.net.ssl.SSLSocket;
import javax.net.ssl.SSLSocketFactory;

@Service
@Slf4j
public class PasswordResetMailService {

    @Value("${spring.mail.host:localhost}")
    private String mailHost;

    @Value("${spring.mail.port:1025}")
    private int mailPort;

    @Value("${spring.mail.username:}")
    private String mailUsername;

    @Value("${spring.mail.password:}")
    private String mailPassword;

    @Value("${spring.mail.properties.mail.smtp.auth:false}")
    private boolean smtpAuth;

    @Value("${spring.mail.properties.mail.smtp.starttls.enable:false}")
    private boolean smtpStartTls;

    @Value("${app.auth.mail-from:no-reply@ttrpg-assistant.local}")
    private String mailFrom;

    @Value("${app.auth.frontend-base-url:http://localhost:5173}")
    private String frontendBaseUrl;

    @Value("${app.auth.reset-token-ttl-minutes:60}")
    private long resetTokenTtlMinutes;

    public void sendResetToken(String recipientEmail, String resetToken) {
        String loginUrl = frontendBaseUrl.replaceAll("/+$", "") + "/login";
        String subject = "Reset hasla - TTRPG Assistant";
        String body = """
                Otrzymalismy prosbe o reset hasla do konta TTRPG Assistant.

                Aby ustawic nowe haslo:
                1. Otworz strone logowania: %s
                2. Kliknij "Nie pamietam hasla".
                3. Wklej ponizszy token w polu "Token resetu".

                Token resetu:
                %s

                Token jest wazny przez %d minut.
                Jesli to nie Ty prosiles o reset hasla, zignoruj te wiadomosc.
                """.formatted(loginUrl, resetToken, resetTokenTtlMinutes);

        try {
            sendSmtpMessage(recipientEmail, subject, body);
            log.info("Password reset email sent to {}", recipientEmail);
        } catch (Exception ex) {
            log.error("Could not send password reset email to {}", recipientEmail, ex);
        }
    }

    private void sendSmtpMessage(String recipientEmail, String subject, String body) throws Exception {
        try (Socket initialSocket = new Socket(mailHost, mailPort)) {
            Socket socket = initialSocket;
            BufferedReader reader = reader(socket);
            BufferedWriter writer = writer(socket);

            expect(reader, 220);
            command(writer, "EHLO ttrpg-assistant.local");
            expect(reader, 250);

            if (smtpStartTls) {
                command(writer, "STARTTLS");
                expect(reader, 220);

                SSLSocket sslSocket = (SSLSocket) ((SSLSocketFactory) SSLSocketFactory.getDefault())
                        .createSocket(socket, mailHost, mailPort, true);
                sslSocket.startHandshake();
                socket = sslSocket;
                reader = reader(socket);
                writer = writer(socket);

                command(writer, "EHLO ttrpg-assistant.local");
                expect(reader, 250);
            }

            if (smtpAuth && !mailUsername.isBlank()) {
                command(writer, "AUTH LOGIN");
                expect(reader, 334);
                command(writer, Base64.getEncoder().encodeToString(mailUsername.getBytes(StandardCharsets.UTF_8)));
                expect(reader, 334);
                command(writer, Base64.getEncoder().encodeToString(mailPassword.getBytes(StandardCharsets.UTF_8)));
                expect(reader, 235);
            }

            command(writer, "MAIL FROM:<" + mailFrom + ">");
            expect(reader, 250);
            command(writer, "RCPT TO:<" + recipientEmail + ">");
            expect(reader, 250);
            command(writer, "DATA");
            expect(reader, 354);

            writer.write("From: TTRPG Assistant <" + mailFrom + ">\r\n");
            writer.write("To: " + recipientEmail + "\r\n");
            writer.write("Subject: " + subject + "\r\n");
            writer.write("Content-Type: text/plain; charset=UTF-8\r\n");
            writer.write("\r\n");
            writer.write(escapeBody(body));
            writer.write("\r\n.\r\n");
            writer.flush();
            expect(reader, 250);

            command(writer, "QUIT");
        }
    }

    private BufferedReader reader(Socket socket) throws Exception {
        return new BufferedReader(new InputStreamReader(socket.getInputStream(), StandardCharsets.UTF_8));
    }

    private BufferedWriter writer(Socket socket) throws Exception {
        return new BufferedWriter(new OutputStreamWriter(socket.getOutputStream(), StandardCharsets.UTF_8));
    }

    private void command(BufferedWriter writer, String command) throws Exception {
        writer.write(command);
        writer.write("\r\n");
        writer.flush();
    }

    private void expect(BufferedReader reader, int expectedCode) throws Exception {
        String line = reader.readLine();
        if (line == null || line.length() < 3) {
            throw new IllegalStateException("SMTP server returned an empty response");
        }
        int code = Integer.parseInt(line.substring(0, 3));
        while (line.length() > 3 && line.charAt(3) == '-') {
            line = reader.readLine();
            if (line == null || line.length() < 3) break;
        }
        if (code != expectedCode) {
            throw new IllegalStateException("SMTP server returned " + code + ", expected " + expectedCode);
        }
    }

    private String escapeBody(String body) {
        return body.replace("\r\n", "\n")
                .replace("\r", "\n")
                .replace("\n.", "\n..")
                .replace("\n", "\r\n");
    }
}
