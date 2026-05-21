package app.storkly.service.item;

import app.storkly.domain.item.Item;
import java.util.List;
import java.util.UUID;

public record ItemWithEvents(Item item, List<UUID> linkedEventIds) {}
