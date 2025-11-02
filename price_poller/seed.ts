// -- migrate:break
// -- This is an empty migration.

// -- Timescale + Continuous Aggregates
// -- @prisma-migrate no-transaction
// CREATE EXTENSION IF NOT EXISTS timescaledb CASCADE;

// SELECT create_hypertable('"Trade"', 'timestamp', if_not_exists => TRUE);
// -- convert this trade table that i hve into the hypertable  and timestamp is the column by which we will use to partiotion the data overtime (timedb functionality)

// -- materialized viw stores query results physically in db.
// -- CreateMaterializedView
// -- @prisma-migrate no-transaction

// CREATE MATERIALIZED VIEW candles_1m
// -- this is not a mv it is a continuous aggregeate , optimized for tsdb , incrementally refresh te db
// WITH (timescaledb.continuous) AS
// SELECT
//     time_bucket('1 minutes', timestamp) AS bucket, --defining the time how much we need like kitna time gap timestamp is the criteria
//     symbol,
//     first(price, timestamp) AS open, --first order
//     MAX(price) AS high, -- max price in that specific interval
//     MIN(price) AS low, -- min price in that specific interval
//     last(price, timestamp) AS close, -- last pricd at when t\he code executed
//     SUM(quantity) AS volume  --total trading volume tis bucket can increase
// FROM "Trade"
// GROUP BY bucket, symbol; -- grop data by time bucket and symbol

// CREATE MATERIALIZED VIEW candles_5m
// WITH (timescaledb.continuous) AS
// SELECT
//     time_bucket('5 minutes', timestamp) AS  bucket,
//     symbol,
//     first(price, timestamp) AS open,
//     MAX(price) AS high,
//     MIN(price) as low,
//     last(price, timestamp) AS close,
//     SUM(quantity) AS volume
// FROM "Trade"
// GROUP BY bucket, symbol;

// CREATE MATERIALIZED VIEW candles_1d
// WITH (timescaledb.continuous) AS
// SELECT
//     time_bucket('1 day', timestamp) AS  bucket,
//     symbol,
//     first(price, timestamp) AS open,
//     MAX(price) AS high,
//     MIN(price) as low,
//     last(price, timestamp) AS close,
//     SUM(quantity) AS volume
// FROM "Trade"
// GROUP BY bucket, symbol;

// SELECT add_continuous_aggregate_policy (
//     'candles_1m', --table name (view )
//     start_offset => INTERVAL '20 minutes', --start offset (look back ) like how much previous data (raw data that has not been processed) it will look for
//     end_offset => INTERVAL '1 minute', --end offset same but opposite like the prev min is live data(aggregeating so we need this ), this data is aggregeating we cant use this buckt in refresh policy that is updating so we leave last min bucket
//     schedule_interval => INTERVAL '30 seconds' --  this will tell that it needs to active every 30 seconds(similar to \the cron job logic)
// );
// --https://docs.tigerdata.com/api/latest/continuous-aggregates/add_continuous_aggregate_policy/    (docs)

// SELECT add_continuous_aggregate_policy (
//     'candles_5m',
//     start_offset => INTERVAL '1 hour',
//     end_offset => INTERVAL '5 minutes',
//     schedule_interval => INTERVAL '1 minute'
// );

// SELECT add_continuous_aggregate_policy (
//     'candles_1d',
//     start_offset => INTERVAL '2 months',
//     end_offset => INTERVAL '1 day',
//     schedule_interval => INTERVAL '1 hour'
// );

// -- SELECT add_continuous_aggregate_policy('conditions_summary',
// --   start_offset => INTERVAL '1 month',
// --   end_offset => INTERVAL '1 hour',
// --   schedule_interval => INTERVAL '1 hour');

import { Client } from "pg";

const client = new Client({
  host: "timescale_db",
  port: 5432,
  user: "user",
  password: "XYZ@123",
  database: "trades_db",
});

async function initializeTimescale() {
  await client.connect();

  await client.query(`CREATE EXTENSION IF NOT EXISTS timescaledb CASCADE;`);

  await client.query(`
    SELECT create_hypertable('"Trade"', 'timestamp', if_not_exists => TRUE);
  `);

  await client.query(`
    CREATE MATERIALIZED VIEW IF NOT EXISTS candles_1m
    WITH (timescaledb.continuous) AS
    SELECT 
        time_bucket('1 minute', timestamp) AS bucket,
        symbol,
        first(price, timestamp) AS open,
        MAX(price) AS high,
        MIN(price) AS low,
        last(price, timestamp) AS close,
        SUM(quantity) AS volume
    FROM "Trade"
    GROUP BY bucket, symbol
    WITH NO DATA;
  `);

  await client.query(`
    CREATE MATERIALIZED VIEW IF NOT EXISTS candles_1w
    WITH (timescaledb.continuous) AS
    SELECT 
        time_bucket('1 week', timestamp) AS bucket,
        symbol,
        first(price, timestamp) AS open,
        MAX(price) AS high,
        MIN(price) AS low,
        last(price, timestamp) AS close,
        SUM(quantity) AS volume
    FROM "Trade"
    GROUP BY bucket, symbol
    WITH NO DATA;
  `);

  await client.query(`
    CREATE MATERIALIZED VIEW IF NOT EXISTS candles_1d
    WITH (timescaledb.continuous) AS
    SELECT 
        time_bucket('1 day', timestamp) AS bucket,
        symbol,
        first(price, timestamp) AS open,
        MAX(price) AS high,
        MIN(price) AS low,
        last(price, timestamp) AS close,
        SUM(quantity) AS volume
    FROM "Trade"
    GROUP BY bucket, symbol
    WITH NO DATA;
  `);

  await client.query(`
    SELECT add_continuous_aggregate_policy(
      'candles_1m',
      start_offset => INTERVAL '20 minutes',
      end_offset => INTERVAL '1 minute',
      schedule_interval => INTERVAL '30 seconds'
    );
  `);

  await client.query(`
    SELECT add_continuous_aggregate_policy(
      'candles_1w',
      start_offset => INTERVAL '3 weeks',
      end_offset => INTERVAL '1 week',
      schedule_interval => INTERVAL '1 day'
    );
  `);

  await client.query(`
    SELECT add_continuous_aggregate_policy(
      'candles_1d',
      start_offset => INTERVAL '2 months',
      end_offset => INTERVAL '1 day',
      schedule_interval => INTERVAL '1 hour'
    );
  `);

  await client.end();
  console.log("TimescaleDB hypertable + continuous aggregates initialized!");
}

initializeTimescale().catch((err) => {
  console.error("  error :", err);
  process.exit(1);
});
