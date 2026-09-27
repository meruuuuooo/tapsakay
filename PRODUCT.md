# TAPSAKAY

## Platform
Expo app for Android, iOS, and an installable web app.

## Users and purpose
Passengers book seats between route stations. Operators provision drivers and assign relas. Drivers manage multiple passenger groups and confirm station arrivals, pickups, and drop-offs.

## Confirmed implementation scope
Laravel and MySQL, email/password accounts, station-based tracking, app bookings only, local setup first. The existing TAPSAKAY identity and components remain the visual authority. No payments or background GPS in this version.

## Success
Independent passenger and driver sessions share persisted ride state. Seat reservations prevent overbooking. Account permissions protect private rides and driver actions.
