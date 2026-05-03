package app.storkly.image;

import app.storkly.image.dto.ImageUploadResponse;
import jakarta.annotation.PostConstruct;
import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.util.Set;
import java.util.UUID;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.multipart.MultipartFile;
import org.springframework.web.server.ResponseStatusException;

@RestController
@RequiredArgsConstructor
@Slf4j
public class ImageController {

    private static final Set<String> ALLOWED_CONTENT_TYPES =
            Set.of("image/jpeg", "image/png", "image/webp", "image/gif");
    private static final Set<String> ALLOWED_EXTENSIONS = Set.of("jpg", "jpeg", "png", "webp", "gif");

    private final ImageStorageProperties props;

    @PostConstruct
    void ensureUploadDirExists() throws IOException {
        Path dir = Paths.get(props.uploadDir());
        if (!Files.exists(dir)) {
            Files.createDirectories(dir);
            log.info("Created image upload directory: {}", dir.toAbsolutePath());
        }
    }

    @PostMapping("/api/images")
    public ImageUploadResponse upload(@RequestParam("file") MultipartFile file) {
        if (file.isEmpty()) {
            throw new ResponseStatusException(HttpStatus.UNPROCESSABLE_ENTITY, "File is empty");
        }

        String contentType = file.getContentType();
        if (contentType == null || !ALLOWED_CONTENT_TYPES.contains(contentType)) {
            throw new ResponseStatusException(
                    HttpStatus.UNPROCESSABLE_ENTITY, "Unsupported file type. Allowed: JPEG, PNG, WebP, GIF");
        }

        long maxBytes = (long) props.maxSizeMb() * 1024 * 1024;
        if (file.getSize() > maxBytes) {
            throw new ResponseStatusException(
                    HttpStatus.UNPROCESSABLE_ENTITY, "File exceeds maximum size of " + props.maxSizeMb() + " MB");
        }

        String extension = extensionFor(contentType);
        String filename = UUID.randomUUID() + "." + extension;
        Path destination = Paths.get(props.uploadDir()).resolve(filename);

        try {
            file.transferTo(destination);
        } catch (IOException e) {
            log.error("Failed to save uploaded image: {}", e.getMessage(), e);
            throw new ResponseStatusException(HttpStatus.INTERNAL_SERVER_ERROR, "Failed to save image");
        }

        log.debug("Saved uploaded image to {}", destination);
        return new ImageUploadResponse("/uploads/" + filename);
    }

    private static String extensionFor(String contentType) {
        return switch (contentType) {
            case "image/jpeg" -> "jpg";
            case "image/png" -> "png";
            case "image/webp" -> "webp";
            case "image/gif" -> "gif";
            default -> "jpg";
        };
    }
}
