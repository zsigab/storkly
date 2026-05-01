package app.storkly.registry;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.Mockito.when;

import app.storkly.domain.exception.AccessDeniedException;
import app.storkly.domain.exception.RegistryNotFoundException;
import app.storkly.domain.item.ClaimRepository;
import app.storkly.domain.registry.Registry;
import app.storkly.domain.registry.RegistryCoOwnerRepository;
import app.storkly.domain.registry.RegistryInviteRepository;
import app.storkly.domain.registry.RegistryRepository;
import app.storkly.domain.registry.RegistrySubscriber;
import app.storkly.domain.registry.RegistrySubscriptionRepository;
import app.storkly.domain.registry.RegistryVisibility;
import app.storkly.service.registry.RegistryAccessService;
import app.storkly.service.registry.RegistryService;
import java.time.OffsetDateTime;
import java.util.List;
import java.util.Optional;
import java.util.UUID;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

@ExtendWith(MockitoExtension.class)
class RegistryServiceTest {

    @Mock
    private RegistryRepository registryRepository;

    @Mock
    private RegistryInviteRepository inviteRepository;

    @Mock
    private RegistrySubscriptionRepository subscriptionRepository;

    @Mock
    private RegistryCoOwnerRepository coOwnerRepository;

    @Mock
    private RegistryAccessService registryAccessService;

    @Mock
    private ClaimRepository claimRepository;

    private RegistryService registryService;

    @BeforeEach
    void setUp() {
        registryService = new RegistryService(
                registryRepository,
                inviteRepository,
                subscriptionRepository,
                coOwnerRepository,
                registryAccessService,
                claimRepository);
    }

    @Test
    void findSubscribers_ownerCanViewSubscribers() {
        UUID registryId = UUID.randomUUID();
        UUID ownerId = UUID.randomUUID();
        String slug = "test-registry";

        Registry registry = Registry.builder()
                .id(registryId)
                .ownerId(ownerId)
                .name("Test Registry")
                .slug(slug)
                .visibility(RegistryVisibility.PUBLIC)
                .createdAt(OffsetDateTime.now())
                .build();

        List<RegistrySubscriber> subscribers = List.of(
                new RegistrySubscriber(UUID.randomUUID(), "Alice", OffsetDateTime.now()),
                new RegistrySubscriber(UUID.randomUUID(), "Bob", OffsetDateTime.now()));

        when(registryRepository.findBySlug(slug)).thenReturn(Optional.of(registry));
        when(subscriptionRepository.findByRegistryId(registryId)).thenReturn(subscribers);

        List<RegistrySubscriber> result = registryService.findSubscribers(slug, ownerId);

        assertThat(result).hasSize(2);
        assertThat(result.get(0).displayName()).isEqualTo("Alice");
        assertThat(result.get(1).displayName()).isEqualTo("Bob");
    }

    @Test
    void findSubscribers_nonOwnerThrowsAccessDenied() {
        UUID registryId = UUID.randomUUID();
        UUID ownerId = UUID.randomUUID();
        UUID currentUserId = UUID.randomUUID();
        String slug = "test-registry";

        Registry registry = Registry.builder()
                .id(registryId)
                .ownerId(ownerId)
                .name("Test Registry")
                .slug(slug)
                .visibility(RegistryVisibility.PUBLIC)
                .createdAt(OffsetDateTime.now())
                .build();

        when(registryRepository.findBySlug(slug)).thenReturn(Optional.of(registry));

        assertThatThrownBy(() -> registryService.findSubscribers(slug, currentUserId))
                .isInstanceOf(AccessDeniedException.class)
                .hasMessage("Only the registry owner can perform this action");
    }

    @Test
    void findSubscribers_registryNotFound() {
        String slug = "nonexistent";

        when(registryRepository.findBySlug(slug)).thenReturn(Optional.empty());

        assertThatThrownBy(() -> registryService.findSubscribers(slug, UUID.randomUUID()))
                .isInstanceOf(RegistryNotFoundException.class);
    }
}
