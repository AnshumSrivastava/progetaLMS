import { read } from '$app/server';
import outfitRegularUrl from '@fontsource/outfit/files/outfit-latin-400-normal.woff?url';

export async function GET() {
	const buf = await read(outfitRegularUrl).arrayBuffer();
	return new Response(String(buf.byteLength));
}
