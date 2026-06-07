import bcrypt from "bcryptjs";
import { PrismaClient } from "../generated/prisma";

const db = new PrismaClient();

async function main() {
  const password = process.env.SEED_PASSWORD ?? "password123";
  const passwordHash = await bcrypt.hash(password, 10);

  const lead = await db.user.upsert({
    where: { email: "lead@example.com" },
    update: { passwordHash, name: "Project Lead" },
    create: {
      email: "lead@example.com",
      name: "Project Lead",
      passwordHash,
    },
  });

  const reviewer = await db.user.upsert({
    where: { email: "reviewer@example.com" },
    update: { passwordHash, name: "Reviewer" },
    create: {
      email: "reviewer@example.com",
      name: "Reviewer",
      passwordHash,
    },
  });

  const viewer = await db.user.upsert({
    where: { email: "viewer@example.com" },
    update: { passwordHash, name: "Viewer" },
    create: {
      email: "viewer@example.com",
      name: "Viewer",
      passwordHash,
    },
  });

  const org = await db.organization.upsert({
    where: { slug: "demo-lab" },
    update: { name: "Demo Research Lab" },
    create: {
      name: "Demo Research Lab",
      slug: "demo-lab",
    },
  });

  for (const [userId, role] of [
    [lead.id, "OWNER"],
    [reviewer.id, "MEMBER"],
    [viewer.id, "MEMBER"],
  ] as const) {
    await db.organizationMember.upsert({
      where: {
        userId_organizationId: {
          userId,
          organizationId: org.id,
        },
      },
      update: { role },
      create: {
        userId,
        organizationId: org.id,
        role,
      },
    });
  }

  const screening = await db.project.upsert({
    where: {
      organizationId_slug: {
        organizationId: org.id,
        slug: "covid-screening",
      },
    },
    update: { name: "COVID Screening Review" },
    create: {
      name: "COVID Screening Review",
      slug: "covid-screening",
      organizationId: org.id,
    },
  });

  const pilot = await db.project.upsert({
    where: {
      organizationId_slug: {
        organizationId: org.id,
        slug: "pilot-study",
      },
    },
    update: { name: "Pilot Study" },
    create: {
      name: "Pilot Study",
      slug: "pilot-study",
      organizationId: org.id,
    },
  });

  const memberships = [
    { userId: lead.id, projectId: screening.id, role: "LEAD" as const },
    { userId: reviewer.id, projectId: screening.id, role: "REVIEWER" as const },
    { userId: lead.id, projectId: pilot.id, role: "LEAD" as const },
  ];

  for (const membership of memberships) {
    await db.projectMember.upsert({
      where: {
        userId_projectId: {
          userId: membership.userId,
          projectId: membership.projectId,
        },
      },
      update: { role: membership.role },
      create: membership,
    });
  }

  console.log("Seed complete.");
  console.log("Demo accounts (password from SEED_PASSWORD, default password123):");
  console.log("  lead@example.com — org owner, project lead");
  console.log("  reviewer@example.com — screening reviewer");
  console.log("  viewer@example.com — org member without project access");
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await db.$disconnect();
  });
