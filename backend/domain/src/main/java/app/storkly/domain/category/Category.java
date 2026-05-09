package app.storkly.domain.category;

import java.util.UUID;
import lombok.Builder;
import org.jspecify.annotations.Nullable;

@Builder
public record Category(
        @Nullable UUID id,
        @Nullable UUID registryId,
        String name,
        int sortOrder,
        boolean isDefault,
        boolean isSystem) {}
