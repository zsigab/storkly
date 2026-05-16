package app.storkly.registry;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import app.storkly.domain.exception.AccessDeniedException;
import app.storkly.domain.exception.AlreadySubscribedException;
import app.storkly.domain.exception.InvalidTokenException;
import app.storkly.domain.exception.RegistryNotFoundException;
import app.storkly.domain.exception.SubscriberHasClaimsException;
import app.storkly.domain.item.ClaimRepository;
import app.storkly.domain.registry.Registry;
import app.storkly.domain.registry.RegistryCoOwnerRepository;
import app.storkly.domain.registry.RegistryInvite;
import app.storkly.domain.registry.RegistryInviteRepository;
import app.storkly.domain.registry.RegistryRepository;
import app.storkly.domain.registry.RegistrySubscriber;
import app.storkly.domain.registry.RegistrySubscriptionRepository;
import app.storkly.domain.registry.RegistryVisibility;
import app.storkly.domain.registry.SlugRedirectRepository;
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
    private SlugRedirectRepository slugRedirectRepository;

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
                slugRedirectRepository,
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
                .themeColor("peach")
                .themeBackground("none")
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
                .themeColor("peach")
                .themeBackground("none")
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

    @Test
    void unsubscribe_noClaims_deletesSubscription() {
        UUID userId = UUID.randomUUID();
        String slug = "test-registry";
        UUID registryId = UUID.randomUUID();
        Registry registry = Registry.builder()
                .id(registryId)
                .ownerId(UUID.randomUUID())
                .name("Test")
                .slug(slug)
                .visibility(RegistryVisibility.PUBLIC)
                .themeColor("peach")
                .themeBackground("none")
                .createdAt(OffsetDateTime.now())
                .build();

        when(registryRepository.findBySlug(slug)).thenReturn(Optional.of(registry));
        when(claimRepository.existsActiveByUserAndRegistry(userId, registryId)).thenReturn(false);

        registryService.unsubscribe(slug, userId);

        verify(subscriptionRepository).delete(userId, registryId);
    }

    @Test
    void unsubscribe_withActiveClaims_throwsSubscriberHasClaimsException() {
        UUID userId = UUID.randomUUID();
        String slug = "test-registry";
        UUID registryId = UUID.randomUUID();
        Registry registry = Registry.builder()
                .id(registryId)
                .ownerId(UUID.randomUUID())
                .name("Test")
                .slug(slug)
                .visibility(RegistryVisibility.PUBLIC)
                .themeColor("peach")
                .themeBackground("none")
                .createdAt(OffsetDateTime.now())
                .build();

        when(registryRepository.findBySlug(slug)).thenReturn(Optional.of(registry));
        when(claimRepository.existsActiveByUserAndRegistry(userId, registryId)).thenReturn(true);

        assertThatThrownBy(() -> registryService.unsubscribe(slug, userId))
                .isInstanceOf(SubscriberHasClaimsException.class);

        verify(subscriptionRepository, never()).delete(any(), any());
    }

    @Test
    void join_validToken_savesSubscription() {
        UUID userId = UUID.randomUUID();
        String slug = "test-registry";
        UUID registryId = UUID.randomUUID();
        String token = "invite-token";
        Registry registry = Registry.builder()
                .id(registryId)
                .ownerId(UUID.randomUUID())
                .name("Test")
                .slug(slug)
                .visibility(RegistryVisibility.PRIVATE)
                .themeColor("peach")
                .themeBackground("none")
                .createdAt(OffsetDateTime.now())
                .build();
        RegistryInvite invite = RegistryInvite.builder()
                .registryId(registryId)
                .token(token)
                .createdAt(OffsetDateTime.now())
                .build();

        when(registryRepository.findBySlug(slug)).thenReturn(Optional.of(registry));
        when(inviteRepository.findByToken(token)).thenReturn(Optional.of(invite));
        when(subscriptionRepository.exists(userId, registryId)).thenReturn(false);

        registryService.join(slug, token, userId);

        verify(subscriptionRepository).save(userId, registryId);
    }

    @Test
    void join_alreadySubscribed_throwsAlreadySubscribedException() {
        UUID userId = UUID.randomUUID();
        String slug = "test-registry";
        UUID registryId = UUID.randomUUID();
        String token = "invite-token";
        Registry registry = Registry.builder()
                .id(registryId)
                .ownerId(UUID.randomUUID())
                .name("Test")
                .slug(slug)
                .visibility(RegistryVisibility.PRIVATE)
                .themeColor("peach")
                .themeBackground("none")
                .createdAt(OffsetDateTime.now())
                .build();
        RegistryInvite invite = RegistryInvite.builder()
                .registryId(registryId)
                .token(token)
                .createdAt(OffsetDateTime.now())
                .build();

        when(registryRepository.findBySlug(slug)).thenReturn(Optional.of(registry));
        when(inviteRepository.findByToken(token)).thenReturn(Optional.of(invite));
        when(subscriptionRepository.exists(userId, registryId)).thenReturn(true);

        assertThatThrownBy(() -> registryService.join(slug, token, userId))
                .isInstanceOf(AlreadySubscribedException.class);

        verify(subscriptionRepository, never()).save(any(), any());
    }

    @Test
    void join_tokenForDifferentRegistry_throwsInvalidToken() {
        UUID userId = UUID.randomUUID();
        String slug = "registry-a";
        UUID registryAId = UUID.randomUUID();
        UUID registryBId = UUID.randomUUID();
        String token = "wrong-registry-token";
        Registry registry = Registry.builder()
                .id(registryAId)
                .ownerId(UUID.randomUUID())
                .name("A")
                .slug(slug)
                .visibility(RegistryVisibility.PRIVATE)
                .themeColor("peach")
                .themeBackground("none")
                .createdAt(OffsetDateTime.now())
                .build();
        RegistryInvite invite = RegistryInvite.builder()
                .registryId(registryBId)
                .token(token)
                .createdAt(OffsetDateTime.now())
                .build();

        when(registryRepository.findBySlug(slug)).thenReturn(Optional.of(registry));
        when(inviteRepository.findByToken(token)).thenReturn(Optional.of(invite));

        assertThatThrownBy(() -> registryService.join(slug, token, userId)).isInstanceOf(InvalidTokenException.class);
    }

    @Test
    void update_withNewName_generatesNewSlugAndSavesOldAsRedirect() {
        UUID registryId = UUID.randomUUID();
        UUID ownerId = UUID.randomUUID();
        String oldSlug = "baby-registry";
        String newName = "Mikey's Registry";
        String newSlug = "mikeys-registry";

        Registry registry = Registry.builder()
                .id(registryId)
                .ownerId(ownerId)
                .name("Baby Registry")
                .slug(oldSlug)
                .visibility(RegistryVisibility.PUBLIC)
                .themeColor("peach")
                .themeBackground("none")
                .createdAt(OffsetDateTime.now())
                .build();

        when(registryRepository.findBySlug(oldSlug)).thenReturn(Optional.of(registry));
        when(registryRepository.existsBySlug(newSlug)).thenReturn(false);
        when(registryRepository.save(any())).thenAnswer(inv -> inv.getArgument(0));

        registryService.update(oldSlug, newName, null, null, null, null, ownerId);

        verify(slugRedirectRepository).save(oldSlug, registryId);
    }

    @Test
    void update_withSameName_keepsSameSlugNoRedirect() {
        UUID registryId = UUID.randomUUID();
        UUID ownerId = UUID.randomUUID();
        String slug = "baby-registry";

        Registry registry = Registry.builder()
                .id(registryId)
                .ownerId(ownerId)
                .name("Baby Registry")
                .slug(slug)
                .visibility(RegistryVisibility.PUBLIC)
                .themeColor("peach")
                .themeBackground("none")
                .createdAt(OffsetDateTime.now())
                .build();

        when(registryRepository.findBySlug(slug)).thenReturn(Optional.of(registry));
        when(registryRepository.save(any())).thenAnswer(inv -> inv.getArgument(0));

        registryService.update(slug, "Baby Registry", null, null, null, null, ownerId);

        verify(slugRedirectRepository, never()).save(any(), any());
    }

    @Test
    void findBySlug_withOldSlugViaRedirect_resolvesRegistry() {
        String oldSlug = "baby-registry";
        String newSlug = "mikeys-registry";
        UUID registryId = UUID.randomUUID();

        Registry registry = Registry.builder()
                .id(registryId)
                .ownerId(UUID.randomUUID())
                .name("Mikey's Registry")
                .slug(newSlug)
                .visibility(RegistryVisibility.PUBLIC)
                .themeColor("peach")
                .themeBackground("none")
                .createdAt(OffsetDateTime.now())
                .build();

        when(registryRepository.findBySlug(oldSlug)).thenReturn(Optional.empty());
        when(slugRedirectRepository.findRegistryByOldSlug(oldSlug)).thenReturn(Optional.of(registry));

        Registry result = registryService.findBySlug(oldSlug, UUID.randomUUID());

        assertThat(result.slug()).isEqualTo(newSlug);
        assertThat(result.id()).isEqualTo(registryId);
    }

    @Test
    void findBySlug_notFoundInEitherTable_throws() {
        String slug = "nonexistent";

        when(registryRepository.findBySlug(slug)).thenReturn(Optional.empty());
        when(slugRedirectRepository.findRegistryByOldSlug(slug)).thenReturn(Optional.empty());

        assertThatThrownBy(() -> registryService.findBySlug(slug, UUID.randomUUID()))
                .isInstanceOf(RegistryNotFoundException.class);
    }
}
