import { db } from '$lib/server/db/client';
import { commerceOrders } from '$lib/server/db/schema/commerce.schema';
import { users } from '$lib/server/db/schema/identity.schema';
import { assets } from '$lib/server/db/schema/assets.schema';
import { emailService } from '$lib/server/emails';
import { eq, and, gte, desc } from 'drizzle-orm';

export class DailyReportService {
	/**
	 * Generates and dispatches the 24-hour daily sales digest to progetatechnologies@gmail.com
	 * @param force If true, sends even if 0 sales happened (for testing or manual admin triggers).
	 * @param windowHours Number of past hours to cover (defaults to 24 hours).
	 */
	static async generateAndSendDailyDigest(force = false, windowHours = 24) {
		const since = new Date(Date.now() - windowHours * 60 * 60 * 1000);

		// Fetch all paid orders in this window
		const orders = await db
			.select({
				id: commerceOrders.id,
				amountPaise: commerceOrders.amountPaise,
				status: commerceOrders.status,
				createdAt: commerceOrders.createdAt,
				paidAt: commerceOrders.paidAt,
				userId: commerceOrders.userId,
				userName: users.name,
				userEmail: users.email,
				assetTitle: assets.title,
				assetType: assets.type
			})
			.from(commerceOrders)
			.leftJoin(users, eq(commerceOrders.userId, users.id))
			.leftJoin(assets, eq(commerceOrders.assetId, assets.id))
			.where(
				and(
					eq(commerceOrders.status, 'paid'),
					gte(commerceOrders.createdAt, since)
				)
			)
			.orderBy(desc(commerceOrders.createdAt));

		if (orders.length === 0 && !force) {
			console.log(`[DailyReportService] No sales in the last ${windowHours} hours. Skipping daily email.`);
			return {
				sent: false,
				message: `No sales in the last ${windowHours} hours. Digest skipped.`,
				count: 0
			};
		}

		// Calculate distinct students and revenue
		const uniqueUserIds = new Set(orders.map(o => o.userId));
		const totalRevenuePaise = orders.reduce((sum, o) => sum + (o.amountPaise || 0), 0);

		const dateFormatted = new Intl.DateTimeFormat('en-IN', {
			dateStyle: 'medium',
			timeZone: 'Asia/Kolkata'
		}).format(new Date());

		const formattedSales = orders.map(o => {
			const time = o.paidAt || o.createdAt;
			const timeFormatted = time ? new Intl.DateTimeFormat('en-IN', {
				dateStyle: 'short',
				timeStyle: 'short',
				timeZone: 'Asia/Kolkata'
			}).format(new Date(time)) : 'N/A';

			return {
				userName: o.userName || 'Student',
				userEmail: o.userEmail || 'No email provided',
				courseTitle: o.assetTitle || 'Course / Resource',
				amountPaise: o.amountPaise || 0,
				status: o.status,
				timeFormatted,
				orderId: o.id
			};
		});

		const result = await emailService.sendDailySalesDigest({
			dateStr: dateFormatted,
			totalStudents: uniqueUserIds.size,
			totalOrders: orders.length,
			totalRevenuePaise,
			sales: formattedSales
		});

		return {
			sent: true,
			totalStudents: uniqueUserIds.size,
			totalOrders: orders.length,
			totalRevenuePaise,
			result
		};
	}
}

