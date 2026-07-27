import { neon } from '@neondatabase/serverless';

async function main() {
  const sql = neon("postgresql://neondb_owner:npg_ofZTuJjdO04B@ep-calm-haze-ay9a3yr4.c-5.us-east-2.aws.neon.tech/neondb?sslmode=require");
  
  try {
    console.log("Updating all asset prices to 100 paise (1 Rupee)...");
    await sql`UPDATE assets SET price_paise = 100;`;
    console.log("Prices updated successfully!");
  } catch(e) {
    console.error(e);
  }
}
main();
