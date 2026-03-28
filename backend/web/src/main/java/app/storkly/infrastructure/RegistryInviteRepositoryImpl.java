package app.storkly.infrastructure;

import static app.storkly.domain.generated.Tables.REGISTRY_INVITE;

import app.storkly.domain.generated.tables.records.RegistryInviteRecord;
import app.storkly.domain.registry.RegistryInvite;
import app.storkly.domain.registry.RegistryInviteRepository;
import java.util.Optional;
import java.util.UUID;
import lombok.RequiredArgsConstructor;
import org.jooq.DSLContext;
import org.springframework.stereotype.Repository;

@Repository
@RequiredArgsConstructor
public class RegistryInviteRepositoryImpl implements RegistryInviteRepository {

    private final DSLContext dsl;

    @Override
    public RegistryInvite save(RegistryInvite invite) {
        UUID id = UUID.randomUUID();
        dsl.insertInto(REGISTRY_INVITE)
                .set(REGISTRY_INVITE.ID, id)
                .set(REGISTRY_INVITE.REGISTRY_ID, invite.registryId())
                .set(REGISTRY_INVITE.TOKEN, invite.token())
                .set(REGISTRY_INVITE.CREATED_AT, invite.createdAt())
                .execute();
        return RegistryInvite.builder()
                .id(id)
                .registryId(invite.registryId())
                .token(invite.token())
                .createdAt(invite.createdAt())
                .build();
    }

    @Override
    public Optional<RegistryInvite> findByToken(String token) {
        return dsl.selectFrom(REGISTRY_INVITE)
                .where(REGISTRY_INVITE.TOKEN.eq(token))
                .fetchOptional()
                .map(this::toInvite);
    }

    @Override
    public void deleteByRegistryId(UUID registryId) {
        dsl.deleteFrom(REGISTRY_INVITE)
                .where(REGISTRY_INVITE.REGISTRY_ID.eq(registryId))
                .execute();
    }

    private RegistryInvite toInvite(RegistryInviteRecord r) {
        return RegistryInvite.builder()
                .id(r.getId())
                .registryId(r.getRegistryId())
                .token(r.getToken())
                .createdAt(r.getCreatedAt())
                .usedAt(r.getUsedAt())
                .build();
    }
}
