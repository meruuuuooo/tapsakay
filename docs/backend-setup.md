# Run the connected TAPSAKAY app

Requirements: PHP 8.4 with PDO MySQL, Composer, MySQL 8, Node and pnpm. The backend is in `backend/`; the Expo frontend remains at the repository root.

## 1. Create local databases

Using a MySQL administrator account, create a development database and a separate test database. Use a password you choose, rather than the placeholder below.

```sql
CREATE DATABASE tapsakay CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
CREATE DATABASE tapsakay_test CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
CREATE USER 'tapsakay'@'localhost' IDENTIFIED BY 'CHOOSE_A_LOCAL_PASSWORD';
GRANT ALL PRIVILEGES ON tapsakay.* TO 'tapsakay'@'localhost';
GRANT ALL PRIVILEGES ON tapsakay_test.* TO 'tapsakay'@'localhost';
```

## 2. Start Laravel

```bash
cd backend
composer install
cp .env.example .env
# Set DB_USERNAME and DB_PASSWORD in .env to your local database credentials.
php artisan key:generate
php artisan migrate --seed
php artisan serve --host=0.0.0.0 --port=8000
```

The seed contains the five existing route stations and approximate development coordinates. It creates no default accounts or passwords. Confirm the route coordinates before operating a real service.

In another terminal, keep offer expiration running:

```bash
cd backend
php artisan schedule:work
```

The API also expires offers when handling ride commands and state refreshes. No queue worker or Redis is required for this version. Mail is sent synchronously; local `.env` uses the log mailer.

## 3. Start Expo

```bash
pnpm install
cp .env.example .env
pnpm start
```

For web, open `http://localhost:8081`. Use **localhost for both frontend and backend**, not a mix of localhost and 127.0.0.1, so the browser can read the CSRF cookie. Browser authentication uses HttpOnly session cookies and a separate CSRF cookie. No access tokens are stored in browser storage.

For a physical phone, set `EXPO_PUBLIC_API_URL=http://YOUR_COMPUTER_LAN_IP:8000` in the frontend `.env`, then restart Expo. Phone and computer must be on the same network. Native builds store seven-day tokens in Expo SecureStore. Rebuild an existing APK to include the added native modules; an old APK will not contain them. Use HTTPS for deployed apps.

## 4. Create accounts and a vehicle

Passengers select **Create passenger account**. With `MAIL_MAILER=log`, open the verification URL written to `backend/storage/logs/laravel.log`, then tap **Check verification** in the app. Logs contain sensitive verification/reset links; keep them private.

Provision a driver and a new vehicle through the operator terminal:

```bash
cd backend
php artisan driver:create
php artisan vehicle:assign
```

Both commands prompt for input; the password is hidden. The driver must verify their email too. Each driver has one assigned vehicle; new vehicles start empty, offline, at the first station. The current command creates a new assignment; it does not transfer an existing vehicle or rewrite ride history.

Use separate browsers/incognito windows or phones for the driver and each passenger. The driver taps **Go online**. Two passengers can book separate groups, and the driver accepts and picks them up individually. Confirm stations in order, then drop each group off at its destination. At the terminal, with no active rides, start a new route.

Only foreground apps send driver heartbeats. After two minutes without a heartbeat a vehicle stops receiving new bookings. Going offline does not cancel existing commitments. Offers expire after two minutes; declined, expired, and cancelled requests release their seats. Passengers can submit a new booking afterward.

## Password recovery

Select **Forgot password?**. The email link opens the web password reset screen. A mobile user can reset in their browser and return to the app; the mobile form also accepts the token from the email URL. A successful reset revokes all existing sessions and tokens.

## Checks

```bash
pnpm typecheck
pnpm test
pnpm build:web
cd backend
php artisan test
vendor/bin/pint --test
```

Backend tests run migrations against **tapsakay_test**, never the development database. They require MySQL and permission to create/drop tables in that test database. They include separate-process concurrent booking tests. `.env.testing` may override host, username, password, or socket; keep `DB_DATABASE=tapsakay_test`.

## Production checklist

- Serve the PWA and API through HTTPS on the same origin. Route `/api/*`, `/sanctum/*`, `/email/*`, and `/up` to Laravel's `public/index.php`; serve Expo's `dist/` for the frontend. Keep all other backend files outside the web root.
- Set `APP_ENV=production`, `APP_DEBUG=false`, `APP_URL` and `FRONTEND_URL` to the public HTTPS origin, `SESSION_SECURE_COOKIE=true`, and exact `SANCTUM_STATEFUL_DOMAINS` / `CORS_ALLOWED_ORIGINS`. The Sanctum setting uses hostnames, optionally with ports, without a scheme; CORS uses full origins.
- Configure `TRUSTED_PROXIES` only for your proxy IPs. Configure SMTP settings and a real sender. Keep APP_KEY and database credentials secret; do not change APP_KEY during routine deploys.
- Use a dedicated runtime database account restricted to the production schema; apply migrations using a separate migration account. Back up MySQL and test restore procedures.
- Run `composer install --no-dev --optimize-autoloader`, `php artisan migrate --force`, and `php artisan config:cache`. Run `php artisan schedule:run` every minute through cron.
- Monitor `/up`, server errors, failed email delivery, 401/429 rates, stale drivers, and database availability. Logs must not include passwords or bearer tokens.
- The PWA caches static assets only. Bookings and driver actions require a connection; private data is not persisted in the frontend and API responses use `Cache-Control: no-store`.

There is no live GPS, push messaging, payment processing, walk-in occupancy, reverse-route travel, or administrator dashboard. The single-route lock favors correctness for this small fleet; measure lock contention before scaling the service.

## Verification performed

The implementation was checked with MySQL 8.0: 16 backend tests (112 assertions), including simultaneous bookings in separate processes; 14 frontend tests; TypeScript; Laravel Pint; and the production web build. Browser checks exercised registration, emailed verification, session-cookie login/logout, and two passengers sharing a ride with one driver in independent sessions. Completed histories survived reload. Native credential storage is implemented, but a physical Android/iOS device build was not exercised in this workspace.
