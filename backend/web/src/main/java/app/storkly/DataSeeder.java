package app.storkly;

import static app.storkly.domain.generated.Tables.CATEGORY;
import static app.storkly.domain.generated.Tables.CLAIM;
import static app.storkly.domain.generated.Tables.DELIVERY_OPTION;
import static app.storkly.domain.generated.Tables.EVENT;
import static app.storkly.domain.generated.Tables.ITEM;
import static app.storkly.domain.generated.Tables.REGISTRY;
import static app.storkly.domain.generated.Tables.RSVP;
import static app.storkly.domain.generated.Tables.USER;

import app.storkly.domain.generated.enums.ItemFlag;
import app.storkly.domain.generated.enums.ItemType;
import app.storkly.domain.generated.enums.RegistryVisibility;
import app.storkly.domain.generated.enums.SourceSite;
import app.storkly.domain.generated.enums.UserRole;
import java.math.BigDecimal;
import java.time.OffsetDateTime;
import java.util.UUID;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.jooq.DSLContext;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.boot.context.event.ApplicationReadyEvent;
import org.springframework.context.event.EventListener;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

@Component
@ConditionalOnProperty(name = "storkly.seed-data", havingValue = "true")
@RequiredArgsConstructor
@Slf4j
public class DataSeeder {

    private final DSLContext dsl;
    private final PasswordEncoder passwordEncoder;

    @EventListener(ApplicationReadyEvent.class)
    @Transactional
    public void seed() {
        if (dataAlreadySeeded()) {
            log.info("Seed data already present — skipping");
            return;
        }
        log.info("Seeding sample data...");
        seedUsers();
        seedRegistry();
        seedEvent();
        log.info("Seed data inserted successfully");
    }

    private boolean dataAlreadySeeded() {
        return dsl.fetchCount(USER, USER.EMAIL.eq("owner@example.com")) > 0;
    }

    private void seedUsers() {
        // These are seed-only test accounts. The hash below is NOT a real Argon2id hash —
        // it is computed at seed time from the literal string "password".
        String passwordHash = passwordEncoder.encode("password");

        OffsetDateTime now = OffsetDateTime.now();

        dsl.insertInto(USER)
                .set(USER.ID, UUID.fromString("00000000-0000-0000-0000-000000000001"))
                .set(USER.EMAIL, "owner@example.com")
                .set(USER.PASSWORD_HASH, passwordHash)
                .set(USER.DISPLAY_NAME, "Registry Owner")
                .set(USER.EMAIL_VERIFIED_AT, now)
                .set(USER.ROLE, UserRole.USER)
                .set(USER.CREATED_AT, now)
                .execute();

        dsl.insertInto(USER)
                .set(USER.ID, UUID.fromString("00000000-0000-0000-0000-000000000002"))
                .set(USER.EMAIL, "gifter@example.com")
                .set(USER.PASSWORD_HASH, passwordHash)
                .set(USER.DISPLAY_NAME, "Generous Gifter")
                .set(USER.EMAIL_VERIFIED_AT, now)
                .set(USER.ROLE, UserRole.USER)
                .set(USER.CREATED_AT, now)
                .execute();
    }

    private void seedRegistry() {
        UUID ownerId = UUID.fromString("00000000-0000-0000-0000-000000000001");
        UUID registryId = UUID.fromString("00000000-0000-0000-0000-000000000010");

        dsl.insertInto(REGISTRY)
                .set(REGISTRY.ID, registryId)
                .set(REGISTRY.OWNER_ID, ownerId)
                .set(REGISTRY.NAME, "Baby Shower")
                .set(REGISTRY.SLUG, "baby-shower")
                .set(REGISTRY.DESCRIPTION, "Our wishlist for the new arrival!")
                .set(REGISTRY.VISIBILITY, RegistryVisibility.PUBLIC)
                .set(REGISTRY.CREATED_AT, OffsetDateTime.now())
                .execute();

        UUID defaultCategoryId = seedCategories(registryId);
        seedItems(registryId, ownerId, defaultCategoryId);
    }

    private UUID seedCategories(UUID registryId) {
        UUID defaultCategoryId = UUID.fromString("00000000-0000-0000-0000-000000000020");
        UUID clothingCategoryId = UUID.fromString("00000000-0000-0000-0000-000000000021");
        UUID toysCategoryId = UUID.fromString("00000000-0000-0000-0000-000000000022");

        dsl.insertInto(CATEGORY)
                .set(CATEGORY.ID, defaultCategoryId)
                .set(CATEGORY.REGISTRY_ID, registryId)
                .set(CATEGORY.NAME, "Essentials")
                .set(CATEGORY.SORT_ORDER, 0)
                .set(CATEGORY.IS_DEFAULT, true)
                .execute();

        dsl.insertInto(CATEGORY)
                .set(CATEGORY.ID, clothingCategoryId)
                .set(CATEGORY.REGISTRY_ID, registryId)
                .set(CATEGORY.NAME, "Clothing")
                .set(CATEGORY.SORT_ORDER, 1)
                .set(CATEGORY.IS_DEFAULT, false)
                .execute();

        dsl.insertInto(CATEGORY)
                .set(CATEGORY.ID, toysCategoryId)
                .set(CATEGORY.REGISTRY_ID, registryId)
                .set(CATEGORY.NAME, "Toys & Books")
                .set(CATEGORY.SORT_ORDER, 2)
                .set(CATEGORY.IS_DEFAULT, false)
                .execute();

        return defaultCategoryId;
    }

    private void seedItems(UUID registryId, UUID ownerId, UUID defaultCategoryId) {
        UUID toyCategoryId = UUID.fromString("00000000-0000-0000-0000-000000000022");

        UUID item1Id = UUID.fromString("00000000-0000-0000-0000-000000000030");
        dsl.insertInto(ITEM)
                .set(ITEM.ID, item1Id)
                .set(ITEM.REGISTRY_ID, registryId)
                .set(ITEM.CATEGORY_ID, defaultCategoryId)
                .set(ITEM.ADDED_BY_USER_ID, ownerId)
                .set(ITEM.SOURCE_SITE, SourceSite.MANUAL)
                .set(ITEM.TITLE, "Ergobaby Omni 360 Baby Carrier")
                .set(ITEM.DESCRIPTION, "All-position baby carrier, newborn-ready")
                .set(ITEM.PRICE_REFERENCE, new BigDecimal("189.99"))
                .set(ITEM.CURRENCY, "USD")
                .set(ITEM.QUANTITY_DESIRED, 1)
                .set(ITEM.FLAG, ItemFlag.EXACT_ONLY)
                .set(ITEM.ITEM_TYPE, ItemType.PRODUCT)
                .set(ITEM.SORT_ORDER, 0)
                .set(ITEM.CREATED_AT, OffsetDateTime.now())
                .set(ITEM.UPDATED_AT, OffsetDateTime.now())
                .execute();

        UUID item2Id = UUID.fromString("00000000-0000-0000-0000-000000000031");
        dsl.insertInto(ITEM)
                .set(ITEM.ID, item2Id)
                .set(ITEM.REGISTRY_ID, registryId)
                .set(ITEM.CATEGORY_ID, defaultCategoryId)
                .set(ITEM.ADDED_BY_USER_ID, ownerId)
                .set(ITEM.SOURCE_SITE, SourceSite.AMAZON)
                .set(ITEM.TITLE, "Pampers Swaddlers Newborn Diapers")
                .set(ITEM.DESCRIPTION, "Size N, 120 count")
                .set(ITEM.URL_ORIGINAL, "https://www.amazon.com/dp/B07WFWM4WB")
                .set(ITEM.PRICE_REFERENCE, new BigDecimal("29.94"))
                .set(ITEM.CURRENCY, "USD")
                .set(ITEM.QUANTITY_DESIRED, 4)
                .set(ITEM.FLAG, ItemFlag.SIMILAR_OK)
                .set(ITEM.NOTES, "Any newborn-size diapers are fine")
                .set(ITEM.ITEM_TYPE, ItemType.PRODUCT)
                .set(ITEM.SORT_ORDER, 1)
                .set(ITEM.CREATED_AT, OffsetDateTime.now())
                .set(ITEM.UPDATED_AT, OffsetDateTime.now())
                .execute();

        UUID item3Id = UUID.fromString("00000000-0000-0000-0000-000000000032");
        dsl.insertInto(ITEM)
                .set(ITEM.ID, item3Id)
                .set(ITEM.REGISTRY_ID, registryId)
                .set(ITEM.CATEGORY_ID, defaultCategoryId)
                .set(ITEM.ADDED_BY_USER_ID, ownerId)
                .set(ITEM.SOURCE_SITE, SourceSite.MANUAL)
                .set(ITEM.TITLE, "HALO BassiNest Swivel Sleeper")
                .set(ITEM.DESCRIPTION, "Bedside bassinet with swivel feature")
                .set(ITEM.PRICE_REFERENCE, new BigDecimal("219.99"))
                .set(ITEM.CURRENCY, "USD")
                .set(ITEM.QUANTITY_DESIRED, 1)
                .set(ITEM.FLAG, ItemFlag.EXACT_ONLY)
                .set(ITEM.ITEM_TYPE, ItemType.PRODUCT)
                .set(ITEM.SORT_ORDER, 2)
                .set(ITEM.CREATED_AT, OffsetDateTime.now())
                .set(ITEM.UPDATED_AT, OffsetDateTime.now())
                .execute();

        UUID item4Id = UUID.fromString("00000000-0000-0000-0000-000000000033");
        dsl.insertInto(ITEM)
                .set(ITEM.ID, item4Id)
                .set(ITEM.REGISTRY_ID, registryId)
                .set(ITEM.CATEGORY_ID, toyCategoryId)
                .set(ITEM.ADDED_BY_USER_ID, ownerId)
                .set(ITEM.SOURCE_SITE, SourceSite.AMAZON)
                .set(ITEM.TITLE, "The Very Hungry Caterpillar Board Book")
                .set(ITEM.URL_ORIGINAL, "https://www.amazon.com/dp/0399226907")
                .set(ITEM.PRICE_REFERENCE, new BigDecimal("7.99"))
                .set(ITEM.CURRENCY, "USD")
                .set(ITEM.QUANTITY_DESIRED, 1)
                .set(ITEM.FLAG, ItemFlag.SIMILAR_CHEAPER)
                .set(ITEM.NOTES, "Any classic Eric Carle book welcome")
                .set(ITEM.ITEM_TYPE, ItemType.PRODUCT)
                .set(ITEM.SORT_ORDER, 3)
                .set(ITEM.CREATED_AT, OffsetDateTime.now())
                .set(ITEM.UPDATED_AT, OffsetDateTime.now())
                .execute();

        UUID item5Id = UUID.fromString("00000000-0000-0000-0000-000000000034");
        dsl.insertInto(ITEM)
                .set(ITEM.ID, item5Id)
                .set(ITEM.REGISTRY_ID, registryId)
                .set(ITEM.CATEGORY_ID, toyCategoryId)
                .set(ITEM.ADDED_BY_USER_ID, ownerId)
                .set(ITEM.SOURCE_SITE, SourceSite.MANUAL)
                .set(ITEM.TITLE, "Fisher-Price Baby Bouncer")
                .set(ITEM.DESCRIPTION, "Infant-to-toddler rocker with calming vibrations")
                .set(ITEM.PRICE_REFERENCE, new BigDecimal("69.99"))
                .set(ITEM.CURRENCY, "USD")
                .set(ITEM.QUANTITY_DESIRED, 1)
                .set(ITEM.FLAG, ItemFlag.SIMILAR_OK)
                .set(ITEM.ITEM_TYPE, ItemType.PRODUCT)
                .set(ITEM.SORT_ORDER, 4)
                .set(ITEM.CREATED_AT, OffsetDateTime.now())
                .set(ITEM.UPDATED_AT, OffsetDateTime.now())
                .execute();

        // Already owned — no gifting needed
        dsl.insertInto(ITEM)
                .set(ITEM.ID, UUID.fromString("00000000-0000-0000-0000-000000000035"))
                .set(ITEM.REGISTRY_ID, registryId)
                .set(ITEM.CATEGORY_ID, defaultCategoryId)
                .set(ITEM.ADDED_BY_USER_ID, ownerId)
                .set(ITEM.SOURCE_SITE, SourceSite.MANUAL)
                .set(ITEM.TITLE, "Braun No Touch + Forehead Thermometer")
                .set(ITEM.DESCRIPTION, "In-ear and forehead thermometer for babies")
                .set(ITEM.PRICE_REFERENCE, new BigDecimal("49.99"))
                .set(ITEM.CURRENCY, "USD")
                .set(ITEM.QUANTITY_DESIRED, 1)
                .set(ITEM.FLAG, ItemFlag.EXACT_ONLY)
                .set(ITEM.ALREADY_OWNED, true)
                .set(ITEM.ITEM_TYPE, ItemType.PRODUCT)
                .set(ITEM.SORT_ORDER, 5)
                .set(ITEM.CREATED_AT, OffsetDateTime.now())
                .set(ITEM.UPDATED_AT, OffsetDateTime.now())
                .execute();

        // Fund item — parents can decide what to spend the money on
        dsl.insertInto(ITEM)
                .set(ITEM.ID, UUID.fromString("00000000-0000-0000-0000-000000000036"))
                .set(ITEM.REGISTRY_ID, registryId)
                .set(ITEM.CATEGORY_ID, defaultCategoryId)
                .set(ITEM.ADDED_BY_USER_ID, ownerId)
                .set(ITEM.SOURCE_SITE, SourceSite.MANUAL)
                .set(ITEM.TITLE, "Clothing Fund")
                .set(ITEM.DESCRIPTION, "Help us get clothes and shoes as the baby grows!")
                .set(ITEM.PRICE_REFERENCE, new BigDecimal("200.00"))
                .set(ITEM.CURRENCY, "USD")
                .set(ITEM.QUANTITY_DESIRED, 1)
                .set(ITEM.FLAG, ItemFlag.EXACT_ONLY)
                .set(ITEM.ITEM_TYPE, ItemType.FUND)
                .set(ITEM.SORT_ORDER, 6)
                .set(ITEM.CREATED_AT, OffsetDateTime.now())
                .set(ITEM.UPDATED_AT, OffsetDateTime.now())
                .execute();

        // Anonymous claim — gifter left their name but is not a registered user
        dsl.insertInto(CLAIM)
                .set(CLAIM.ID, UUID.fromString("00000000-0000-0000-0000-000000000040"))
                .set(CLAIM.ITEM_ID, item2Id)
                .set(CLAIM.CLAIMER_NAME, "Aunt Maria")
                .set(CLAIM.CLAIMER_EMAIL, "maria@example.com")
                .set(CLAIM.QUANTITY_CLAIMED, 2)
                .set(CLAIM.CLAIM_TOKEN, "seed-claim-token-00000000000000000000001")
                .set(CLAIM.CLAIMED_AT, OffsetDateTime.now())
                .execute();
    }

    private void seedEvent() {
        // Smoke test scenarios:
        // 1. RSVP form: http://localhost:5173/rsvp/seed-rsvp-token-event001
        // 2. Event edit (owner only): http://localhost:5173/e/00000000-0000-0000-0000-000000000050/edit
        // 3. Public event: http://localhost:5173/e/00000000-0000-0000-0000-000000000050
        // The seeded event also backs an EVENT-type claim type on the baby-shower registry
        // (see seedDeliveryOptions): claimers can choose to hand the gift over at this event.

        UUID ownerId = UUID.fromString("00000000-0000-0000-0000-000000000001");
        UUID eventId = UUID.fromString("00000000-0000-0000-0000-000000000050");

        dsl.insertInto(EVENT)
                .set(EVENT.ID, eventId)
                .set(EVENT.OWNER_ID, ownerId)
                .set(EVENT.TITLE, "Baby Shower Celebration")
                .set(EVENT.EVENT_DATE, OffsetDateTime.now().plusDays(7))
                .set(EVENT.LOCATION, "Community Center, 123 Main St")
                .set(EVENT.RSVP_TOKEN, "seed-rsvp-token-event001")
                .set(EVENT.CREATED_AT, OffsetDateTime.now())
                .execute();

        // RSVP 1: attending, confirmed
        dsl.insertInto(RSVP)
                .set(RSVP.ID, UUID.fromString("00000000-0000-0000-0000-000000000060"))
                .set(RSVP.EVENT_ID, eventId)
                .set(RSVP.USER_ID, (UUID) null)
                .set(RSVP.EMAIL, "attendee1@example.com")
                .set(RSVP.DISPLAY_NAME, "Alice Johnson")
                .set(RSVP.ATTENDING, true)
                .set(RSVP.CONFIRMATION_TOKEN, "seed-confirm-token-rsvp0001")
                .set(RSVP.CONFIRMED_AT, OffsetDateTime.now())
                .set(RSVP.CREATED_AT, OffsetDateTime.now())
                .execute();

        // RSVP 2: not attending, confirmed
        dsl.insertInto(RSVP)
                .set(RSVP.ID, UUID.fromString("00000000-0000-0000-0000-000000000061"))
                .set(RSVP.EVENT_ID, eventId)
                .set(RSVP.USER_ID, (UUID) null)
                .set(RSVP.EMAIL, "attendee2@example.com")
                .set(RSVP.DISPLAY_NAME, "Bob Smith")
                .set(RSVP.ATTENDING, false)
                .set(RSVP.CONFIRMATION_TOKEN, "seed-confirm-token-rsvp0002")
                .set(RSVP.CONFIRMED_AT, OffsetDateTime.now())
                .set(RSVP.CREATED_AT, OffsetDateTime.now())
                .execute();

        // EVENT-type claim type on the baby-shower registry: gifters can choose to hand
        // the gift over at this event. Label and instructions are derived from the event.
        UUID registryId = UUID.fromString("00000000-0000-0000-0000-000000000010");
        dsl.insertInto(DELIVERY_OPTION)
                .set(DELIVERY_OPTION.ID, UUID.fromString("00000000-0000-0000-0000-000000000070"))
                .set(DELIVERY_OPTION.REGISTRY_ID, registryId)
                .set(DELIVERY_OPTION.TYPE, "EVENT")
                .set(DELIVERY_OPTION.LABEL, "Baby Shower Celebration")
                .set(DELIVERY_OPTION.DESCRIPTION, "Handover at Baby Shower Celebration")
                .set(DELIVERY_OPTION.ENABLED, true)
                .set(DELIVERY_OPTION.SORT_ORDER, 0)
                .set(DELIVERY_OPTION.EVENT_ID, eventId)
                .execute();
    }
}
