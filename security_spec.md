# Security Specification - AdminPro Ops Hub

## 1. Data Invariants
- A `CallLog` must have a valid `vendorName`, `purpose`, and `adminId` matching the creator.
- A `TravelBooking` must have a `type` (flight/hotel), `status`, and `date`.
- A `CabScheduling` must have a `pickupTime`, `origin`, and `destination`.
- A `VendorRegistration` must have `vendorName` and `items`.
- All writes require an authenticated and email-verified user.
- Users can only edit/delete their own `CallLog` entries, but can read all logs (team environment).
- Gate registrations, bookings, and cabs are shared across the admin team.

## 2. The "Dirty Dozen" Payloads (Rejected)

1. **Identity Spoofing**: `CallLog` with `adminId` not matching `request.auth.uid`.
2. **Schema Poisoning**: `CallLog` with a 1MB `notes` string.
3. **Ghost Field**: `CallLog` with an extra field `isVerified: true`.
4. **Invalid Enum**: `TravelBooking` with `type: 'submarine'`.
5. **Unauthorized Access**: Unauthenticated user trying to read `vendorRegistrations`.
6. **Future Spoofing**: `CallLog` with a hardcoded `timestamp` from the future (manual override).
7. **Invalid ID**: Document creation with a 2KB junk string as ID.
8. **PII Leak**: `VendorRegistration` containing a field `socialSecurityNumber` (not in schema).
9. **State Shortcut**: `TravelBooking` updated from `pending` to `confirmed` by a user without proper permissions (if tiers existed; for now, strict field verification).
10. **Resource Exhaustion**: `VendorRegistration` with an array of 1000 items (not allowed, only single string per items).
11. **Type Error**: `TravelBooking` with `price` as a string instead of number.
12. **Anonymous Write**: Anonymous user (not email-verified) trying to log a call.

## 3. Test Runner (Draft)

(Conceptual - all those payloads must return PERMISSION_DENIED)
