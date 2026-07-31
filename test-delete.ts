import { db } from './src/lib/server/db/client';
import { assessmentQuestions } from './src/lib/server/db/schema/assessments.schema';
import { eq } from 'drizzle-orm';

async function testDelete() {
    try {
        const q = await db.select().from(assessmentQuestions).limit(1);
        if (q.length === 0) {
            console.log("No questions found");
            return;
        }
        const questionId = q[0].id;
        console.log("Trying to delete question:", questionId);
        await db.delete(assessmentQuestions).where(eq(assessmentQuestions.id, questionId));
        console.log("Success!");
    } catch (e) {
        console.error("SQL Error:", e.message || e);
    }
}
testDelete();
