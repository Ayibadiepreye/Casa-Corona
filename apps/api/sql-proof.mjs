
import pkg from 'pg';
const { Client } = pkg;

const client = new Client({
  connectionString: 'postgresql://neondb_owner:npg_7MNuAlDZiG8j@ep-falling-lake-aoia7z56-pooler.c-2.ap-southeast-1.aws.neon.tech/neondb?sslmode=require',
});

await client.connect();

const result = await client.query(`
  SELECT
    (SELECT COUNT(*) FROM users WHERE role = 'admin') AS admins,
    (SELECT COUNT(*) FROM vendors) AS vendors,
    (SELECT COUNT(*) FROM bookings) AS bookings,
    (SELECT COUNT(*) FROM messages) AS messages,
    (SELECT COUNT(*) FROM conversations) AS convs,
    (SELECT value->>'registration_fee' FROM platform_settings WHERE key = 'pricing') AS reg_fee
`);

console.log(JSON.stringify(result.rows[0], null, 2));
await client.end();
