# Electronics Store API (Stage 3)

ASP.NET Core 10 minimal API foundation with EF Core 10 and PostgreSQL/Npgsql.
This stage contains the data model, local-development OpenAPI UI, and health
checks only. It does not contain catalog, checkout, order, upload, or admin
authentication endpoints.

## Prerequisites

- .NET 10 SDK.
- A PostgreSQL database matching `../../database/supabase-schema.sql` for the
  database health check. No database is needed to build or run liveness.

## Configure locally

The connection string is read from `ConnectionStrings:StoreDatabase`. For local
development, use .NET user secrets (run from this directory):

```powershell
dotnet user-secrets init
dotnet user-secrets set "ConnectionStrings:StoreDatabase" "Host=YOUR_HOST;Port=5432;Database=YOUR_DATABASE;Username=YOUR_USER;Password=YOUR_PASSWORD;SSL Mode=Require"
```

Replace the placeholders in your local terminal. Do not put credentials in
source control or `VITE_*` frontend variables. Alternatively set the environment
variable `ConnectionStrings__StoreDatabase` in the API process environment.
No connection string is included in this project.

## Run

```powershell
dotnet restore
dotnet run
```

In Development, Swagger UI is available at `/swagger`. `GET /health` is a
liveness check. `GET /health/database` attempts a short database connectivity
check only when a connection string is configured; it returns HTTP 503 with a
generic state when unconfigured or unavailable and does not disclose provider
errors or connection details.

## Schema and migrations

`StoreDbContext` maps the approved tables and PostgreSQL types. The SQL file in
`../../database/supabase-schema.sql` remains the schema/security source of truth,
including Supabase role grants, RLS, policies, the settings singleton seed row,
and business constraints. An EF migration is intentionally not included yet:
the first deployable migration must preserve those Supabase-specific security
objects and every SQL check/functional index; a generated EF-only migration
would omit some of them and could create an unsafe or divergent schema. Stage 3
has not connected to a database or applied a migration.

## Database security

The server owns all database access. Do not expose the PostgreSQL login or
Supabase service-role key to the browser. For Supabase, use the dedicated
server-side database role and RLS policy arrangement documented in
`../../database/README.md`; never run the API using a superuser or a role with
`BYPASSRLS` in production.
