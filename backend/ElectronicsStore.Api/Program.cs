using ElectronicsStore.Api.Data;
using Microsoft.EntityFrameworkCore;

var builder = WebApplication.CreateBuilder(args);

builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen();

var connectionString = builder.Configuration.GetConnectionString("StoreDatabase");
if (!string.IsNullOrWhiteSpace(connectionString))
{
    builder.Services.AddDbContext<StoreDbContext>(options => options.UseNpgsql(connectionString));
}

var app = builder.Build();

if (app.Environment.IsDevelopment())
{
    app.UseSwagger();
    app.UseSwaggerUI();
}

app.MapGet("/health", () => Results.Ok(new { status = "healthy" }))
    .WithName("Health")
    .WithTags("Health");

app.MapGet("/health/database", async (IServiceProvider services, CancellationToken cancellationToken) =>
{
    var db = services.GetService<StoreDbContext>();
    if (db is null)
        return Results.Json(new { status = "not-configured" }, statusCode: StatusCodes.Status503ServiceUnavailable);

    try
    {
        var canConnect = await db.Database.CanConnectAsync(cancellationToken);
        return canConnect
            ? Results.Ok(new { status = "available" })
            : Results.Json(new { status = "unavailable" }, statusCode: StatusCodes.Status503ServiceUnavailable);
    }
    catch
    {
        // Keep connection details and provider exceptions out of health responses.
        return Results.Json(new { status = "unavailable" }, statusCode: StatusCodes.Status503ServiceUnavailable);
    }
})
    .WithName("DatabaseHealth")
    .WithTags("Health");

app.Run();

public partial class Program { }
