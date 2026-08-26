import { neon } from '@neondatabase/serverless';
import 'dotenv/config';

const generateId = () => Math.random().toString(36).substring(2, 12) + Math.random().toString(36).substring(2, 12);

async function run() {
  const sql = neon(process.env.DATABASE_URL);
  console.log("Starting dynamic data seed for ProgetaLMS...");

  const users = await sql`SELECT id, name, email, role FROM users`;
  if (users.length === 0) {
    console.error("No users found");
    return;
  }

  const owner = users.find(u => u.role === 'owner') || users[0];
  const teacher = users.find(u => u.role === 'teacher') || owner;

  console.log(`Using Owner: ${owner.name} (${owner.id}) & Teacher: ${teacher.name} (${teacher.id})`);

  // ── 1. COURSES ──────────────────────────────────────────────
  const sampleCourses = [
    {
      title: "Practical Linux & Network Defense",
      slug: "practical-linux-network-defense",
      type: "html",
      price_paise: 149900,
      thumbnail: "https://images.unsplash.com/photo-1629654297299-c8506221ca97?auto=format&fit=crop&w=600&q=80",
      description: "Master essential Linux administration, packet filtering with iptables, firewall architectures, and SSH hardening.",
      metadata: {
        category: "Network Security",
        level: "Beginner",
        duration: "8 hours",
        instructor: teacher.name || "Progeta Instructor",
        tags: ["Linux", "Networking", "Defense", "SysAdmin"]
      }
    },
    {
      title: "Hands-on Web Application Penetration Testing",
      slug: "hands-on-web-app-pentesting",
      type: "html",
      price_paise: 249900,
      thumbnail: "https://images.unsplash.com/photo-1550751827-4bd374c3f58b?auto=format&fit=crop&w=600&q=80",
      description: "Exploit and remediate OWASP Top 10 vulnerabilities including SQL injection, cross-site scripting (XSS), and Broken Access Control.",
      metadata: {
        category: "Penetration Testing",
        level: "Intermediate",
        duration: "14 hours",
        instructor: "Security Team",
        tags: ["WebSec", "OWASP", "BurpSuite", "Pentest"]
      }
    },
    {
      title: "AWS Cloud Infrastructure Security Architecture",
      slug: "aws-cloud-security-architecture",
      type: "markdown",
      price_paise: 399900,
      thumbnail: "https://images.unsplash.com/photo-1451187580459-43490279c0fa?auto=format&fit=crop&w=600&q=80",
      description: "Architect multi-account secure AWS topologies using IAM policies, GuardDuty, AWS WAF, and CloudTrail auditing.",
      metadata: {
        category: "Cloud Security",
        level: "Advanced",
        duration: "18 hours",
        instructor: "Cloud Sec Lead",
        tags: ["AWS", "Cloud", "IAM", "Architecture"]
      }
    },
    {
      title: "SOC Analyst Fundamentals: SIEM & Log Analysis",
      slug: "soc-analyst-fundamentals",
      type: "html",
      price_paise: 0,
      thumbnail: "https://images.unsplash.com/photo-1563986768609-322da13575f3?auto=format&fit=crop&w=600&q=80",
      description: "Learn how modern Security Operations Centers triage alerts, ingest syslog/Windows Event logs, and investigate incidents.",
      metadata: {
        category: "Compliance",
        level: "Beginner",
        duration: "5 hours",
        instructor: "SOC Lead",
        tags: ["SOC", "SIEM", "IncidentResponse", "Logs"]
      }
    }
  ];

  const courseIds = [];
  for (const c of sampleCourses) {
    const existing = await sql`SELECT id FROM assets WHERE slug = ${c.slug}`;
    let id;
    if (existing.length > 0) {
      id = existing[0].id;
      await sql`
        UPDATE assets 
        SET status = 'published', visibility = 'public', title = ${c.title}, description = ${c.description}, 
            thumbnail = ${c.thumbnail}, price_paise = ${c.price_paise}, metadata = ${JSON.stringify(c.metadata)}
        WHERE id = ${id}
      `;
      console.log(`Updated Course: ${c.title} (${id})`);
    } else {
      id = generateId();
      await sql`
        INSERT INTO assets (id, slug, title, description, thumbnail, type, status, visibility, owner_id, price_paise, metadata)
        VALUES (${id}, ${c.slug}, ${c.title}, ${c.description}, ${c.thumbnail}, ${c.type}, 'published', 'public', ${teacher.id}, ${c.price_paise}, ${JSON.stringify(c.metadata)})
      `;
      console.log(`Created Course: ${c.title} (${id})`);
    }
    courseIds.push(id);
  }

  // ── 2. DIGITAL RESOURCES ─────────────────────────────────────
  const sampleResources = [
    {
      title: "OWASP Top 10 Red Teaming Cheatsheet (2025 Ed.)",
      slug: "owasp-top-10-cheatsheet",
      type: "download",
      price_paise: 0,
      description: "A quick-reference PDF summarizing injection payloads, auth bypasses, and validation defenses.",
      metadata: { format: "PDF", pages: 18, sizeMb: 2.4 }
    },
    {
      title: "Linux Command Line Security Hardening Guide",
      slug: "linux-cli-hardening-guide",
      type: "download",
      price_paise: 49900,
      description: "Production checklist for securing Ubuntu and RHEL servers with CIS benchmark compliance.",
      metadata: { format: "PDF", pages: 42, sizeMb: 5.1 }
    }
  ];

  const resourceIds = [];
  for (const r of sampleResources) {
    const existing = await sql`SELECT id FROM assets WHERE slug = ${r.slug}`;
    let id;
    if (existing.length > 0) {
      id = existing[0].id;
      await sql`
        UPDATE assets 
        SET status = 'published', visibility = 'public', title = ${r.title}, description = ${r.description}, 
            price_paise = ${r.price_paise}, metadata = ${JSON.stringify(r.metadata)}
        WHERE id = ${id}
      `;
    } else {
      id = generateId();
      await sql`
        INSERT INTO assets (id, slug, title, description, type, status, visibility, owner_id, price_paise, metadata)
        VALUES (${id}, ${r.slug}, ${r.title}, ${r.description}, ${r.type}, 'published', 'public', ${teacher.id}, ${r.price_paise}, ${JSON.stringify(r.metadata)})
      `;
    }
    resourceIds.push(id);
    console.log(`Created/Updated Resource: ${r.title} (${id})`);
  }

  // ── 3. CERTIFICATION EXAMS ──────────────────────────────────
  const sampleCerts = [
    {
      title: "Certified Network Defense Practitioner (CNDP)",
      slug: "certified-network-defense-practitioner",
      price_paise: 199900,
      description: "Rigorous 60-minute examination covering TCP/IP protocol analysis, Nmap scanning, packet capture, and IDS configuration.",
      metadata: {
        level: "Intermediate",
        duration: "60 min",
        questions: 40,
        passingScore: "75%",
        isProctored: true,
        tags: ["Networking", "Firewalls", "Nmap", "Wireshark"]
      }
    },
    {
      title: "Certified Cloud Security Auditor (CCSA)",
      slug: "certified-cloud-security-auditor",
      price_paise: 299900,
      description: "Advanced proctored assessment verifying competence in AWS IAM governance, S3 bucket encryption, and zero-trust policies.",
      metadata: {
        level: "Advanced",
        duration: "90 min",
        questions: 60,
        passingScore: "80%",
        isProctored: true,
        tags: ["Cloud", "AWS", "ZeroTrust", "Audit"]
      }
    },
    {
      title: "Cybersecurity Fundamentals 101",
      slug: "cybersecurity-fundamental-101",
      price_paise: 0,
      description: "Introductory baseline assessment validating core principles of the CIA triad, basic Linux commands, and social engineering awareness.",
      metadata: {
        level: "Beginner",
        duration: "30 min",
        questions: 20,
        passingScore: "70%",
        isProctored: false,
        tags: ["Basics", "CIA Triad", "Linux", "Phishing"]
      }
    }
  ];

  const certIds = [];
  for (const cert of sampleCerts) {
    const existing = await sql`SELECT id FROM assets WHERE slug = ${cert.slug}`;
    let id;
    if (existing.length > 0) {
      id = existing[0].id;
      await sql`
        UPDATE assets 
        SET status = 'published', visibility = 'public', title = ${cert.title}, description = ${cert.description}, 
            price_paise = ${cert.price_paise}, metadata = ${JSON.stringify(cert.metadata)}
        WHERE id = ${id}
      `;
    } else {
      id = generateId();
      await sql`
        INSERT INTO assets (id, slug, title, description, type, status, visibility, owner_id, price_paise, metadata)
        VALUES (${id}, ${cert.slug}, ${cert.title}, ${cert.description}, 'cert_test', 'published', 'public', ${teacher.id}, ${cert.price_paise}, ${JSON.stringify(cert.metadata)})
      `;
    }
    certIds.push(id);
    console.log(`Created/Updated Cert Exam: ${cert.title} (${id})`);
  }

  // ── 4. LIVE EVENTS ──────────────────────────────────────────
  await sql`DELETE FROM events`;
  const sampleEvents = [
    {
      id: generateId(),
      title: "Live Masterclass: Exploiting and Defending Web APIs",
      description: "Interactive 2-hour technical teardown of JWT attacks, broken object level authorization (BOLA), and rate-limit bypasses.",
      host_id: teacher.id,
      date: new Date(Date.now() + 86400000 * 3), // 3 days in future
      link: "https://meet.google.com/xyz-progeta-live",
      type: "public"
    },
    {
      id: generateId(),
      title: "Cybersecurity Career & Portfolio AMA with Instructors",
      description: "Ask questions on breaking into Red Teaming vs. SOC Analysis, resume review, and lab building tips.",
      host_id: owner.id,
      date: new Date(Date.now() + 86400000 * 7), // 7 days in future
      link: "https://meet.google.com/abc-progeta-ama",
      type: "public"
    }
  ];

  for (const ev of sampleEvents) {
    await sql`
      INSERT INTO events (id, title, description, host_id, date, link, type)
      VALUES (${ev.id}, ${ev.title}, ${ev.description}, ${ev.host_id}, ${ev.date}, ${ev.link}, ${ev.type})
    `;
    console.log(`Created Live Event: ${ev.title}`);
  }

  // ── 5. COHORTS & CLASSES ────────────────────────────────────
  await sql`DELETE FROM cohort_suggested_assets`;
  await sql`DELETE FROM cohort_memberships`;
  await sql`DELETE FROM cohorts`;

  const cohort1Id = generateId();
  await sql`
    INSERT INTO cohorts (id, course_id, name, instructor_id, start_date, end_date, is_active)
    VALUES (${cohort1Id}, ${courseIds[0]}, 'Cybersecurity FastTrack Cohort (Winter 2026)', ${teacher.id}, ${new Date()}, ${new Date(Date.now() + 86400000 * 60)}, true)
  `;

  // Attach suggested course to cohort
  if (courseIds.length > 1) {
    await sql`
      INSERT INTO cohort_suggested_assets (id, cohort_id, asset_id)
      VALUES (${generateId()}, ${cohort1Id}, ${courseIds[1]})
    `;
  }

  // ── 6. ENROLLMENTS & OWNERSHIP FOR USERS ─────────────────────
  // Grant all users access to the courses and cohort
  for (const u of users) {
    // Enroll in cohort
    await sql`
      INSERT INTO cohort_memberships (id, cohort_id, user_id, role)
      VALUES (${generateId()}, ${cohort1Id}, ${u.id}, 'student')
      ON CONFLICT DO NOTHING
    `;

    // Grant first course and first resource ownership
    if (courseIds.length > 0) {
      await sql`
        INSERT INTO asset_ownership (id, asset_id, owner_id, source)
        VALUES (${generateId()}, ${courseIds[0]}, ${u.id}, 'grant')
        ON CONFLICT DO NOTHING
      `;
    }
    if (resourceIds.length > 0) {
      await sql`
        INSERT INTO asset_ownership (id, asset_id, owner_id, source)
        VALUES (${generateId()}, ${resourceIds[0]}, ${u.id}, 'grant')
        ON CONFLICT DO NOTHING
      `;
    }
  }

  console.log("✅ Dynamic data seeding completed successfully!");
}

run().catch(err => {
  console.error("Seed failed:", err);
  process.exit(1);
});
