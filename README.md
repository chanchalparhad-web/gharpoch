# GharPoch (घरपोच) — हायपरलोकल फूड डिलिव्हरी प्लॅटफॉर्म

> **ऑर्डर तुमची, डिलिव्हरी आमची!**  
> Hyperlocal Food Ordering and Delivery Progressive Web Application (PWA) designed for Karodi, Asegaon, Sajapur, and nearby rural villages in Maharashtra.

---

## 🚀 Key Capabilities

- **Customer PWA**: Mobile-first Indian food ordering, live village selection, cart, and real-time status tracking with order chimes.
- **Hotel Manager Portal**: Live order bell notifications, real-time accept/reject, preparation time updates, and stock management.
- **Village Delivery Fleet**: Order pickup, route view, OTP delivery completion verification, and daily earnings tracking.
- **Admin HQ Operations**: Central dispatch, live order auditing, override controls, village commission & fee matrix, and **full hotel & menu dish editing with live image preview**.

---

## 🛠️ Tech Stack

- **Frontend**: Vite + React 19 + TypeScript + Tailwind CSS v4 + Lucide Icons + PWA manifest
- **Backend**: Spring Boot 3.2.3 + Java 17 + Spring Security + JWT Authentication
- **Database**: PostgreSQL 16
- **Real-time**: Polling & Live SSE/Event Stream support

---

## 🔑 Login Credentials Directory

| Role / भूमिका | Name | Login Phone | Password |
| :--- | :--- | :--- | :--- |
| **Central Admin (प्रशासक)** | GharPoch HQ Operations | `9999999999` | `admin123` |
| **Hotel (हॉटेल साई कृपा)** | Hotel Sai Krupa (Karodi) | `9822011111` | `hotel123` |
| **Hotel (हॉटेल माऊली)** | Hotel Mauli (Karodi) | `9822088888` | `hotel123` |
| **Hotel (हॉटेल ७/१२)** | Hotel 7/12 (Karodi Toll Plaza) | `7972976954` | `hotel123` |
| **Hotel (श्री फॅमिली रेस्टॉरंट)** | Shree Family Restaurant (Karodi) | `9822022222` | `hotel123` |
| **Hotel (मराठा दरबार)** | Hotel Maratha Darbar (Karodi) | `9822098881` | `maratha123` |
| **Delivery Rider (रायडर १)** | Sachin Gaikwad (Karodi, MH-20-DZ-1428) | `9766033333` | `rider123` |
| **Delivery Rider (रायडर २)** | Vikas Chavan (Asegaon, MH-20-EF-9872) | `9766044444` | `rider123` |
| **Customer (ग्राहक)** | Rahul Deshmukh | `9890055555` | `customer123` |

---

## 💻 Local Setup & Development

### 1. Database Setup
Create a PostgreSQL database named `gharpoch`:
```sql
CREATE DATABASE gharpoch;
```

### 2. Backend Setup
```bash
cd backend
./mvnw clean spring-boot:run
```
The backend starts on `http://localhost:8080`. Data seeds automatically on first run.

### 3. Frontend Setup
```bash
cd frontend
npm install
npm run dev
```
The frontend dev server starts on `http://localhost:5173`.

---

## 🌐 Deploy to Vercel

1. Import this repository into Vercel.
2. Select **Root Directory** as `frontend` (or use root with Vite preset).
3. Set Environment Variable:
   - `VITE_API_URL`: Your deployed Spring Boot API URL (e.g., `https://your-backend.railway.app`)
4. Deploy!
