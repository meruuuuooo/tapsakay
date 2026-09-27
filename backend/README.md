# TAPSAKAY API

Laravel 13 + MySQL 8 + Sanctum. See [setup and operations](../docs/backend-setup.md) and [API contract](../docs/api.md).

```bash
composer install
cp .env.example .env
# Configure your MySQL credentials.
php artisan key:generate
php artisan migrate --seed
php artisan serve
```

Use `php artisan schedule:work` locally. Tests require a separate `tapsakay_test` MySQL database; run `php artisan test`.
