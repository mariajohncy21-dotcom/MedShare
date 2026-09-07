# MedShare – Initial Demonstration & Testing Credentials

> [!NOTE]
> All passwords are cryptographically hashed with salt and securely stored in MongoDB database `medshare_db` inside the `users` collection.
> In accordance with production security standards, passwords are never stored in plain text or exposed in frontend client code.

Use these credentials to sign in at `http://localhost:5173/auth/login`.

---

## 1. Central Administrator Account

| Email | Password | Role | Access Scope |
| :--- | :--- | :--- | :--- |
| `admin@medshare.com` | `MedShare@Admin2026!` | **ADMIN** | Full Regulatory Grid, Verification Console, Suspend/Reactivate/Delete Facilities, Shortage Alerts Dispatcher, Audit Logs |

---

## 2. Licensed Pharmacies (Tisaiyanvilai 627657)

All pharmacy accounts share the password: `Pharmacy@2026!`

| Pharmacy Name | Login Email | Password | Linked Facility ID |
| :--- | :--- | :--- | :--- |
| **Apollo Pharmacy – Tisaiyanvilai Main** | `apollo@pharm.com` | `Pharmacy@2026!` | `SRC-PHARM-001` |
| **MedPlus Pharmacy – Bus Stand Branch** | `medplus@pharm.com` | `Pharmacy@2026!` | `SRC-PHARM-002` |
| **Thangam Medicals & 24x7 Drug Store** | `thangam@pharm.com` | `Pharmacy@2026!` | `SRC-PHARM-003` |
| **Shifa Pharmacy & Surgical Dispenser** | `shifa@pharm.com` | `Pharmacy@2026!` | `SRC-PHARM-004` |
| **Kannan Medicals & Life Care** | `kannan@pharm.com` | `Pharmacy@2026!` | `SRC-PHARM-005` |
| **Sri Ganesh Pharmacy** | `ganesh@pharm.com` | `Pharmacy@2026!` | `SRC-PHARM-006` |
| **Jeeva Medicals & Trauma Supply** | `jeeva@pharm.com` | `Pharmacy@2026!` | `SRC-PHARM-007` |
| **Maruthi Drug Centre** | `maruthi@pharm.com` | `Pharmacy@2026!` | `SRC-PHARM-008` |
| **Annai Velankanni Pharmacy** | `annai@pharm.com` | `Pharmacy@2026!` | `SRC-PHARM-009` |
| **Sanitas 24x7 Express Medicals** | `sanitas@pharm.com` | `Pharmacy@2026!` | `SRC-PHARM-010` |

---

## 3. Multi-Speciality Hospitals (Tisaiyanvilai 627657)

All hospital accounts share the password: `Hospital@2026!`

| Hospital Name | Login Email | Password | Linked Facility ID |
| :--- | :--- | :--- | :--- |
| **Sri Ramakrishna Mission Trauma Care** | `ramakrishna@hos.com` | `Hospital@2026!` | `SRC-HOSP-001` |
| **Tisaiyanvilai Heart Care ICU Centre** | `heartcare@hos.com` | `Hospital@2026!` | `SRC-HOSP-002` |
| **Apollo Clinic & 24x7 Hospital** | `apolloclinic@hos.com` | `Hospital@2026!` | `SRC-HOSP-003` |
| **St. Luke's Multi-Speciality Hospital** | `stlukes@hos.com` | `Hospital@2026!` | `SRC-HOSP-004` |
| **Government Taluk Hospital Emergency Wing** | `tisaiyanvilaigh@hos.com` | `Hospital@2026!` | `SRC-HOSP-005` |

---

## 4. General User / Public Citizen Account

Suitable for local residents, visitors, travelers, or caregivers searching medicine availability in our city.

| Name | Email | Password | Role |
| :--- | :--- | :--- | :--- |
| **Rahul Sharma (User / Visitor)** | `patient@medshare.com` | `Patient@2026!` | **USER (Citizen)** |

---

## 5. Testing New Registrations & Mandatory Domain Rules

- Go to `/auth/register`
- Choose **User**:
  - For any citizen, resident, or out-of-town visitor looking for medicines.
  - Accepts standard email formats (`@gmail.com`, etc.).
  - Instantly `ACTIVE` and logged in.
- Choose **Pharmacy**:
  - **Mandatory Domain**: Email address **MUST** end with `@pharm.com` (e.g. `yourdispensary@pharm.com`). Any other domain will be rejected by client and server.
  - Complete the 2-step onboarding wizard. Account will be created in MongoDB with status `PENDING`.
- Choose **Hospital**:
  - **Mandatory Domain**: Email address **MUST** end with `@hos.com` (e.g. `yourhospital@hos.com`). Any other domain will be rejected by client and server.
  - Complete the 2-step onboarding wizard. Account will be created in MongoDB with status `PENDING`.
- **Approval Flow**:
  - Log in as `admin@medshare.com` / `MedShare@Admin2026!`.
  - Go to "Verifications" $\rightarrow$ Click **[ Approve ]** to grant full operational grid permissions to newly registered facilities!
