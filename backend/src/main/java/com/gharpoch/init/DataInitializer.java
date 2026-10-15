package com.gharpoch.init;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.gharpoch.model.*;
import com.gharpoch.repository.*;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.boot.CommandLineRunner;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.*;

@Component
public class DataInitializer implements CommandLineRunner {

        private static final Logger log = LoggerFactory.getLogger(DataInitializer.class);

        private final UserRepository userRepository;
        private final ServiceAreaRepository serviceAreaRepository;
        private final RestaurantRepository restaurantRepository;
        private final RestaurantUserRepository restaurantUserRepository;
        private final MenuCategoryRepository categoryRepository;
        private final MenuItemRepository menuItemRepository;
        private final DeliveryPartnerRepository partnerRepository;
        private final OrderRepository orderRepository;
        private final OrderStatusHistoryRepository statusHistoryRepository;
        private final PasswordEncoder passwordEncoder;
        private final ObjectMapper objectMapper = new ObjectMapper();

        public DataInitializer(UserRepository userRepository,
                        ServiceAreaRepository serviceAreaRepository,
                        RestaurantRepository restaurantRepository,
                        RestaurantUserRepository restaurantUserRepository,
                        MenuCategoryRepository categoryRepository,
                        MenuItemRepository menuItemRepository,
                        DeliveryPartnerRepository partnerRepository,
                        OrderRepository orderRepository,
                        OrderStatusHistoryRepository statusHistoryRepository,
                        PasswordEncoder passwordEncoder) {
                this.userRepository = userRepository;
                this.serviceAreaRepository = serviceAreaRepository;
                this.restaurantRepository = restaurantRepository;
                this.restaurantUserRepository = restaurantUserRepository;
                this.categoryRepository = categoryRepository;
                this.menuItemRepository = menuItemRepository;
                this.partnerRepository = partnerRepository;
                this.orderRepository = orderRepository;
                this.statusHistoryRepository = statusHistoryRepository;
                this.passwordEncoder = passwordEncoder;
        }

        @Override
        @Transactional
        public void run(String... args) throws Exception {
                if (userRepository.count() > 0) {
                        log.info("Database already seeded with GharPoch accounts and restaurants.");
                        return;
                }

                log.info("Seeding GharPoch Hyperlocal Platform with real Karodi village data...");

                // 1. Service Areas (Villages)
                ServiceArea karodi = serviceAreaRepository.save(new ServiceArea("Karodi", "करोडी", 3000L, 10000L));
                ServiceArea asegaon = serviceAreaRepository.save(new ServiceArea("Asegaon", "आसेगाव", 4000L, 12000L));
                ServiceArea sajapur = serviceAreaRepository.save(new ServiceArea("Sajapur", "साजापूर", 3500L, 10000L));

                // 2. Core Users (Admin, Hotel Staff, Riders, Customer)
                User admin = userRepository.save(new User("9999999999", "GharPoch Admin (प्रशासक)",
                                passwordEncoder.encode("admin123"), Role.ROLE_ADMIN));
                User hotelUser1 = userRepository.save(new User("9822011111", "Suresh Patil (हॉटेल साई कृपा)",
                                passwordEncoder.encode("hotel123"), Role.ROLE_RESTAURANT_STAFF));
                User hotelUser2 = userRepository.save(new User("9822022222", "Ganesh Shinde (श्री फॅमिली रेस्टॉरंट)",
                                passwordEncoder.encode("hotel123"), Role.ROLE_RESTAURANT_STAFF));
                User riderUser1 = userRepository.save(new User("9766033333", "Sachin Gaikwad (सचिन गायकवाड)",
                                passwordEncoder.encode("rider123"), Role.ROLE_DELIVERY_PARTNER));
                User riderUser2 = userRepository.save(new User("9766044444", "Vikas Chavan (विकास चव्हाण)",
                                passwordEncoder.encode("rider123"), Role.ROLE_DELIVERY_PARTNER));
                User customer = userRepository.save(new User("9890055555", "Rahul Deshmukh (राहुल देशमुख)",
                                passwordEncoder.encode("customer123"), Role.ROLE_CUSTOMER));

                // 3. Delivery Partners
                DeliveryPartner partner1 = new DeliveryPartner(riderUser1, karodi, "MH-20-DZ-1428");
                partner1.setAvailabilityStatus("ONLINE");
                partnerRepository.save(partner1);

                DeliveryPartner partner2 = new DeliveryPartner(riderUser2, asegaon, "MH-20-EF-9872");
                partner2.setAvailabilityStatus("ONLINE");
                partnerRepository.save(partner2);

                // 4. Restaurant 1: Hotel Sai Krupa
                Restaurant r1 = new Restaurant();
                r1.setName("Hotel Sai prasad");
                r1.setNameMr("हॉटेल साई कृपा");
                r1.setServiceArea(karodi);
                r1.setVillage("Karodi");
                r1.setAddress("Near Bus Stand, Karodi Phata, Chhatrapati Sambhajinagar");
                r1.setContactPhone("9822011111");
                r1.setOpeningTime("11:00 AM");
                r1.setClosingTime("11:00 PM");
                r1.setOpen(true);
                r1.setActive(true);
                r1.setPrepTimeMinutes(30);
                r1.setCommissionPct(new BigDecimal("10.00"));
                r1.setMinOrderPaise(10000L); // ₹100
                r1.setCuisineTypes("Maharashtrian, Handi Special, Roti & Bhakri");
                r1.setCoverImageUrl(
                                "https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?auto=format&fit=crop&w=800&q=80");
                r1.setLogoUrl("https://images.unsplash.com/photo-1546833999-b9f581a1996d?auto=format&fit=crop&w=200&q=80");
                r1 = restaurantRepository.save(r1);

                restaurantUserRepository.save(new RestaurantUser(r1, hotelUser1, "OWNER"));

                // Restaurant 2: Shree Family Restaurant
                Restaurant r2 = new Restaurant();
                r2.setName("Shree Family Restaurant");
                r2.setNameMr("श्री फॅमिली रेस्टॉरंट");
                r2.setServiceArea(karodi);
                r2.setVillage("Karodi");
                r2.setAddress("Asegaon Road, Opp. Primary Health Center, Karodi");
                r2.setContactPhone("9822022222");
                r2.setOpeningTime("10:30 AM");
                r2.setClosingTime("10:30 PM");
                r2.setOpen(true);
                r2.setActive(true);
                r2.setPrepTimeMinutes(35);
                r2.setCommissionPct(new BigDecimal("10.00"));
                r2.setMinOrderPaise(12000L); // ₹120
                r2.setCuisineTypes("Pure Veg, Thali, Kolhapuri & Rice");
                r2.setCoverImageUrl(
                                "https://images.unsplash.com/photo-1552566626-52f8b828add9?auto=format&fit=crop&w=800&q=80");
                r2.setLogoUrl("https://images.unsplash.com/photo-1589301760014-d929f3979dbc?auto=format&fit=crop&w=200&q=80");
                r2 = restaurantRepository.save(r2);

                restaurantUserRepository.save(new RestaurantUser(r2, hotelUser2, "OWNER"));

                // 5. Menu Categories & Items for Hotel Sai Krupa
                MenuCategory catHandi = categoryRepository
                                .save(new MenuCategory(r1, "हांडी स्पेशल", "Handi Special", 1));
                MenuCategory catKolhapuri = categoryRepository
                                .save(new MenuCategory(r1, "कोल्हापुरी आणि मसाला", "Kolhapuri & Masala", 2));
                MenuCategory catRoti = categoryRepository
                                .save(new MenuCategory(r1, "रोटी / भाकरी", "Roti & Bhakari", 3));
                MenuCategory catRice = categoryRepository
                                .save(new MenuCategory(r1, "राईस आणि पुलाव", "Rice & Pulao", 4));

                MenuItem item1 = menuItemRepository.save(new MenuItem(r1, catHandi, "मिक्स व्हेज हांडी",
                                "Mix Veg Handi",
                                "ताजी भाजी आणि खास घाटी मसाला ग्रेव्ही",
                                "Assorted vegetables cooked in rich aromatic handi gravy",
                                18000L,
                                "https://images.unsplash.com/photo-1546833999-b9f581a1996d?auto=format&fit=crop&w=400&q=80",
                                true, "1 Handi"));

                MenuItem item2 = menuItemRepository.save(new MenuItem(r1, catHandi, "पनीर हांडी", "Paneer Handi",
                                "ताजे पनीर आणि मलईदार ग्रेव्ही", "Fresh cottage cheese in creamy clay-pot gravy",
                                22000L,
                                "https://images.unsplash.com/photo-1631452180519-c014fe946bc7?auto=format&fit=crop&w=400&q=80",
                                true, "1 Handi"));

                MenuItem item3 = menuItemRepository.save(new MenuItem(r1, catHandi, "काजू हांडी", "Kaju Handi",
                                "काजूची शाही चव", "Premium whole cashews simmered in rich handi sauce",
                                24000L,
                                "https://images.unsplash.com/photo-1626777552726-4a6b54c97e46?auto=format&fit=crop&w=400&q=80",
                                true, "1 Handi"));

                MenuItem item4 = menuItemRepository.save(new MenuItem(r1, catKolhapuri, "व्हेज कोल्हापुरी",
                                "Veg Kolhapuri",
                                "झणझणीत अस्सल कोल्हापुरी तिखट", "Authentic spicy Maharashtrian Kolhapuri style gravy",
                                17000L,
                                "https://images.unsplash.com/photo-1589301760014-d929f3979dbc?auto=format&fit=crop&w=400&q=80",
                                true, "Full Plate"));

                MenuItem item5 = menuItemRepository.save(new MenuItem(r1, catKolhapuri, "शेव भाजी स्पेशल",
                                "Shev Bhaji Special",
                                "गावरान चवीची प्रसिद्ध शेव भाजी", "Crispy spiced gram flour noodles in spicy red rassa",
                                14000L,
                                "https://images.unsplash.com/photo-1589302168068-964664d93dc0?auto=format&fit=crop&w=400&q=80",
                                true, "Full Plate"));

                MenuItem item6 = menuItemRepository.save(new MenuItem(r1, catKolhapuri, "वांग्याचे भरीत",
                                "Baingan Bharta",
                                "चुलीवर भाजलेले गावरान वांग्याचे भरीत",
                                "Smoky fire-roasted mashed eggplant with garlic & spices",
                                15000L,
                                "https://images.unsplash.com/photo-1631452180519-c014fe946bc7?auto=format&fit=crop&w=400&q=80",
                                true, "Full Plate"));

                MenuItem item7 = menuItemRepository.save(new MenuItem(r1, catRoti, "ज्वारीची भाकरी", "Jowar Bhakri",
                                "चुलीवरची गरमागरम ज्वारीची भाकरी", "Traditional handcrafted healthy jowar flatbread",
                                2500L,
                                "https://images.unsplash.com/photo-1565557623262-b51c2513a641?auto=format&fit=crop&w=400&q=80",
                                true, "1 Piece"));

                MenuItem item8 = menuItemRepository.save(new MenuItem(r1, catRoti, "बाजरीची भाकरी", "Bajra Bhakri",
                                "गावरान बाजरीची भाकरी", "Rustic pearl millet flatbread baked on earthen tawa",
                                2500L,
                                "https://images.unsplash.com/photo-1565557623262-b51c2513a641?auto=format&fit=crop&w=400&q=80",
                                true, "1 Piece"));

                MenuItem item9 = menuItemRepository.save(new MenuItem(r1, catRoti, "तंदूर रोटी", "Tandoori Roti",
                                "गरम तंदुरी रोटी", "Freshly baked wheat roti in clay tandoor",
                                2000L,
                                "https://images.unsplash.com/photo-1565557623262-b51c2513a641?auto=format&fit=crop&w=400&q=80",
                                true, "1 Piece"));

                MenuItem item10 = menuItemRepository.save(new MenuItem(r1, catRoti, "बटर रोटी", "Butter Roti",
                                "शुद्ध लोणी लावलेली तंदुरी रोटी", "Crispy tandoori roti layered with fresh butter",
                                2500L,
                                "https://images.unsplash.com/photo-1565557623262-b51c2513a641?auto=format&fit=crop&w=400&q=80",
                                true, "1 Piece"));

                MenuItem item11 = menuItemRepository.save(new MenuItem(r1, catRice, "दाल खिचडी", "Dal Khichdi",
                                "तूप लावलेली साजूक दाल खिचडी",
                                "Wholesome aromatic rice and yellow lentils with desi ghee tadka",
                                14000L,
                                "https://images.unsplash.com/photo-1546833999-b9f581a1996d?auto=format&fit=crop&w=400&q=80",
                                true, "Full"));

                MenuItem item12 = menuItemRepository.save(new MenuItem(r1, catRice, "व्हेज पुलाव", "Veg Pulao",
                                "बासमती तांदळाचा खमंग पुलाव",
                                "Long-grain basmati rice with farm vegetables and whole spices",
                                16000L,
                                "https://images.unsplash.com/photo-1563379091339-03b21ab4a4f8?auto=format&fit=crop&w=400&q=80",
                                true, "Full"));

                // 6. Categories & Items for Shree Family Restaurant
                MenuCategory catThali = categoryRepository
                                .save(new MenuCategory(r2, "स्पेशल थाळी", "Special Thalis", 1));
                MenuCategory catR2Sabji = categoryRepository
                                .save(new MenuCategory(r2, "भाजी आणि ग्रेव्ही", "Sabji & Gravy", 2));

                menuItemRepository.save(new MenuItem(r2, catThali, "महाराजा व्हेज थाळी", "Maharaja Veg Thali",
                                "२ भाज्या, २ भाकरी किंवा ४ चपाती, दाल, भात, गोड, पापड, लोणचे",
                                "Complete feast: 2 sabjis, 2 bhakris/4 chapatis, dal, rice, sweet, papad",
                                25000L,
                                "https://images.unsplash.com/photo-1589301760014-d929f3979dbc?auto=format&fit=crop&w=400&q=80",
                                true, "1 Thali"));

                menuItemRepository.save(new MenuItem(r2, catThali, "साधी गावरान थाळी", "Gavran Thali",
                                "शेव भाजी किंवा वांग्याचे भरीत, २ भाकरी, लसूण चटणी, कांदा",
                                "Traditional village thali: Shev bhaji/bharta, 2 bhakris, garlic chutney, onion",
                                16000L,
                                "https://images.unsplash.com/photo-1589302168068-964664d93dc0?auto=format&fit=crop&w=400&q=80",
                                true, "1 Thali"));

                menuItemRepository.save(new MenuItem(r2, catR2Sabji, "काजू पनीर मसाला", "Kaju Paneer Masala",
                                "काजू आणि पनीरचे उत्कृष्ट मिश्रण", "Cashew nuts and paneer in rich royal gravy",
                                23000L,
                                "https://images.unsplash.com/photo-1631452180519-c014fe946bc7?auto=format&fit=crop&w=400&q=80",
                                true, "Full"));

                // 7. Seed Sample Demonstrative Order
                Order sampleOrder = new Order();
                sampleOrder.setPublicOrderNumber("GP-20261015-1001");
                sampleOrder.setCustomer(customer);
                sampleOrder.setRestaurant(r1);
                sampleOrder.setStatus(OrderStatus.PLACED);
                sampleOrder.setPaymentMethod(PaymentMethod.COD);
                sampleOrder.setPaymentStatus(PaymentStatus.PENDING);
                sampleOrder.setSubtotalPaise(23000L); // ₹230 (Mix Veg Handi ₹180 + 2 Bhakri ₹50)
                sampleOrder.setDeliveryFeePaise(3000L); // ₹30
                sampleOrder.setPlatformFeePaise(500L); // ₹5
                sampleOrder.setDiscountPaise(0L);
                sampleOrder.setTotalPaise(26500L); // ₹265
                sampleOrder.setCustomerNameSnapshot("Rahul Deshmukh (राहुल देशमुख)");
                sampleOrder.setCustomerPhoneSnapshot("9890055555");
                sampleOrder.setRestaurantNameSnapshot("Hotel Sai Krupa");
                sampleOrder.setRestaurantPhoneSnapshot("9822011111");
                sampleOrder.setDeliveryOtp("4821");
                sampleOrder.setSpecialInstructions("कृपया भाजी मध्यम तिखट ठेवा. (Medium spicy)");

                Map<String, String> addr = new HashMap<>();
                addr.put("name", "Rahul Deshmukh");
                addr.put("phone", "9890055555");
                addr.put("village", "Karodi");
                addr.put("addressLine", "House No. 45, Near Gram Panchayat Office");
                addr.put("landmark", "Opposite Hanuman Temple");
                sampleOrder.setAddressSnapshotJson(objectMapper.writeValueAsString(addr));

                List<OrderItem> items = new ArrayList<>();
                items.add(new OrderItem(sampleOrder, item1, item1.getNameMr(), item1.getNameEn(), 18000L, 1,
                                "1 Handi"));
                items.add(new OrderItem(sampleOrder, item7, item7.getNameMr(), item7.getNameEn(), 2500L, 2, "1 Piece"));
                sampleOrder.setItems(items);

                Order savedOrder = orderRepository.save(sampleOrder);

                statusHistoryRepository.save(new OrderStatusHistory(
                                savedOrder, null, OrderStatus.PLACED, customer, "ROLE_CUSTOMER",
                                "Initial demonstrative order placed via GharPoch"));

                log.info("GharPoch seed data successfully loaded into PostgreSQL!");
                log.info("Demo Accounts ready:");
                log.info("  Admin:      Phone: 9999999999 / Password: admin123");
                log.info("  Restaurant: Phone: 9822011111 / Password: hotel123 (Hotel Sai Krupa)");
                log.info("  Delivery:   Phone: 9766033333 / Password: rider123 (Sachin Gaikwad)");
                log.info("  Customer:   Phone: 9890055555 / Password: customer123 (Rahul Deshmukh)");
        }
}
