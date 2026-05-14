package app.storkly.exception;

import app.storkly.domain.exception.AccessDeniedException;
import app.storkly.domain.exception.AlreadySubscribedException;
import app.storkly.domain.exception.CategoryNotFoundException;
import app.storkly.domain.exception.ClaimNotFoundException;
import app.storkly.domain.exception.ClaimNotReceivedException;
import app.storkly.domain.exception.EmailAlreadyRegisteredException;
import app.storkly.domain.exception.InvalidCredentialsException;
import app.storkly.domain.exception.InvalidTokenException;
import app.storkly.domain.exception.ItemAlreadyOwnedException;
import app.storkly.domain.exception.ItemHasClaimsException;
import app.storkly.domain.exception.ItemNotFoundException;
import app.storkly.domain.exception.RegistryNotFoundException;
import app.storkly.domain.exception.SubscriberHasClaimsException;
import app.storkly.domain.exception.UserNotFoundException;
import app.storkly.scraper.ScrapingException;
import lombok.extern.slf4j.Slf4j;
import org.springframework.core.Ordered;
import org.springframework.core.annotation.Order;
import org.springframework.http.HttpStatus;
import org.springframework.http.ProblemDetail;
import org.springframework.security.core.AuthenticationException;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;
import org.springframework.web.server.ResponseStatusException;

@RestControllerAdvice
@Slf4j
@Order(Ordered.HIGHEST_PRECEDENCE)
public class GlobalExceptionHandler {

    @ExceptionHandler({
        UserNotFoundException.class,
        RegistryNotFoundException.class,
        CategoryNotFoundException.class,
        ItemNotFoundException.class,
        ClaimNotFoundException.class
    })
    public ProblemDetail handleNotFound(RuntimeException ex) {
        return ProblemDetail.forStatusAndDetail(HttpStatus.NOT_FOUND, ex.getMessage());
    }

    @ExceptionHandler({
        AlreadySubscribedException.class,
        ItemAlreadyOwnedException.class,
        ItemHasClaimsException.class,
        SubscriberHasClaimsException.class,
        ClaimNotReceivedException.class
    })
    public ProblemDetail handleConflict(RuntimeException ex) {
        return ProblemDetail.forStatusAndDetail(HttpStatus.CONFLICT, ex.getMessage());
    }

    @ExceptionHandler(AccessDeniedException.class)
    public ProblemDetail handleForbidden(AccessDeniedException ex) {
        return ProblemDetail.forStatusAndDetail(HttpStatus.FORBIDDEN, ex.getMessage());
    }

    @ExceptionHandler(EmailAlreadyRegisteredException.class)
    public ProblemDetail handleConflict(EmailAlreadyRegisteredException ex) {
        return ProblemDetail.forStatusAndDetail(HttpStatus.CONFLICT, ex.getMessage());
    }

    @ExceptionHandler(InvalidTokenException.class)
    public ProblemDetail handleUnauthorized(InvalidTokenException ex) {
        return ProblemDetail.forStatusAndDetail(HttpStatus.UNAUTHORIZED, ex.getMessage());
    }

    @ExceptionHandler(InvalidCredentialsException.class)
    public ProblemDetail handleInvalidCredentials(InvalidCredentialsException ex) {
        return ProblemDetail.forStatusAndDetail(HttpStatus.UNAUTHORIZED, ex.getMessage());
    }

    @ExceptionHandler(AuthenticationException.class)
    public ProblemDetail handleAuthenticationException(AuthenticationException ex) {
        return ProblemDetail.forStatusAndDetail(HttpStatus.UNAUTHORIZED, ex.getMessage());
    }

    @ExceptionHandler(MethodArgumentNotValidException.class)
    public ProblemDetail handleValidation(MethodArgumentNotValidException ex) {
        ProblemDetail detail = ProblemDetail.forStatus(HttpStatus.UNPROCESSABLE_ENTITY);
        detail.setDetail("Validation failed");
        detail.setProperty(
                "errors",
                ex.getBindingResult().getFieldErrors().stream()
                        .map(e -> e.getField() + ": " + e.getDefaultMessage())
                        .toList());
        return detail;
    }

    @ExceptionHandler(ScrapingException.class)
    public ProblemDetail handleScrapingException(ScrapingException ex) {
        return ProblemDetail.forStatusAndDetail(HttpStatus.UNPROCESSABLE_ENTITY, ex.getMessage());
    }

    @ExceptionHandler(ResponseStatusException.class)
    public ProblemDetail handleResponseStatus(ResponseStatusException ex) {
        String detail = ex.getReason() != null ? ex.getReason() : ex.getMessage();
        return ProblemDetail.forStatusAndDetail(
                HttpStatus.valueOf(ex.getStatusCode().value()), detail);
    }

    @ExceptionHandler(Exception.class)
    public ProblemDetail handleUnexpected(Exception ex) {
        log.error("Unexpected error", ex);
        return ProblemDetail.forStatusAndDetail(HttpStatus.INTERNAL_SERVER_ERROR, "An unexpected error occurred");
    }
}
