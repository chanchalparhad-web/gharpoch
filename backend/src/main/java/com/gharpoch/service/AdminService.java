package com.gharpoch.service;

import com.gharpoch.dto.*;
import com.gharpoch.model.*;
import com.gharpoch.repository.*;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDateTime;
import java.util.*;
import java.util.stream.Collectors;

@Service
public class AdminService {

    private final OrderRepository orderRepository;
    private final RestaurantRepository restaurantRepository;
    private final RestaurantUserRepository restaurantUserRepository;
    private final UserRepository userRepository;
    private final MenuCategoryRepository categoryRepository;
    private final MenuItemRepository menuItemRepository;
    private final DeliveryPartnerRepository partnerRepository;
    private final DeliveryAssignmentRepository assignmentRepository;
    private final ServiceAreaRepository serviceAreaRepository;
    private final OrderStatusHistoryRepository statusHistoryRepository;
    private final AuditLogRepository auditLogRepository;
    private final OrderService orderService;
    private final EventService eventService;
    private final PasswordEncoder passwordEncoder;

    public AdminService(OrderRepository orderRepository,
                        RestaurantRepository restaurantRepository,
                        RestaurantUserRepository restaurantUserRepository,
                        UserRepository userRepository,
                        MenuCategoryRepository categoryRepository,
                        MenuItemRepository menuItemRepository,
                        DeliveryPartnerRepository partnerRepository,
                        DeliveryAssignmentRepository assignmentRepository,
                        ServiceAreaRepository serviceAreaRepository,
                        OrderStatusHistoryRepository statusHistoryRepository,
                        AuditLogRepository auditLogRepository,
                        OrderService orderService,
                        EventService eventService,
                        PasswordEncoder passwordEncoder) {
        this.orderRepository = orderRepository;
        this.restaurantRepository = restaurantRepository;
        this.restaurantUserRepository = restaurantUserRepository;
        this.userRepository = userRepository;
        this.categoryRepository = categoryRepository;
        this.menuItemRepository = menuItemRepository;
        this.partnerRepository = partnerRepository;
        this.assignmentRepository = assignmentRepository;
        this.serviceAreaRepository = serviceAreaRepository;
        this.statusHistoryRepository = statusHistoryRepository;
        this.auditLogRepository = auditLogRepository;
        this.orderService = orderService;
        this.eventService = eventService;
        this.passwordEncoder = passwordEncoder;
    }

    @Transactional(readOnly = true)
    public List<OrderResponse> getAllOrders(String status, String village) {
        List<Order> orders = orderRepository.findAllByOrderByCreatedAtDesc();

        return orders.stream()
                .filter(o -> status == null || status.isBlank() || o.getStatus().name().equalsIgnoreCase(status.trim()))
                .filter(o -> {
                    if (village == null || village.isBlank()) return true;
                    return o.getAddressSnapshotJson() != null && o.getAddressSnapshotJson().toLowerCase().contains(village.toLowerCase().trim());
                })
                .map(orderService::mapToOrderResponse)
                .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public List<OrderStatusHistoryResponse> getOrderHistory(UUID orderId) {
        Order order = orderRepository.findById(orderId)
                .orElseThrow(() -> new IllegalArgumentException("Order not found"));

        return statusHistoryRepository.findByOrderOrderByCreatedAtAsc(order).stream().map(h -> {
            String actorName = h.getChangedBy() != null ? h.getChangedBy().getName() : "System / Auto";
            return new OrderStatusHistoryResponse(
                    h.getId(),
                    h.getOldStatus() != null ? h.getOldStatus().name() : null,
                    h.getNewStatus().name(),
                    actorName,
                    h.getRoleAtChange(),
                    h.getReason(),
                    h.getCreatedAt().toString()
            );
        }).collect(Collectors.toList());
    }

    @Transactional
    public OrderResponse assignDeliveryPartner(UUID orderId, UUID partnerId, User adminUser) {
        Order order = orderRepository.findById(orderId)
                .orElseThrow(() -> new IllegalArgumentException("Order not found"));

        DeliveryPartner partner = partnerRepository.findById(partnerId)
                .orElseThrow(() -> new IllegalArgumentException("Delivery partner not found"));

        if (!partner.isActive()) {
            throw new IllegalStateException("Delivery partner is inactive.");
        }

        OrderStatus oldStatus = order.getStatus();
        order.setStatus(OrderStatus.ASSIGNED);
        order.setAssignedPartner(partner);
        order.setUpdatedAt(LocalDateTime.now());
        Order savedOrder = orderRepository.save(order);

        Optional<DeliveryAssignment> optAssignment = assignmentRepository.findByOrderAndPartner(order, partner);
        DeliveryAssignment assignment;
        if (optAssignment.isPresent()) {
            assignment = optAssignment.get();
            assignment.setStatus("ASSIGNED");
            assignment.setAssignedAt(LocalDateTime.now());
        } else {
            assignment = new DeliveryAssignment(savedOrder, partner, adminUser, savedOrder.getDeliveryOtp());
        }
        assignmentRepository.save(assignment);

        OrderStatusHistory history = new OrderStatusHistory(
                savedOrder, oldStatus, OrderStatus.ASSIGNED, adminUser, "ROLE_ADMIN",
                "Assigned to delivery partner: " + partner.getUser().getName() + " (" + partner.getUser().getPhone() + ")"
        );
        statusHistoryRepository.save(history);

        AuditLog audit = new AuditLog(
                adminUser, "ASSIGN_DELIVERY_PARTNER", "ORDER", order.getId().toString(),
                "Assigned order " + order.getPublicOrderNumber() + " to partner " + partner.getUser().getName()
        );
        auditLogRepository.save(audit);

        OrderResponse res = orderService.mapToOrderResponse(savedOrder);
        eventService.broadcastOrderEvent(res);
        return res;
    }

    @Transactional
    public OrderResponse overrideOrderStatus(UUID orderId, AdminOverrideOrderRequest request, User adminUser) {
        Order order = orderRepository.findById(orderId)
                .orElseThrow(() -> new IllegalArgumentException("Order not found"));

        OrderStatus newStatus = OrderStatus.valueOf(request.getNewStatus().toUpperCase());
        OrderStatus oldStatus = order.getStatus();

        order.setStatus(newStatus);
        if (newStatus == OrderStatus.DELIVERED) {
            order.setPaymentStatus(PaymentStatus.PAID);
        } else if (newStatus == OrderStatus.CANCELLED_BY_ADMIN) {
            order.setCancellationReason(request.getReason());
        }
        order.setUpdatedAt(LocalDateTime.now());
        Order savedOrder = orderRepository.save(order);

        OrderStatusHistory history = new OrderStatusHistory(
                savedOrder, oldStatus, newStatus, adminUser, "ROLE_ADMIN",
                "ADMIN OVERRIDE: " + request.getReason()
        );
        statusHistoryRepository.save(history);

        AuditLog audit = new AuditLog(
                adminUser, "ORDER_STATUS_OVERRIDE", "ORDER", order.getId().toString(),
                "Changed status from " + oldStatus + " to " + newStatus + ". Reason: " + request.getReason()
        );
        auditLogRepository.save(audit);

        OrderResponse res = orderService.mapToOrderResponse(savedOrder);
        eventService.broadcastOrderEvent(res);
        return res;
    }

    @Transactional(readOnly = true)
    public DashboardStatsResponse getDashboardStats() {
        DashboardStatsResponse stats = new DashboardStatsResponse();
        List<Order> allOrders = orderRepository.findAll();

        stats.setTotalOrders(allOrders.size());
        stats.setPendingOrders(allOrders.stream()
                .filter(o -> o.getStatus() == OrderStatus.PLACED || o.getStatus() == OrderStatus.RESTAURANT_ACCEPTED)
                .count());
        stats.setActiveRestaurants(restaurantRepository.findByActiveTrue().size());
        stats.setAvailableDeliveryPartners(partnerRepository.findByActiveTrueAndAvailabilityStatus("ONLINE").size());

        long deliveredTotal = allOrders.stream()
                .filter(o -> o.getStatus() == OrderStatus.DELIVERED)
                .mapToLong(Order::getTotalPaise)
                .sum();
        stats.setGrossMerchandiseValuePaise(deliveredTotal);

        long deliveryFees = allOrders.stream()
                .filter(o -> o.getStatus() == OrderStatus.DELIVERED)
                .mapToLong(Order::getDeliveryFeePaise)
                .sum();
        stats.setTotalDeliveryFeesPaise(deliveryFees);

        long commission = allOrders.stream()
                .filter(o -> o.getStatus() == OrderStatus.DELIVERED)
                .mapToLong(o -> {
                    BigDecimal subtotal = BigDecimal.valueOf(o.getSubtotalPaise());
                    BigDecimal commPct = o.getRestaurant().getCommissionPct().divide(BigDecimal.valueOf(100), 4, RoundingMode.HALF_UP);
                    long commPaise = subtotal.multiply(commPct).longValue();
                    return commPaise + o.getPlatformFeePaise();
                })
                .sum();
        stats.setPlatformCommissionsPaise(commission);

        return stats;
    }

    @Transactional(readOnly = true)
    public List<Map<String, Object>> getReconciliationReport() {
        List<Order> delivered = orderRepository.findAll().stream()
                .filter(o -> o.getStatus() == OrderStatus.DELIVERED)
                .collect(Collectors.toList());

        List<Map<String, Object>> list = new ArrayList<>();
        for (Order o : delivered) {
            Map<String, Object> map = new HashMap<>();
            map.put("orderNumber", o.getPublicOrderNumber());
            map.put("restaurant", o.getRestaurant().getName());
            map.put("village", o.getRestaurant().getVillage());
            map.put("subtotalRs", o.getSubtotalPaise() / 100.0);
            map.put("deliveryFeeRs", o.getDeliveryFeePaise() / 100.0);
            map.put("platformFeeRs", o.getPlatformFeePaise() / 100.0);
            map.put("totalCollectedRs", o.getTotalPaise() / 100.0);

            BigDecimal subtotal = BigDecimal.valueOf(o.getSubtotalPaise());
            BigDecimal commPct = o.getRestaurant().getCommissionPct().divide(BigDecimal.valueOf(100), 4, RoundingMode.HALF_UP);
            double restaurantCommissionRs = (subtotal.multiply(commPct).longValue() + o.getPlatformFeePaise()) / 100.0;
            double restaurantPayableRs = (o.getSubtotalPaise() - subtotal.multiply(commPct).longValue()) / 100.0;

            map.put("gharpochEarningsRs", restaurantCommissionRs);
            map.put("hotelPayableRs", restaurantPayableRs);
            map.put("partnerEarningsRs", o.getDeliveryFeePaise() / 100.0);
            map.put("date", o.getCreatedAt().toString());
            list.add(map);
        }
        return list;
    }

    @Transactional(readOnly = true)
    public List<Map<String, Object>> getDeliveryPartners() {
        return partnerRepository.findAll().stream().map(dp -> {
            Map<String, Object> m = new HashMap<>();
            m.put("id", dp.getId());
            m.put("name", dp.getUser().getName());
            m.put("phone", dp.getUser().getPhone());
            m.put("vehicleNumber", dp.getVehicleNumber());
            m.put("availabilityStatus", dp.getAvailabilityStatus());
            m.put("active", dp.isActive());
            m.put("totalDeliveries", dp.getTotalDeliveries());
            m.put("totalEarningsRs", dp.getTotalEarningsPaise() / 100.0);
            return m;
        }).collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public List<ServiceArea> getServiceAreas() {
        return serviceAreaRepository.findAll();
    }

    @Transactional
    public ServiceArea updateServiceAreaFee(UUID areaId, long deliveryFeePaise, long minOrderPaise) {
        ServiceArea area = serviceAreaRepository.findById(areaId)
                .orElseThrow(() -> new IllegalArgumentException("Service area not found"));
        area.setDeliveryFeePaise(deliveryFeePaise);
        area.setMinOrderPaise(minOrderPaise);
        return serviceAreaRepository.save(area);
    }

    // ---------------- HOTEL & MENU MANAGEMENT IN ADMIN ---------------- //

    @Transactional(readOnly = true)
    public List<RestaurantDetailResponse> getAllRestaurantsAdmin() {
        return restaurantRepository.findAll().stream()
                .map(this::mapToRestaurantDetailResponse)
                .collect(Collectors.toList());
    }

    @Transactional
    public CreateRestaurantResponse createRestaurant(CreateRestaurantRequest request, User adminUser) {
        ServiceArea area = serviceAreaRepository.findByVillageNameIgnoreCase(request.getVillage().trim())
                .orElseGet(() -> serviceAreaRepository.save(new ServiceArea(request.getVillage().trim(), request.getVillage().trim(), 3000L, 10000L)));

        Restaurant r = new Restaurant();
        r.setName(request.getName().trim());
        r.setNameMr(request.getNameMr().trim());
        r.setServiceArea(area);
        r.setVillage(area.getVillageName());
        r.setAddress(request.getAddress().trim());
        r.setContactPhone(request.getContactPhone().trim());
        r.setOpeningTime(request.getOpeningTime());
        r.setClosingTime(request.getClosingTime());
        r.setPrepTimeMinutes(request.getPrepTimeMinutes() > 0 ? request.getPrepTimeMinutes() : 30);
        r.setMinOrderPaise(request.getMinOrderPaise() > 0 ? request.getMinOrderPaise() : 10000L);
        r.setCommissionPct(request.getCommissionPct() != null ? request.getCommissionPct() : new BigDecimal("10.00"));
        r.setCuisineTypes(request.getCuisineTypes());
        r.setCoverImageUrl(request.getCoverImageUrl() != null && !request.getCoverImageUrl().isBlank()
                ? request.getCoverImageUrl()
                : "https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?auto=format&fit=crop&w=800&q=80");
        r.setOpen(true);
        r.setActive(true);

        Restaurant saved = restaurantRepository.save(r);

        // Create or bind hotel owner login user
        Optional<User> existingUser = userRepository.findByPhone(request.getContactPhone().trim());
        User ownerUser;
        String rawPassword = request.getOwnerPassword() != null && !request.getOwnerPassword().isBlank()
                ? request.getOwnerPassword().trim()
                : "hotel123";

        String managerDisplayName = (request.getNameMr() != null ? request.getNameMr().trim() : request.getName().trim()) + " व्यवस्थापक";

        if (existingUser.isPresent()) {
            ownerUser = existingUser.get();
            ownerUser.setName(managerDisplayName);
            ownerUser.setRole(Role.ROLE_RESTAURANT_STAFF);
            ownerUser.setPasswordHash(passwordEncoder.encode(rawPassword));
            ownerUser = userRepository.save(ownerUser);
        } else {
            ownerUser = new User(
                    request.getContactPhone().trim(),
                    managerDisplayName,
                    passwordEncoder.encode(rawPassword),
                    Role.ROLE_RESTAURANT_STAFF
            );
            ownerUser = userRepository.save(ownerUser);
        }

        restaurantUserRepository.save(new RestaurantUser(saved, ownerUser, "OWNER"));

        // Create default starter categories
        categoryRepository.save(new MenuCategory(saved, "स्पेशल भाज्या (Sabji)", "Special Sabji", 1));
        categoryRepository.save(new MenuCategory(saved, "रोटी आणि भाकरी (Roti)", "Roti & Bhakari", 2));
        categoryRepository.save(new MenuCategory(saved, "राईस आणि पुलाव (Rice)", "Rice & Pulao", 3));

        AuditLog audit = new AuditLog(adminUser, "CREATE_RESTAURANT", "RESTAURANT", saved.getId().toString(),
                "Onboarded new restaurant: " + saved.getName() + " in " + saved.getVillage() + " with manager: " + ownerUser.getPhone());
        auditLogRepository.save(audit);

        return new CreateRestaurantResponse(
                saved.getId(),
                saved.getName(),
                saved.getNameMr(),
                saved.getVillage(),
                saved.getAddress(),
                saved.getContactPhone(),
                ownerUser.getPhone(),
                rawPassword,
                "ROLE_RESTAURANT_STAFF"
        );
    }

    @Transactional
    public MenuCategory createMenuCategory(UUID restaurantId, CreateMenuCategoryRequest request) {
        Restaurant restaurant = restaurantRepository.findById(restaurantId)
                .orElseThrow(() -> new IllegalArgumentException("Restaurant not found"));

        MenuCategory cat = new MenuCategory(restaurant, request.getNameMr(), request.getNameEn(), request.getSortOrder());
        return categoryRepository.save(cat);
    }

    @Transactional
    public MenuItem createMenuItem(UUID restaurantId, CreateMenuItemRequest request) {
        Restaurant restaurant = restaurantRepository.findById(restaurantId)
                .orElseThrow(() -> new IllegalArgumentException("Restaurant not found"));

        MenuCategory category = categoryRepository.findById(request.getCategoryId())
                .orElseThrow(() -> new IllegalArgumentException("Category not found"));

        MenuItem item = new MenuItem(
                restaurant,
                category,
                request.getNameMr().trim(),
                request.getNameEn().trim(),
                request.getDescriptionMr(),
                request.getDescriptionEn(),
                request.getPricePaise(),
                request.getImageUrl() != null && !request.getImageUrl().isBlank()
                        ? request.getImageUrl()
                        : "https://images.unsplash.com/photo-1546833999-b9f581a1996d?auto=format&fit=crop&w=400&q=80",
                request.isVeg(),
                request.getPortionSize() != null ? request.getPortionSize() : "Full Plate"
        );
        item.setSortOrder(request.getSortOrder());
        return menuItemRepository.save(item);
    }

    @Transactional
    public RestaurantDetailResponse updateRestaurant(UUID id, UpdateRestaurantRequest request, User adminUser) {
        Restaurant r = restaurantRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Restaurant not found"));

        if (request.getName() != null && !request.getName().isBlank()) r.setName(request.getName().trim());
        if (request.getNameMr() != null && !request.getNameMr().isBlank()) r.setNameMr(request.getNameMr().trim());
        if (request.getAddress() != null && !request.getAddress().isBlank()) r.setAddress(request.getAddress().trim());
        if (request.getContactPhone() != null && !request.getContactPhone().isBlank()) r.setContactPhone(request.getContactPhone().trim());
        if (request.getCoverImageUrl() != null && !request.getCoverImageUrl().isBlank()) r.setCoverImageUrl(request.getCoverImageUrl().trim());
        if (request.getOpeningTime() != null) r.setOpeningTime(request.getOpeningTime());
        if (request.getClosingTime() != null) r.setClosingTime(request.getClosingTime());
        if (request.getCuisineTypes() != null) r.setCuisineTypes(request.getCuisineTypes());
        if (request.getPrepTimeMinutes() > 0) r.setPrepTimeMinutes(request.getPrepTimeMinutes());
        if (request.getMinOrderPaise() > 0) r.setMinOrderPaise(request.getMinOrderPaise());
        if (request.getCommissionPct() != null) r.setCommissionPct(request.getCommissionPct());
        r.setOpen(request.isOpen());
        r.setActive(request.isActive());

        if (request.getVillage() != null && !request.getVillage().isBlank() && !request.getVillage().equalsIgnoreCase(r.getVillage())) {
            ServiceArea area = serviceAreaRepository.findByVillageNameIgnoreCase(request.getVillage().trim())
                    .orElseGet(() -> serviceAreaRepository.save(new ServiceArea(request.getVillage().trim(), request.getVillage().trim(), 3000L, 10000L)));
            r.setServiceArea(area);
            r.setVillage(area.getVillageName());
        }

        Restaurant saved = restaurantRepository.save(r);

        AuditLog audit = new AuditLog(adminUser, "UPDATE_RESTAURANT", "RESTAURANT", saved.getId().toString(),
                "Updated hotel details for " + saved.getName());
        auditLogRepository.save(audit);

        return mapToRestaurantDetailResponse(saved);
    }

    @Transactional
    public MenuItem updateMenuItem(UUID itemId, UpdateMenuItemRequest request, User adminUser) {
        MenuItem item = menuItemRepository.findById(itemId)
                .orElseThrow(() -> new IllegalArgumentException("Menu item not found"));

        if (request.getCategoryId() != null && !request.getCategoryId().equals(item.getCategory().getId())) {
            MenuCategory newCat = categoryRepository.findById(request.getCategoryId())
                    .orElseThrow(() -> new IllegalArgumentException("Category not found"));
            item.setCategory(newCat);
        }

        if (request.getNameMr() != null && !request.getNameMr().isBlank()) item.setNameMr(request.getNameMr().trim());
        if (request.getNameEn() != null && !request.getNameEn().isBlank()) item.setNameEn(request.getNameEn().trim());
        if (request.getDescriptionMr() != null) item.setDescriptionMr(request.getDescriptionMr());
        if (request.getDescriptionEn() != null) item.setDescriptionEn(request.getDescriptionEn());
        if (request.getPricePaise() > 0) item.setPricePaise(request.getPricePaise());
        if (request.getImageUrl() != null && !request.getImageUrl().isBlank()) item.setImageUrl(request.getImageUrl().trim());
        item.setVeg(request.isVeg());
        item.setAvailable(request.isAvailable());
        if (request.getPortionSize() != null && !request.getPortionSize().isBlank()) item.setPortionSize(request.getPortionSize());
        if (request.getSortOrder() >= 0) item.setSortOrder(request.getSortOrder());

        MenuItem saved = menuItemRepository.save(item);

        AuditLog audit = new AuditLog(adminUser, "UPDATE_MENU_ITEM", "MENU_ITEM", saved.getId().toString(),
                "Updated dish: " + saved.getNameEn() + " / " + saved.getNameMr());
        auditLogRepository.save(audit);

        return saved;
    }

    public RestaurantDetailResponse mapToRestaurantDetailResponse(Restaurant r) {
        RestaurantDetailResponse res = new RestaurantDetailResponse();
        res.setId(r.getId());
        res.setName(r.getName());
        res.setNameMr(r.getNameMr());
        res.setVillage(r.getVillage());
        res.setAddress(r.getAddress());
        res.setContactPhone(r.getContactPhone());
        res.setCoverImageUrl(r.getCoverImageUrl());
        res.setOpeningTime(r.getOpeningTime());
        res.setClosingTime(r.getClosingTime());
        res.setOpen(r.isOpen());
        res.setPrepTimeMinutes(r.getPrepTimeMinutes());
        res.setMinOrderPaise(r.getMinOrderPaise());
        res.setCuisineTypes(r.getCuisineTypes());

        List<MenuCategory> categories = categoryRepository.findByRestaurantOrderBySortOrderAsc(r);
        List<MenuItem> items = menuItemRepository.findByRestaurantOrderBySortOrderAsc(r);

        List<MenuCategoryResponse> catResponses = categories.stream().map(cat -> {
            MenuCategoryResponse cr = new MenuCategoryResponse(cat.getId(), cat.getNameMr(), cat.getNameEn(), cat.getSortOrder());
            List<MenuItemResponse> catItems = items.stream()
                    .filter(it -> it.getCategory().getId().equals(cat.getId()))
                    .map(it -> {
                        MenuItemResponse ir = new MenuItemResponse();
                        ir.setId(it.getId());
                        ir.setCategoryId(cat.getId());
                        ir.setNameMr(it.getNameMr());
                        ir.setNameEn(it.getNameEn());
                        ir.setDescriptionMr(it.getDescriptionMr());
                        ir.setDescriptionEn(it.getDescriptionEn());
                        ir.setPricePaise(it.getPricePaise());
                        ir.setImageUrl(it.getImageUrl());
                        ir.setVeg(it.isVeg());
                        ir.setAvailable(it.isAvailable());
                        ir.setPortionSize(it.getPortionSize());
                        ir.setSortOrder(it.getSortOrder());
                        return ir;
                    }).collect(Collectors.toList());
            cr.setItems(catItems);
            return cr;
        }).collect(Collectors.toList());

        res.setCategories(catResponses);
        return res;
    }

    @Transactional
    public void deleteMenuItem(UUID itemId) {
        menuItemRepository.deleteById(itemId);
    }
}
