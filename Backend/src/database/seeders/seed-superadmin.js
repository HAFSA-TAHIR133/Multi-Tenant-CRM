import bcrypt from 'bcrypt';
import dotenv from "dotenv";
dotenv.config();
import { sequelize, User, Tenant } from '../../models/index.js';
import { UserRole } from '../../constants/user-roles.js';

async function seedSuperAdmin() {
  try {
    await sequelize.authenticate();
    console.log('DB connected');

    // 1. Create or fetch system tenant
    const systemSlug = 'system';
    let systemTenant = await Tenant.findOne({ where: { slug: systemSlug } });

    if (!systemTenant) {
      systemTenant = await Tenant.create({
        name: 'System',
        slug: systemSlug,
        domain: null,
        status: 'active',
        settings: {},
      });
      console.log('System tenant created:', systemTenant.id);
    } 
    else {
      console.log('System tenant already exists:', systemTenant.id);
    }

    // 2. Create super admin under system tenant
    const email = 'superadmin@gmail.com';
    const plainPassword = 'superadmin133'; 

    const existing = await User.findOne({ where: { email } });
    if (existing) {
      console.log('Super admin already exists:', existing.email);
      return;
    }

    const hashedPassword = await bcrypt.hash(plainPassword, 10);

    const user = await User.create({
      name: 'Super Admin',
      email,
      password: hashedPassword,
      role: UserRole.SUPERADMIN, // 3
      tenantId: systemTenant.id, 
      isActive: true,
      emailVerified: true,
      lastLogin: null,
    });

    console.log('Super admin created:', {
      id: user.id,
      email: user.email,
      role: user.role,
      tenantId: user.tenantId,
    });
  } catch (err) {
    console.error('Error seeding super admin:', err);
  } finally {
    process.exit(0);
  }
}

seedSuperAdmin();