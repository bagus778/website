import { NextRequest, NextResponse } from 'next/server';
import mongoose from 'mongoose';
import User from '@/models/User';
import Store from '@/models/Store';
import { hashPassword } from '@/lib/auth';
import fs from 'fs/promises';
import path from 'path';

export async function POST(request: NextRequest) {
  try {
    const envPath = path.join(process.cwd(), '.env');
    const envExists = await fs.access(envPath).then(() => true).catch(() => false);

    if (envExists) {
      return NextResponse.json(
        { message: 'Setup already completed. .env file exists.' },
        { status: 400 }
      );
    }

    const body = await request.json();
    const {
      storeName,
      adminUsername,
      adminEmail,
      adminPassword,
      mongodbUri,
      siteUrl,
      currency,
      currencySymbol,
      jwtSecret,
      pluginApiKey,
      stripeSecretKey,
      stripePublicKey,
      stripeWebhookSecret,
      coinbaseApiKey,
      coinbaseWebhookSecret,
    } = body;

    if (!storeName || !adminUsername || !adminEmail || !adminPassword || !mongodbUri || !jwtSecret || !pluginApiKey) {
      return NextResponse.json(
        { message: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Connect directly to the database with provided URI
    // Don't use cached connection since we need to use a custom URI
    if (mongoose.connection.readyState === 0) {
      await mongoose.connect(mongodbUri);
    } else if (mongoose.connection.readyState === 1) {
      // Already connected, check if it's the right database
      // Get the current connection string from the connection object
      const currentHost = mongoose.connection.host;
      const currentDb = mongoose.connection.name;

      // Parse the provided URI to compare
      const url = new URL(mongodbUri.replace('mongodb://', 'http://'));
      const newHost = url.hostname;
      const newDb = url.pathname.slice(1); // Remove leading slash

      if (currentHost !== newHost || currentDb !== newDb) {
        // Disconnect and reconnect with new URI
        await mongoose.connection.close();
        await mongoose.connect(mongodbUri);
      }
    }

    const existingStore = await Store.findOne();
    if (existingStore) {
      return NextResponse.json(
        { message: 'Setup already completed. Store configuration exists.' },
        { status: 400 }
      );
    }

    const existingUser = await User.findOne({ role: 'admin' });
    if (existingUser) {
      return NextResponse.json(
        { message: 'Admin user already exists' },
        { status: 400 }
      );
    }

    const hashedPassword = await hashPassword(adminPassword);
    const adminUser = await User.create({
      username: adminUsername,
      email: adminEmail,
      password: hashedPassword,
      role: 'admin',
    });

    const store = await Store.create({
      name: storeName,
      currency: currency || 'USD',
      currencySymbol: currencySymbol || '$',
      features: {
        maintenanceMode: false,
      },
    });

    const envContent = `# Database
MONGODB_URI=${mongodbUri}

# JWT
JWT_SECRET=${jwtSecret}

# Plugin API
PLUGIN_API_KEY=${pluginApiKey}

# Payment Gateway - REQUIRED for checkout to work

# Stripe - For Credit/Debit Card payments
# Get your keys from: https://dashboard.stripe.com/test/apikeys
PAYMENT_PROVIDER=stripe
STRIPE_SECRET_KEY=${stripeSecretKey || ''}
NEXT_PUBLIC_STRIPE_PUBLIC_KEY=${stripePublicKey || ''}
# Get webhook secret from: https://dashboard.stripe.com/test/webhooks
# Webhook URL: https://your-domain.com/api/stripe/webhook
# Events to enable: payment_intent.succeeded, payment_intent.payment_failed
STRIPE_WEBHOOK_SECRET=${stripeWebhookSecret || ''}

# Coinbase Commerce - For Cryptocurrency payments (Bitcoin, Ethereum, USDC, etc.)
# Get your API key from: https://beta.commerce.coinbase.com/settings/security
# NO MERCHANT FEES - only blockchain network fees paid by customer
# You must create a wallet https://beta.commerce.coinbase.com/payments
# Or else it will give errors when trying to buy with crypto
# Also set a business name https://beta.commerce.coinbase.com/settings/business
COINBASE_COMMERCE_API_KEY=${coinbaseApiKey || ''}
# Get webhook secret from: https://beta.commerce.coinbase.com/settings/notifications
# Webhook URL: https://your-domain.com/api/coinbase/webhook
# Events to enable: charge:confirmed, charge:failed, charge:pending, charge:resolved
COINBASE_COMMERCE_WEBHOOK_SECRET=${coinbaseWebhookSecret || ''}

# Email (Optional)
SMTP_HOST=
SMTP_PORT=587
SMTP_USER=
SMTP_PASS=
EMAIL_FROM=

# App Configuration
NEXT_PUBLIC_SITE_NAME=${storeName}
NEXT_PUBLIC_SITE_URL=${siteUrl || 'http://localhost:3000'}
`;

    await fs.writeFile(envPath, envContent, 'utf-8');

    const uploadsDir = path.join(process.cwd(), 'public', 'uploads');
    try {
      await fs.mkdir(uploadsDir, { recursive: true });
      await fs.mkdir(path.join(uploadsDir, 'products'), { recursive: true });
      await fs.mkdir(path.join(uploadsDir, 'categories'), { recursive: true });
      await fs.mkdir(path.join(uploadsDir, 'store'), { recursive: true });
    } catch (err) {
    }

    return NextResponse.json({
      success: true,
      message: 'Setup completed successfully',
      data: {
        adminId: adminUser._id,
        storeId: store._id,
        pluginApiKey,
      },
    });
  } catch (error: any) {
    console.error('Setup error:', error);
    return NextResponse.json(
      { message: error.message || 'Setup failed' },
      { status: 500 }
    );
  }
}