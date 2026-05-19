package pl.ttrpgassistant.backend.security;

import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.http.HttpHeaders;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;
import pl.ttrpgassistant.backend.user.UserEntity;
import pl.ttrpgassistant.backend.user.UserRepository;

import java.io.IOException;
import java.time.Instant;
import java.util.List;

@Component
public class JwtAuthenticationFilter extends OncePerRequestFilter {

    private final JwtService jwtService;
    private final UserRepository userRepository;

    public JwtAuthenticationFilter(JwtService jwtService, UserRepository userRepository) {
        this.jwtService = jwtService;
        this.userRepository = userRepository;
    }

    @Override
    protected boolean shouldNotFilter(HttpServletRequest request) {
        String path = request.getServletPath();
        return path.startsWith("/api/auth/")
                || path.equals("/api/health");
    }

    @Override
    protected void doFilterInternal(
            HttpServletRequest request,
            HttpServletResponse response,
            FilterChain filterChain
    ) throws ServletException, IOException {

        String token = resolveToken(request);

        if (token == null || token.isBlank()) {
            filterChain.doFilter(request, response);
            return;
        }

        try {
            var claims = jwtService.parseClaims(token);
            Long userId = Long.parseLong(claims.getSubject());
            String role = claims.get("role", String.class);
            Instant issuedAt = claims.getIssuedAt() == null ? null : claims.getIssuedAt().toInstant();
            UserEntity user = userRepository.findById(userId).orElse(null);
            if (user == null) {
                SecurityContextHolder.clearContext();
                filterChain.doFilter(request, response);
                return;
            }
            if (user.getTokenInvalidatedAt() != null && (issuedAt == null || issuedAt.isBefore(user.getTokenInvalidatedAt()))) {
                SecurityContextHolder.clearContext();
                filterChain.doFilter(request, response);
                return;
            }

            var authorities = role == null
                    ? List.<SimpleGrantedAuthority>of()
                    : List.of(new SimpleGrantedAuthority("ROLE_" + role));

            var authentication = new UsernamePasswordAuthenticationToken(
                    userId,
                    null,
                    authorities
            );

            SecurityContextHolder.getContext().setAuthentication(authentication);
        } catch (Exception ex) {
            SecurityContextHolder.clearContext();
        }

        filterChain.doFilter(request, response);
    }

    private String resolveToken(HttpServletRequest request) {
        String authHeader = request.getHeader(HttpHeaders.AUTHORIZATION);
        if (authHeader != null && authHeader.startsWith("Bearer ")) {
            return authHeader.substring("Bearer ".length()).trim();
        }
        if ("/api/realtime/events".equals(request.getServletPath())) {
            return request.getParameter("token");
        }
        return null;
    }
}
