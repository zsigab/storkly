package app.storkly.registry;

import static org.assertj.core.api.Assertions.assertThatCode;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.Mockito.when;

import app.storkly.domain.exception.AccessDeniedException;
import app.storkly.domain.registry.Registry;
import app.storkly.domain.registry.RegistryCoOwnerRepository;
import app.storkly.domain.registry.RegistrySubscriptionRepository;
import app.storkly.domain.registry.RegistryVisibility;
import app.storkly.service.registry.RegistryAccessService;
import java.time.OffsetDateTime;
import java.util.UUID;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

@ExtendWith(MockitoExtension.class)
class RegistryAccessServiceTest {

    @Mock
    private RegistryCoOwnerRepository coOwnerRepository;

    @Mock
    private RegistrySubscriptionRepository subscriptionRepository;

    private RegistryAccessService registryAccessService;

    private final UUID ownerId = UUID.randomUUID();
    private final UUID registryId = UUID.randomUUID();

    @BeforeEach
    void setUp() {
        registryAccessService = new RegistryAccessService(coOwnerRepository, subscriptionRepository);
    }

    // --- PUBLIC ---

    @Test
    void assertReadAccess_public_anonymousAllowed() {
        Registry registry = publicRegistry();
        assertThatCode(() -> registryAccessService.assertReadAccess(registry, null))
                .doesNotThrowAnyException();
    }

    @Test
    void assertReadAccess_public_anyUserAllowed() {
        Registry registry = publicRegistry();
        assertThatCode(() -> registryAccessService.assertReadAccess(registry, UUID.randomUUID()))
                .doesNotThrowAnyException();
    }

    // --- HIDDEN ---

    @Test
    void assertReadAccess_hidden_anonymousThrows() {
        Registry registry = hiddenRegistry();
        assertThatThrownBy(() -> registryAccessService.assertReadAccess(registry, null))
                .isInstanceOf(AccessDeniedException.class);
    }

    @Test
    void assertReadAccess_hidden_ownerAllowed() {
        Registry registry = hiddenRegistry();
        assertThatCode(() -> registryAccessService.assertReadAccess(registry, ownerId))
                .doesNotThrowAnyException();
    }

    @Test
    void assertReadAccess_hidden_coOwnerAllowed() {
        Registry registry = hiddenRegistry();
        UUID coOwnerId = UUID.randomUUID();
        when(coOwnerRepository.isCoOwner(registryId, coOwnerId)).thenReturn(true);
        assertThatCode(() -> registryAccessService.assertReadAccess(registry, coOwnerId))
                .doesNotThrowAnyException();
    }

    @Test
    void assertReadAccess_hidden_strangerThrows() {
        Registry registry = hiddenRegistry();
        UUID strangerId = UUID.randomUUID();
        when(coOwnerRepository.isCoOwner(registryId, strangerId)).thenReturn(false);
        assertThatThrownBy(() -> registryAccessService.assertReadAccess(registry, strangerId))
                .isInstanceOf(AccessDeniedException.class);
    }

    // --- PRIVATE ---

    @Test
    void assertReadAccess_private_anonymousThrows() {
        Registry registry = privateRegistry();
        assertThatThrownBy(() -> registryAccessService.assertReadAccess(registry, null))
                .isInstanceOf(AccessDeniedException.class);
    }

    @Test
    void assertReadAccess_private_ownerAllowed() {
        Registry registry = privateRegistry();
        assertThatCode(() -> registryAccessService.assertReadAccess(registry, ownerId))
                .doesNotThrowAnyException();
    }

    @Test
    void assertReadAccess_private_subscriberAllowed() {
        Registry registry = privateRegistry();
        UUID subscriberId = UUID.randomUUID();
        when(coOwnerRepository.isCoOwner(registryId, subscriberId)).thenReturn(false);
        when(subscriptionRepository.exists(subscriberId, registryId)).thenReturn(true);
        assertThatCode(() -> registryAccessService.assertReadAccess(registry, subscriberId))
                .doesNotThrowAnyException();
    }

    @Test
    void assertReadAccess_private_strangerThrows() {
        Registry registry = privateRegistry();
        UUID strangerId = UUID.randomUUID();
        when(coOwnerRepository.isCoOwner(registryId, strangerId)).thenReturn(false);
        when(subscriptionRepository.exists(strangerId, registryId)).thenReturn(false);
        assertThatThrownBy(() -> registryAccessService.assertReadAccess(registry, strangerId))
                .isInstanceOf(AccessDeniedException.class);
    }

    private Registry publicRegistry() {
        return Registry.builder()
                .id(registryId)
                .ownerId(ownerId)
                .name("Test")
                .slug("test")
                .visibility(RegistryVisibility.PUBLIC)
                .createdAt(OffsetDateTime.now())
                .build();
    }

    private Registry hiddenRegistry() {
        return Registry.builder()
                .id(registryId)
                .ownerId(ownerId)
                .name("Test")
                .slug("test")
                .visibility(RegistryVisibility.HIDDEN)
                .createdAt(OffsetDateTime.now())
                .build();
    }

    private Registry privateRegistry() {
        return Registry.builder()
                .id(registryId)
                .ownerId(ownerId)
                .name("Test")
                .slug("test")
                .visibility(RegistryVisibility.PRIVATE)
                .createdAt(OffsetDateTime.now())
                .build();
    }
}
