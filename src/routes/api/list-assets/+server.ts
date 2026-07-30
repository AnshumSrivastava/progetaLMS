import { json } from '@sveltejs/kit';
import { db } from '$lib/server/db/client';
import { assets } from '$lib/server/db/schema/assets.schema';

export async function GET() {
    const allAssets = await db.select().from(assets);
    return json(allAssets);
}
