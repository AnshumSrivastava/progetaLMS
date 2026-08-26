/**
 * Seed: Instructor Profile Rich Data + Testimonials
 *
 * Populates the 5 seeded instructors with realistic profile content
 * and creates sample approved testimonials.
 */
import 'dotenv/config';
import { neon } from '@neondatabase/serverless';
import { createId } from '@paralleldrive/cuid2';

const sql = neon(process.env.DATABASE_URL);

async function seed() {
  console.log('=== SEEDING INSTRUCTOR PROFILES ===\n');

  // Fetch all teacher/admin/owner users
  const instructors = await sql`
    SELECT u.id, u.name, u.email, ip.id AS profile_id
    FROM users u
    JOIN identity_profiles ip ON ip.user_id = u.id
    WHERE u.role IN ('teacher', 'admin', 'owner')
    ORDER BY u.created_at ASC
  `;

  console.log(`Found ${instructors.length} instructors to seed.\n`);

  const profileData = [
    {
      handle: 'anshum-srivastava',
      headline: 'Cloud Security Architect & Penetration Testing Lead | AWS Security Specialist',
      about: `Anshum Srivastava is a Senior Security Engineer and Cloud Security Architect with over 8 years of hands-on experience across Fortune 500 environments and high-growth startups.

He specialises in **AWS security posture management**, **penetration testing**, **red team operations**, and building **zero-trust architectures** from the ground up. He holds CEH, OSCP, and AWS Security Specialty certifications.

In mentoring sessions, Anshum focuses on **practical, repeatable skills** rather than theory. His approach: give you the exact mental models and tools to solve the problem in front of you, and then make sure you can solve the next one yourself.

**What students work on with Anshum:**
- AWS IAM misconfiguration audits
- Penetration testing methodology and report writing
- Career roadmap from developer → security engineer
- CTF strategy and OSCP exam preparation
- Architecture reviews for startup security programs`,
      yearsExp: 8,
      languages: ['English', 'Hindi'],
      credentials: [
        { title: 'Certified Ethical Hacker (CEH)', issuer: 'EC-Council', year: 2019 },
        { title: 'OSCP', issuer: 'Offensive Security', year: 2021 },
        { title: 'AWS Security Specialty', issuer: 'Amazon Web Services', year: 2022 }
      ],
      videoIntroUrl: null,
      socialLinks: {
        linkedin: 'https://linkedin.com/in/anshum-srivastava',
        github: 'https://github.com/anshum',
        twitter: null,
        website: null
      },
      isFeatured: true
    },
    {
      handle: 'progeta-technologies',
      headline: 'Platform Architect & Full-Stack Security Educator',
      about: `The Progeta Technologies instructor account represents senior engineers from the Progeta platform team who run group and 1-on-1 sessions on full-stack security, DevSecOps, and security engineering for developers.

Sessions cover everything from **secure coding patterns** and **dependency auditing** to **CI/CD pipeline hardening** and **Kubernetes security** for engineering teams.`,
      yearsExp: 10,
      languages: ['English'],
      credentials: [
        { title: 'CKS – Certified Kubernetes Security Specialist', issuer: 'CNCF', year: 2023 }
      ],
      videoIntroUrl: null,
      socialLinks: { linkedin: 'https://linkedin.com/company/progeta', github: 'https://github.com/progeta', twitter: null, website: 'https://progeta.in' },
      isFeatured: false
    },
    {
      handle: 'anmol-madan',
      headline: 'Senior Cloud Security Engineer | Kubernetes & Container Security',
      about: `Anmol Madan is a cloud security specialist with deep expertise in **container security**, **Kubernetes hardening**, and **multi-cloud security governance**. He has led security programmes at scale for teams in fintech and e-commerce domains.

His 1-on-1 sessions are ideal for engineers who want to break into cloud security or level up their container security posture. He brings real war stories from production incidents to every session.`,
      yearsExp: 7,
      languages: ['English', 'Hindi', 'Punjabi'],
      credentials: [
        { title: 'CKS', issuer: 'CNCF', year: 2022 },
        { title: 'Google Professional Cloud Security Engineer', issuer: 'Google', year: 2023 }
      ],
      videoIntroUrl: null,
      socialLinks: { linkedin: 'https://linkedin.com/in/anmol-madan', github: null, twitter: null, website: null },
      isFeatured: false
    },
    {
      handle: 'mananpreet-kaur',
      headline: 'AppSec Lead & Secure SDLC Advocate | OWASP Chapter Lead',
      about: `Mananpreet Kaur is an Application Security Lead and secure software development champion. With 6+ years in AppSec, she has built security champions programmes, run threat modelling workshops, and embedded security into agile delivery pipelines at enterprise scale.

She is an active OWASP contributor and chapter organiser. Her sessions focus on **web application security**, **secure code review**, **SAST/DAST tooling**, and preparing for roles like Application Security Engineer and Security Champion.`,
      yearsExp: 6,
      languages: ['English', 'Hindi', 'Punjabi'],
      credentials: [
        { title: 'Certified Application Security Engineer (CASE)', issuer: 'EC-Council', year: 2021 },
        { title: 'GWAPT', issuer: 'GIAC', year: 2022 }
      ],
      videoIntroUrl: null,
      socialLinks: { linkedin: 'https://linkedin.com/in/mananpreet-kaur', github: null, twitter: 'https://twitter.com/mananpreet_k', website: null },
      isFeatured: true
    }
  ];

  for (let i = 0; i < instructors.length; i++) {
    const inst = instructors[i];
    const profile = profileData[i] || profileData[0]; // fallback to first profile

    await sql`
      UPDATE identity_profiles SET
        mentoring_handle         = ${profile.handle + (i > 0 && i >= profileData.length ? `-${i}` : '')},
        mentoring_headline        = ${profile.headline},
        mentoring_about           = ${profile.about},
        mentoring_years_exp       = ${profile.yearsExp},
        mentoring_languages       = ${profile.languages},
        mentoring_credentials     = ${JSON.stringify(profile.credentials)},
        mentoring_video_intro_url = ${profile.videoIntroUrl},
        mentoring_social_links    = ${JSON.stringify(profile.socialLinks)},
        mentoring_is_featured     = ${profile.isFeatured},
        updated_at                = now()
      WHERE user_id = ${inst.id}
    `;
    console.log(`   → Updated profile for ${inst.name} (handle: ${profile.handle})`);
  }

  // Seed testimonials (admin-curated, pre-approved)
  console.log('\nSeeding testimonials...');
  const testimonials = [
    {
      instructorIndex: 0,
      reviewerName: 'Rohan Mehta',
      reviewerRole: 'Security Analyst at Wipro',
      rating: 5,
      body: 'Anshum helped me structure my OSCP preparation in just 2 sessions. His approach to privilege escalation methodology was the clearest explanation I had heard after months of struggling. Highly recommend.'
    },
    {
      instructorIndex: 0,
      reviewerName: 'Divya Sharma',
      reviewerRole: 'Cloud Engineer at TCS',
      rating: 5,
      body: 'I came in with a half-baked AWS IAM architecture and left with a complete remediation plan and the confidence to present it to my CTO. Anshum makes complex security concepts genuinely accessible.'
    },
    {
      instructorIndex: 0,
      reviewerName: 'Kunal Verma',
      reviewerRole: 'Software Developer',
      rating: 4,
      body: 'Really practical session on moving from development into security. Got clear guidance on what certifications to target first and a 6-month roadmap. Worth every rupee.'
    },
    {
      instructorIndex: 3,
      reviewerName: 'Priya Nair',
      reviewerRole: 'QA Engineer at Freshworks',
      rating: 5,
      body: 'Mananpreet walked me through threat modelling for our payment flow in a way that immediately clicked. She has a gift for translating security concepts into engineering language.'
    },
    {
      instructorIndex: 2,
      reviewerName: 'Aditya Joshi',
      reviewerRole: 'Platform Engineer at Razorpay',
      rating: 5,
      body: "Anmol's Kubernetes security session was eye-opening. Found 3 critical misconfigurations in our cluster that same day. This is the kind of hands-on knowledge you simply do not get from courses alone."
    }
  ];

  for (const t of testimonials) {
    const instructor = instructors[t.instructorIndex];
    if (!instructor) continue;

    await sql`
      INSERT INTO mentoring_testimonials (
        id, instructor_id, reviewer_name, reviewer_role, rating, body, is_published, created_at, updated_at
      ) VALUES (
        ${createId()},
        ${instructor.id},
        ${t.reviewerName},
        ${t.reviewerRole},
        ${t.rating},
        ${t.body},
        true,
        now(),
        now()
      )
    `;
    console.log(`   → Testimonial created for ${instructor.name} from ${t.reviewerName}`);
  }

  console.log('\n=== PROFILE SEED COMPLETE ===');
}

seed().catch(err => {
  console.error('Seed failed:', err);
  process.exit(1);
});
