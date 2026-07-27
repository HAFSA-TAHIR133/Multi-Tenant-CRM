import { sequelize, Tenant } from '../../models/index.js';

async function seedTestTenant() {
  try {
    await sequelize.authenticate();

    const tenant = await Tenant.create({
      name: 'Ayesha Noor',
      slug: 'ayesha-noor',
      domain: 'ashcash.com',
      status: 'active',
      settings: {},
    });

    console.log('Test tenant created:', {
      id: tenant.id,
      slug: tenant.slug,
    });
  } catch (err) {
    console.error(err);
  } finally {
    process.exit(0);
  }
}

seedTestTenant();