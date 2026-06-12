package com.itv.service;

import com.itv.dto.InvitationResponse;
import com.itv.dto.InviteResponse;
import com.itv.model.Invitation;
import com.itv.model.WhiteboardSession;
import com.itv.repository.InvitationRepository;
import com.itv.repository.SessionRepository;
import jakarta.mail.internet.MimeMessage;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.mail.javamail.MimeMessageHelper;
import org.springframework.stereotype.Service;

import java.util.UUID;

@Service
public class InvitationService {

    private static final Logger log = LoggerFactory.getLogger(InvitationService.class);

    private final InvitationRepository invitationRepository;
    private final SessionRepository sessionRepository;
    private final JavaMailSender mailSender;

    @Value("${app.frontend-url}")
    private String frontendUrl;

    @Value("${app.mail.from}")
    private String mailFrom;

    public InvitationService(
            InvitationRepository invitationRepository,
            SessionRepository sessionRepository,
            JavaMailSender mailSender) {
        this.invitationRepository = invitationRepository;
        this.sessionRepository = sessionRepository;
        this.mailSender = mailSender;
    }

    public InviteResponse sendInvitation(UUID sessionId, String email) {
        if (email == null || email.isBlank()) {
            throw new RuntimeException("Email address is required");
        }

        WhiteboardSession session = sessionRepository.findById(sessionId)
            .orElseThrow(() -> new RuntimeException("Session not found"));

        String token = UUID.randomUUID().toString();
        Invitation invitation = new Invitation(sessionId, email.trim(), token);
        invitationRepository.save(invitation);

        String joinUrl = frontendUrl + "/join?token=" + token;

        InviteResponse response = new InviteResponse();
        response.setJoinUrl(joinUrl);

        if (mailFrom == null || mailFrom.isBlank()) {
            response.setEmailSent(false);
            response.setMessage(
                "Invitation saved. Email is not configured — copy the join link below. " +
                "Set Gmail credentials in application-local.properties."
            );
            return response;
        }

        try {
            sendInviteEmail(email.trim(), session.getName(), joinUrl, sessionId.toString());
            response.setEmailSent(true);
            response.setMessage("Invitation email sent to " + email.trim());
        } catch (Exception ex) {
            log.warn("Failed to send invitation email to {}: {}", email, ex.getMessage());
            response.setEmailSent(false);
            response.setMessage(
                "Invitation saved but email could not be sent: " + ex.getMessage() +
                ". Copy the join link below and share it manually."
            );
        }

        return response;
    }

    private void sendInviteEmail(String to, String sessionName, String joinUrl, String sessionId)
            throws Exception {
        MimeMessage mimeMessage = mailSender.createMimeMessage();
        MimeMessageHelper helper = new MimeMessageHelper(mimeMessage, true, "UTF-8");
        helper.setFrom(mailFrom);
        helper.setTo(to);
        helper.setSubject("You're invited to a Whiteboard session");

        String plainText =
            "You've been invited to join \"" + sessionName + "\".\n\n" +
            "Click here to join: " + joinUrl + "\n\n" +
            "Session ID: " + sessionId;

        String htmlText =
            "<div style=\"font-family:Segoe UI,sans-serif;max-width:520px\">" +
            "<h2 style=\"color:#0d6efd\">Whiteboard Invitation</h2>" +
            "<p>You've been invited to join <strong>" + sessionName + "</strong>.</p>" +
            "<p><a href=\"" + joinUrl + "\" " +
            "style=\"display:inline-block;padding:12px 24px;background:#0d6efd;color:#fff;" +
            "text-decoration:none;border-radius:6px;font-weight:600\">Join Whiteboard Session</a></p>" +
            "<p style=\"color:#666;font-size:14px\">Or copy this link:<br><a href=\"" + joinUrl + "\">" +
            joinUrl + "</a></p>" +
            "<p style=\"color:#999;font-size:12px\">Session ID: " + sessionId + "</p>" +
            "</div>";

        helper.setText(plainText, htmlText);
        mailSender.send(mimeMessage);
    }

    public InvitationResponse resolveToken(String token) {
        Invitation invitation = invitationRepository.findByToken(token)
            .orElseThrow(() -> new RuntimeException("Invalid invitation token"));

        WhiteboardSession session = sessionRepository.findById(invitation.getSessionId())
            .orElseThrow(() -> new RuntimeException("Session not found"));

        invitation.setStatus("ACCEPTED");
        invitationRepository.save(invitation);

        InvitationResponse response = new InvitationResponse();
        response.setSessionId(session.getId());
        response.setSessionName(session.getName());
        return response;
    }
}
